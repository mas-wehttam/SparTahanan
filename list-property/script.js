// Show the number of saved properties in the navigation.
function loadPropertyIds(key) {
  try {
    const ids = JSON.parse(localStorage.getItem(key));
    const propertyIds = [];
    if (Array.isArray(ids)) {
      for (const id of ids) {
        if (typeof id === 'string') {
          propertyIds.push(id);
        }
      }
    }
    return propertyIds;
  } catch {
    return [];
  }
}

function updateSavedCount() {
  const count = loadPropertyIds('saved').length;
  const badge = document.querySelector('.saved-count');
  badge.textContent = count;
  badge.hidden = count === 0;
}

updateSavedCount();

// IndexedDB stores form submissions and attached photos in this browser.
function saveSubmission(kind, fields, photos, showResult) {
  let reported = false;

  function finish(id) {
    if (!reported) {
      reported = true;
      showResult(id);
    }
  }

  let request;
  try {
    request = indexedDB.open('spartahanan-submissions', 1);
  } catch {
    finish(null);
    return;
  }
  request.onupgradeneeded = function () {
    request.result.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
  };
  request.onerror = function () {
    finish(null);
  };
  request.onblocked = function () {
    finish(null);
  };
  request.onsuccess = function () {
    const database = request.result;
    if (reported) {
      database.close();
      return;
    }
    try {
      const transaction = database.transaction('submissions', 'readwrite');
      const store = transaction.objectStore('submissions');
      const entry = store.add({
        kind: kind,
        fields: fields,
        photos: photos,
        savedAt: new Date().toISOString()
      });
      transaction.oncomplete = function () {
        database.close();
        finish(entry.result);
      };
      transaction.onabort = function () {
        database.close();
        finish(null);
      };
    } catch {
      database.close();
      finish(null);
    }
  };
}

// Collect the text fields. Photo files and multiple amenity choices are handled separately.
function readFormFields(formData) {
  const fields = {};
  for (const name of formData.keys()) {
    fields[name] = formData.get(name);
  }
  return fields;
}

const form = document.querySelector('#listing-form');
const fields = form.elements;
const preview = document.querySelector('#property-preview');
const statusMessage = document.querySelector('#property-status');
const photoInput = document.querySelector('#photo-input');
const photoDrop = document.querySelector('#photo-drop');
const photoMessage = document.querySelector('#photo-message');
const uploadGallery = document.querySelector('#upload-gallery');
const choosePhotos = document.querySelector('#choose-photos');
const photos = [];
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const photoLimit = 10;
const photoSizeLimit = 5 * 1024 * 1024;

// Update the preview as the owner fills in the form.
function money(amount) {
  return '₱' + amount.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}

function joinDetails(details) {
  const filled = [];
  for (const detail of details) {
    if (detail.trim()) {
      filled.push(detail.trim());
    }
  }
  return filled.join(' · ');
}

function showPreview(name, value) {
  preview.querySelector('[data-preview="' + name + '"]').textContent = value;
}

function updateReview() {
  const capacity = fields.capacity.valueAsNumber;
  const occupied = fields.occupied.valueAsNumber;
  const spaces = capacity - occupied;
  const overCapacity = occupied > capacity;
  fields.occupied.setCustomValidity(overCapacity ? 'Current occupants cannot exceed the room capacity.' : '');

  let spacesLabel = '—';
  let roomAvailability = '';
  if (Number.isFinite(spaces) && !overCapacity) {
    spacesLabel = spaces;
    roomAvailability = spaces + ' available';
  }
  document.querySelector('#spaces-left').textContent = spacesLabel;

  let campus = '';
  if (fields.campus.value) {
    campus = fields.campus.options[fields.campus.selectedIndex].textContent.trim();
  }
  const bathroom = fields.bathroom.value ? fields.bathroom.value + ' bathroom' : '';
  const photoCount = photos.length + (photos.length === 1 ? ' photo' : ' photos');
  showPreview('property', fields.property.value.trim() || 'Your property');
  showPreview('scope', joinDetails([fields.type.value, campus, fields.gender.value]));
  showPreview('location', joinDetails([fields.address.value, fields.barangay.value, fields.city.value]));
  showPreview('room', joinDetails([fields.room.value, roomAvailability, bathroom]));
  showPreview('owner', joinDetails([fields.owner.value, fields.phone.value, fields.contact.value]));
  showPreview('photos', photoCount);
  showPreview('basis', fields.basis.value ? 'per ' + fields.basis.value + ' / month' : 'Monthly rent');

  let rentLabel = '—';
  let moveInLabel = '';
  if (fields.rent.value) {
    const rent = fields.rent.valueAsNumber;
    const total = rent + Number(fields.advance.value) + Number(fields.deposit.value);
    rentLabel = money(rent);
    moveInLabel = 'Move-in: ' + money(total);
  }
  showPreview('rent', rentLabel);
  showPreview('move-in', moveInLabel);
}

