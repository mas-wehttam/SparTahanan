// Update saved and compared properties in browser storage.
function savePropertyIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

function updateSaveButton(button, isSaved) {
  button.classList.toggle('saved', isSaved);
  button.setAttribute('aria-pressed', isSaved);
  if (isSaved) {
    button.setAttribute('aria-label', 'Remove saved property');
  } else {
    button.setAttribute('aria-label', 'Save property');
  }
}

function setUpListingCard(card, onSave, onCompare) {
  const id = card.id;
  const saveButton = card.querySelector('.save-btn');
  const compareBox = card.querySelector('.compare-checkbox');
  const message = card.querySelector('.card-message');

  updateSaveButton(saveButton, loadPropertyIds('saved').includes(id));
  compareBox.checked = loadPropertyIds('compare').includes(id);

  saveButton.addEventListener('click', function () {
    const saved = loadPropertyIds('saved');
    const index = saved.indexOf(id);
    const isSaving = index === -1;
    if (isSaving) {
      saved.push(id);
    } else {
      saved.splice(index, 1);
    }

    if (!savePropertyIds('saved', saved)) {
      message.textContent = 'Could not update saved properties in this browser.';
      return;
    }
    updateSaveButton(saveButton, isSaving);
    message.textContent = '';
    updateSavedCount();
    if (onSave) {
      onSave(isSaving);
    }
  });

  compareBox.addEventListener('change', function () {
    const compared = loadPropertyIds('compare');
    const index = compared.indexOf(id);
    const wasSelected = index !== -1;

    if (compareBox.checked && !wasSelected) {
      if (compared.length >= 3) {
        compareBox.checked = false;
        message.textContent = 'Choose up to three properties to compare.';
        return;
      }
      compared.push(id);
    } else if (!compareBox.checked && wasSelected) {
      compared.splice(index, 1);
    }

    if (!savePropertyIds('compare', compared)) {
      compareBox.checked = wasSelected;
      message.textContent = 'Could not update the comparison in this browser.';
      return;
    }
    if (compareBox.checked) {
      message.textContent = 'Added to comparison (' + compared.length + ' of 3).';
    } else {
      message.textContent = 'Removed from comparison.';
    }
    if (onCompare) {
      onCompare();
    }
  });
}

// Campus search, sidebar filters, and sorting
const searchForm = document.querySelector('#campus-search');
const filtersForm = document.querySelector('#filters');
const sort = document.querySelector('#sort-listings');
const results = document.querySelector('#listing-results');
const savedView = document.querySelector('#saved-view');
const compareView = document.querySelector('#compare-view');
const propertyDialog = document.querySelector('#property-dialog');
const compareDialog = document.querySelector('#compare-dialog');
const listingTemplate = document.querySelector('#listing-template');
const emptyTemplate = document.querySelector('#empty-template');
const resetButton = document.querySelector('#reset-filters');
const searchFields = ['campus', 'area', 'maxBudget'];
const filterNames = ['type', 'arrangement', 'gender', 'status'];
const pageParams = new URLSearchParams(window.location.search);
const criteria = { campus: '', area: '', maxBudget: '', saved: pageParams.get('view') === 'saved' };
let appliedFilters = new FormData(filtersForm);

function campusName(campus) {
  return 'BatStateU ' + campuses[campus];
}

function slotLabel(property) {
  if (property.slots === null) {
    return 'Ask the owner about availability';
  }
  if (property.slots === 0) {
    return 'No open slots';
  }
  let unit = 'slot';
  if (property.basis === 'room') {
    unit = 'room';
  }
  if (property.slots > 1) {
    unit += 's';
  }
  return property.slots + ' ' + unit + ' available';
}

function refreshAreas() {
  const campus = searchForm.elements.campus.value;
  const area = searchForm.elements.area;
  const previousArea = area.value;
  const areas = [];

  for (const property of properties) {
    if ((!campus || property.campus === campus) && !areas.includes(property.area)) {
      areas.push(property.area);
    }
  }
  areas.sort();
  area.options.length = 1;
  for (const name of areas) {
    area.add(new Option(name, name));
  }
  area.value = '';
  if (areas.includes(previousArea)) {
    area.value = previousArea;
  }
}

function readSearchFields() {
  for (const name of searchFields) {
    criteria[name] = searchForm.elements[name].value;
  }
}

