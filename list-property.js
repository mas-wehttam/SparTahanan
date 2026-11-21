const form = document.querySelector('#listing-form');
const fields = form.elements;
const statusMessage = document.querySelector('#property-status');
const photoInput = document.querySelector('#photo-input');
const photoDrop = document.querySelector('#photo-drop');
const photoMessage = document.querySelector('#photo-message');
const uploadGallery = document.querySelector('#upload-gallery');
const photos = [];

addOptions(fields.campus, Object.entries(campuses));
for (const [select, options] of [[fields.type, propertyTypes], [fields.room, roomTypes], [fields.gender, genderPolicies]]) {
  addOptions(select, options.map(label => [label, label]));
}

document.querySelector('#expense-fields').innerHTML = ['Water', 'Electricity', 'Internet'].map(utility => `
  <div class="field-grid expense-row">
    <label>${utility} expenses *<select name="${utility.toLowerCase()}" required>
      <option value="">Included or extra?</option><option>Included in rent</option><option>Separate charge</option><option>Unavailable</option>
    </select></label>
    <label>${utility} charging details<input name="${utility.toLowerCase()}Details" placeholder="For example, billed by meter"></label>
  </div>`).join('');

document.querySelector('#amenity-fields').innerHTML = amenities.map(amenity =>
  '<label class="check-line"><input type="checkbox" name="amenity" value="' + amenity + '"> ' + amenity + '</label>'
).join('');

const preview = document.querySelector('#property-preview');
preview.innerHTML = `
  <div><h3 data-preview="property"></h3><p data-preview="scope"></p>
    <p class="meta" data-preview="location"></p><p class="meta" data-preview="room"></p>
    <p class="meta" data-preview="owner"></p><p class="meta" data-preview="photos"></p></div>
  <div class="preview-cost"><p class="rent-amount" data-preview="rent"></p><p class="meta" data-preview="basis"></p>
    <p data-preview="move-in"></p><p class="meta">First month + advance + deposit</p></div>`;

function updateReview() {
  const capacity = fields.capacity.valueAsNumber;
  const occupied = fields.occupied.valueAsNumber;
  const overCapacity = occupied > capacity;
  fields.occupied.setCustomValidity(overCapacity ? 'Current occupants cannot exceed the room capacity.' : '');
  const spaces = Number.isFinite(capacity - occupied) && !overCapacity ? capacity - occupied : null;
  document.querySelector('#spaces-left').textContent = spaces ?? '—';

  const parts = (...values) => values.map(value => value.trim()).filter(Boolean).join(' · ');
  const show = (key, value) => { preview.querySelector('[data-preview="' + key + '"]').textContent = value; };
  show('property', fields.property.value.trim() || 'Your property');
  show('scope', parts(fields.type.value, campuses[fields.campus.value] || '', fields.gender.value));
  show('location', parts(fields.address.value, fields.barangay.value, fields.city.value));
  show('room', parts(fields.room.value, spaces === null ? '' : spaces + ' available', fields.bathroom.value && fields.bathroom.value + ' bathroom'));
  show('owner', parts(fields.owner.value, fields.phone.value, fields.contact.value));
  show('photos', photos.length + (photos.length === 1 ? ' photo' : ' photos'));
  show('rent', fields.rent.value ? money(fields.rent.valueAsNumber) : '—');
  show('basis', fields.basis.value ? 'per ' + fields.basis.value + ' / month' : 'Monthly rent');
  show('move-in', fields.rent.value ? 'Move-in: ' + money(
    fields.rent.valueAsNumber + Number(fields.advance.value) + Number(fields.deposit.value)
  ) : '');
}

function renderUploads() {
  uploadGallery.replaceChildren();
  photos.forEach(({ file, url }, index) => {
    const tile = document.createElement('div');
    const image = document.createElement('img');
    image.src = url;
    image.alt = '';
    const caption = document.createElement('p');
    caption.className = 'meta';
    caption.textContent = file.name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'text-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + file.name);
    remove.addEventListener('click', () => {
      URL.revokeObjectURL(photos[index].url);
      photos.splice(index, 1);
      photoMessage.textContent = '';
      renderUploads();
      (uploadGallery.querySelectorAll('button')[index] || document.querySelector('#choose-photos')).focus();
    });
    tile.append(image, caption, remove);
    uploadGallery.append(tile);
  });
  updateReview();
}

function addPhotos(files) {
  let skipped = 0;
  for (const file of files) {
    const duplicate = photos.some(photo => photo.file.name === file.name && photo.file.size === file.size
      && photo.file.lastModified === file.lastModified);
    if (duplicate || photos.length >= 10 || file.size === 0 || file.size > 5 * 1024 * 1024
      || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      skipped++;
      continue;
    }
    photos.push({ file, url: URL.createObjectURL(file) });
  }
  photoMessage.textContent = skipped ? 'Skipped ' + skipped + ' file(s). Check the format, size, and upload limit.' : '';
  renderUploads();
}

document.querySelector('#choose-photos').addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', () => {
  addPhotos(photoInput.files);
  photoInput.value = '';
});
photoDrop.addEventListener('dragover', event => {
  event.preventDefault();
  photoDrop.classList.add('dragging');
});
photoDrop.addEventListener('dragleave', event => {
  if (!photoDrop.contains(event.relatedTarget)) photoDrop.classList.remove('dragging');
});
photoDrop.addEventListener('drop', event => {
  event.preventDefault();
  photoDrop.classList.remove('dragging');
  addPhotos(event.dataTransfer.files);
});
for (const event of ['dragover', 'drop']) {
  form.addEventListener(event, drag => {
    if (drag.dataTransfer.types.includes('Files')) drag.preventDefault();
  });
}
form.addEventListener('input', updateReview);
form.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  if (submit.disabled) return;
  const payload = new FormData(form);
  payload.delete('photos');
  const record = { ...Object.fromEntries(payload), amenity: payload.getAll('amenity') };
  const attachments = photos.map(photo => photo.file);
  submit.disabled = true;
  statusMessage.textContent = 'Saving your property…';
  try {
    const id = await storeSubmission('property', record, attachments);
    statusMessage.textContent = 'Property submission #' + id + ' saved in this browser.';
  } catch {
    statusMessage.textContent = 'This browser could not save your submission. Your form is still available to retry.';
  } finally {
    submit.disabled = false;
  }
});

updateReview();