// Show the chosen photos with a button to remove each one.
function renderUploads() {
  uploadGallery.textContent = '';
  for (let index = 0; index < photos.length; index++) {
    const photo = photos[index];
    const tile = document.createElement('div');
    const image = document.createElement('img');
    image.src = photo.url;
    image.alt = '';
    const caption = document.createElement('p');
    caption.className = 'meta';
    caption.textContent = photo.file.name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'text-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + photo.file.name);
    remove.addEventListener('click', function () {
      URL.revokeObjectURL(photo.url);
      photos.splice(index, 1);
      photoMessage.textContent = '';
      renderUploads();
      const nextButton = uploadGallery.querySelectorAll('button')[index] || choosePhotos;
      nextButton.focus();
    });
    tile.appendChild(image);
    tile.appendChild(caption);
    tile.appendChild(remove);
    uploadGallery.appendChild(tile);
  }
  updateReview();
}

function isDuplicatePhoto(file) {
  for (const photo of photos) {
    const existing = photo.file;
    if (existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified) {
      return true;
    }
  }
  return false;
}

function addPhotos(files) {
  let skipped = 0;
  for (const file of files) {
    if (!allowedTypes.includes(file.type) || file.size === 0 || file.size > photoSizeLimit ||
        photos.length >= photoLimit || isDuplicatePhoto(file)) {
      skipped++;
    } else {
      photos.push({ file: file, url: URL.createObjectURL(file) });
    }
  }
  photoMessage.textContent = '';
  if (skipped > 0) {
    photoMessage.textContent = 'Skipped ' + skipped + ' file(s). Check the format, size, and upload limit.';
  }
  renderUploads();
}

choosePhotos.addEventListener('click', function () {
  photoInput.click();
});
photoInput.addEventListener('change', function () {
  addPhotos(photoInput.files);
  photoInput.value = '';
});
photoDrop.addEventListener('dragover', function (event) {
  event.preventDefault();
  photoDrop.classList.add('dragging');
});
photoDrop.addEventListener('dragleave', function (event) {
  if (!photoDrop.contains(event.relatedTarget)) {
    photoDrop.classList.remove('dragging');
  }
});
photoDrop.addEventListener('drop', function (event) {
  event.preventDefault();
  photoDrop.classList.remove('dragging');
  addPhotos(event.dataTransfer.files);
});

function preventBrowserFileDrop(event) {
  if (event.dataTransfer.types.includes('Files')) {
    event.preventDefault();
  }
}
form.addEventListener('dragover', preventBrowserFileDrop);
form.addEventListener('drop', preventBrowserFileDrop);
form.addEventListener('input', updateReview);

form.addEventListener('submit', function (event) {
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  if (submit.disabled) {
    return;
  }
  const formData = new FormData(form);
  formData.delete('photos');
  const record = readFormFields(formData);
  record.amenity = formData.getAll('amenity');
  const attachments = [];
  for (const photo of photos) {
    attachments.push(photo.file);
  }
  submit.disabled = true;
  statusMessage.textContent = 'Saving your property…';
  saveSubmission('property', record, attachments, function (id) {
    submit.disabled = false;
    if (id === null) {
      statusMessage.textContent = 'This browser could not save your submission. Your form is still available to retry.';
    } else {
      statusMessage.textContent = 'Property submission #' + id + ' saved in this browser.';
    }
  });
});

updateReview();