function updatePageAddress(propertyId) {
  const url = new URL(window.location.href);
  for (const name of searchFields) {
    if (criteria[name]) {
      url.searchParams.set(name, criteria[name]);
    } else {
      url.searchParams.delete(name);
    }
  }
  url.searchParams.delete('view');
  url.searchParams.delete('property');
  if (criteria.saved) {
    url.searchParams.set('view', 'saved');
  }
  if (propertyId) {
    url.searchParams.set('property', propertyId);
  }
  window.history.replaceState(null, '', url);
}

function matchesFilters(property) {
  if (criteria.campus && property.campus !== criteria.campus) {
    return false;
  }
  if (criteria.area && property.area !== criteria.area) {
    return false;
  }
  if (criteria.maxBudget && property.rent > Number(criteria.maxBudget)) {
    return false;
  }

  const distance = appliedFilters.get('distance');
  const minRent = appliedFilters.get('minRent');
  const maxRent = appliedFilters.get('maxRent');
  if (distance && property.distance > Number(distance)) {
    return false;
  }
  if (minRent && property.rent < Number(minRent)) {
    return false;
  }
  if (maxRent && property.rent > Number(maxRent)) {
    return false;
  }

  for (const name of filterNames) {
    const selected = appliedFilters.getAll(name);
    if (selected.length > 0 && !selected.includes(property[name])) {
      return false;
    }
  }
  for (const amenity of appliedFilters.getAll('amenity')) {
    if (!property.features.includes(amenity)) {
      return false;
    }
  }
  return true;
}

function compareForSort(first, second) {
  if (sort.value === 'rent-low') {
    return first.rent - second.rent;
  }
  if (sort.value === 'rent-high') {
    return second.rent - first.rent;
  }
  if (sort.value === 'name') {
    return first.name.localeCompare(second.name);
  }
  return first.distance - second.distance;
}

// Fill in the listing card from the template in index.html.
function fillFields(container, values) {
  for (const field of container.querySelectorAll('[data-field]')) {
    field.textContent = values[field.dataset.field];
  }
}

function showStatus(container, status) {
  const badge = container.querySelector('.status-badge');
  badge.textContent = status;
  badge.dataset.status = status;
}

function createListingCard(property) {
  const card = listingTemplate.content.firstElementChild.cloneNode(true);
  card.id = property.id;
  const url = new URL(window.location.href);
  url.searchParams.set('property', property.id);

  for (const link of card.querySelectorAll('.property-link')) {
    link.href = url.search;
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      openProperty(property);
    });
  }
  card.querySelector('.directory-photo a').setAttribute('aria-label', 'View ' + property.name);
  card.querySelector('h3 a').textContent = property.name;
  const image = card.querySelector('.property-photo');
  image.src = '../assets/properties/' + property.photo + '.jpg';
  image.alt = 'Illustrative bedroom for ' + property.name;

  showStatus(card, property.status);
  fillFields(card, {
    location: property.area + ', ' + property.city,
    distance: property.distance + ' km to ' + campusName(property.campus),
    room: property.room + ' · ' + property.gender,
    features: property.features.slice(0, 3).join(' · '),
    type: property.type,
    rent: money(property.rent),
    basis: 'per ' + property.basis + ' / month',
    slots: slotLabel(property)
  });

  setUpListingCard(card, function (isSaving) {
    if (criteria.saved && !isSaving) {
      renderResults();
      const nextButton = results.querySelector('.save-btn') || savedView;
      nextButton.focus();
    }
  }, updateCompare);
  return card;
}

function renderResults() {
  const saved = loadPropertyIds('saved');
  const matches = [];
  for (const property of properties) {
    if ((!criteria.saved || saved.includes(property.id)) && matchesFilters(property)) {
      matches.push(property);
    }
  }
  matches.sort(compareForSort);

  let title = matches.length + ' ';
  if (criteria.saved) {
    title += 'saved ';
  }
  title += 'accommodation';
  if (matches.length !== 1) {
    title += 's';
  }
  if (criteria.campus) {
    title += ' near ' + campuses[criteria.campus];
  }
  document.querySelector('#results-title').textContent = title;
  document.querySelector('#results-context').textContent = [
    criteria.campus ? campusName(criteria.campus) : 'All campuses',
    criteria.area || 'All areas',
    criteria.maxBudget ? 'Up to ' + money(Number(criteria.maxBudget)) : 'Any search budget'
  ].join(' · ');
  savedView.setAttribute('aria-pressed', criteria.saved);

  results.textContent = '';
  const footer = document.querySelector('#results-foot');
  footer.textContent = '';
  if (matches.length === 0) {
    const emptyState = emptyTemplate.content.firstElementChild.cloneNode(true);
    emptyState.querySelector('button').addEventListener('click', function () {
      resetFilters();
      resetButton.focus();
    });
    results.appendChild(emptyState);
  } else {
    for (const property of matches) {
      results.appendChild(createListingCard(property));
    }
    footer.textContent = 'Ask the owner to confirm the price, room setup, and availability before arranging a viewing.';
  }
  updateCompare();
}

function resetFilters() {
  searchForm.reset();
  refreshAreas();
  filtersForm.reset();
  filtersForm.elements.maxRent.setCustomValidity('');
  appliedFilters = new FormData(filtersForm);
  sort.value = 'distance';
  readSearchFields();
  criteria.saved = false;
  updatePageAddress();
  renderResults();
}

searchForm.elements.campus.addEventListener('change', refreshAreas);
searchForm.addEventListener('submit', function (event) {
  event.preventDefault();
  readSearchFields();
  updatePageAddress();
  renderResults();
});
filtersForm.addEventListener('input', function () {
  filtersForm.elements.maxRent.setCustomValidity('');
});
filtersForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const filters = new FormData(filtersForm);
  const minRent = filters.get('minRent');
  const maxRent = filters.get('maxRent');
  if (minRent && maxRent && Number(minRent) > Number(maxRent)) {
    filtersForm.elements.maxRent.setCustomValidity('Enter a maximum at or above the minimum.');
    filtersForm.reportValidity();
    return;
  }
  appliedFilters = filters;
  renderResults();
});
sort.addEventListener('change', renderResults);
resetButton.addEventListener('click', resetFilters);
savedView.addEventListener('click', function () {
  criteria.saved = !criteria.saved;
  updatePageAddress();
  renderResults();
});

// Property details and photo gallery
function showGallery(property) {
  const gallery = document.querySelector('.gallery-thumbs');
  const template = document.querySelector('#gallery-template');
  const mainImage = document.querySelector('#gallery-photo');
  const photos = [['Bedroom', property.photo]];
  if (property.features.includes('Private bathroom')) {
    photos.push(['Bathroom', 'private-bath']);
  } else {
    photos.push(['Bathroom', 'shared-bath']);
  }
  if (property.features.includes('Kitchen')) {
    photos.push(['Kitchen', 'kitchen']);
  }
  if (property.features.includes('Study area')) {
    photos.push(['Study area', 'study-area']);
  }
  photos.push(['Exterior', 'exterior']);

  gallery.textContent = '';
  for (const photo of photos) {
    const label = photo[0];
    const source = '../assets/properties/' + photo[1] + '.jpg';
    const button = template.content.firstElementChild.cloneNode(true);
    button.querySelector('img').src = source;
    button.querySelector('span').textContent = label;

    function showPhoto() {
      const previous = gallery.querySelector('[aria-pressed="true"]');
      if (previous) {
        previous.setAttribute('aria-pressed', 'false');
      }
      button.setAttribute('aria-pressed', 'true');
      mainImage.src = source;
      mainImage.alt = 'Illustrative ' + label.toLowerCase();
    }

    gallery.appendChild(button);
    button.addEventListener('click', showPhoto);
    if (label === 'Bedroom') {
      showPhoto();
    }
  }
}

function openProperty(property) {
  document.querySelector('#property-title').textContent = property.name;
  document.querySelector('#property-subtitle').textContent = property.area + ', ' + property.city + ' · ' + property.type;
  const content = document.querySelector('#property-content');
  const amenities = content.querySelector('.amenity-list');
  amenities.textContent = '';
  for (const feature of property.features) {
    const item = document.createElement('li');
    item.textContent = feature;
    amenities.appendChild(item);
  }
  content.querySelector('.owner-contact').open = false;

  let occupancy = 'Unconfirmed · capacity ' + property.capacity;
  if (property.occupied !== null) {
    occupancy = property.occupied + ' occupied / ' + property.capacity + ' capacity';
  }
  fillFields(content, {
    description: property.description,
    rules: property.rules,
    location: property.location + ' · ' + property.distance + ' km to ' + campusName(property.campus) + '.',
    rent: money(property.rent),
    basis: 'per ' + property.basis + ' / month',
    room: property.room,
    gender: property.gender,
    occupancy: occupancy,
    slots: slotLabel(property),
    bathroom: property.features.includes('Private bathroom') ? 'Private bathroom' : 'Shared bathroom',
    cooling: property.cooling,
    included: property.included,
    extras: property.extras,
    advance: money(property.advance),
    deposit: money(property.deposit),
    owner: property.owner,
    contact: 'Preferred contact: ' + property.contact,
    'owner-details': '09XX XXX XXXX · ' + property.photo + '@example.com'
  });
  showStatus(content, property.status);
  showGallery(property);
  updatePageAddress(property.id);
  propertyDialog.showModal();
  document.documentElement.classList.add('dialog-open');
  propertyDialog.scrollTop = 0;
}

// Compare the selected listings in a table.
function findProperty(id) {
  for (const property of properties) {
    if (property.id === id) {
      return property;
    }
  }
  return null;
}

function getComparedProperties() {
  const selected = [];
  for (const id of loadPropertyIds('compare')) {
    const property = findProperty(id);
    if (property) {
      selected.push(property);
    }
  }
  return selected;
}

function updateCompare() {
  const count = getComparedProperties().length;
  document.querySelector('#compare-count').textContent = '(' + count + ')';
  compareView.disabled = count === 0;
}

function addTableHeading(row, scope, text) {
  const cell = document.createElement('th');
  cell.scope = scope;
  cell.textContent = text;
  row.appendChild(cell);
}

function openComparison() {
  const heading = document.querySelector('#comparison-heading');
  const body = document.querySelector('#comparison-rows');
  heading.textContent = '';
  body.textContent = '';
  addTableHeading(heading, 'col', 'Feature');

  const labels = ['Campus', 'Monthly rent', 'Distance', 'Room arrangement',
    'Gender policy', 'Availability', 'Amenities', 'Included in rent'];

  for (const label of labels) {
    addTableHeading(body.insertRow(), 'row', label);
  }
  for (const property of getComparedProperties()) {
    addTableHeading(heading, 'col', property.name);
    const values = [
      campusName(property.campus),
      money(property.rent) + ' per ' + property.basis,
      property.distance + ' km',
      property.room,
      property.gender,
      slotLabel(property),
      property.features.join(', '),
      property.included
    ];
    for (let index = 0; index < values.length; index++) {
      body.rows[index].insertCell().textContent = values[index];
    }
  }
  compareDialog.showModal();
  document.documentElement.classList.add('dialog-open');
}
compareView.addEventListener('click', openComparison);

for (const dialog of [propertyDialog, compareDialog]) {
  dialog.querySelector('[data-close]').addEventListener('click', function () {
    dialog.close();
  });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) {
      return;
    }
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX >= bounds.right ||
        event.clientY < bounds.top || event.clientY >= bounds.bottom) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('dialog-open');
  });
}
propertyDialog.addEventListener('close', function () {
  updatePageAddress();
});

// Restore campus, budget, saved view, and property details from a direct link.
const campusSelect = searchForm.elements.campus;
const budgetSelect = searchForm.elements.maxBudget;
campusSelect.value = pageParams.get('campus') || '';
if (campusSelect.selectedIndex < 0) {
  campusSelect.selectedIndex = 0;
}
refreshAreas();
const areaSelect = searchForm.elements.area;
areaSelect.value = pageParams.get('area') || '';
if (areaSelect.selectedIndex < 0) {
  areaSelect.selectedIndex = 0;
}
const linkedBudget = pageParams.get('maxBudget') || '';
if (/^[1-9][0-9]{0,7}$/.test(linkedBudget)) {
  budgetSelect.value = linkedBudget;
  if (budgetSelect.value === '') {
    budgetSelect.add(new Option('Up to ' + money(Number(linkedBudget)), linkedBudget));
    budgetSelect.value = linkedBudget;
  }
}
readSearchFields();
updateSavedCount();
renderResults();
const linkedProperty = findProperty(pageParams.get('property'));
if (linkedProperty) {
  openProperty(linkedProperty);
}
