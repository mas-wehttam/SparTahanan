const searchForm = document.querySelector('#campus-search');
const filtersForm = document.querySelector('#filters');
const sort = document.querySelector('#sort-listings');
const results = document.querySelector('#listing-results');
const savedView = document.querySelector('#saved-view');
const compareView = document.querySelector('#compare-view');
const propertyDialog = document.querySelector('#property-dialog');
const compareDialog = document.querySelector('#compare-dialog');
const params = new URLSearchParams(location.search);
const criteria = {
  campus: Object.hasOwn(campuses, params.get('campus')) ? params.get('campus') : '',
  area: params.get('area') || '',
  maxBudget: params.get('maxBudget') || '',
  saved: params.get('view') === 'saved'
};
const presetBudgets = ['3000', '4000', '5000', '6000'];
if (!presetBudgets.includes(criteria.maxBudget) && !/^[1-9]\d{0,7}$/.test(criteria.maxBudget)) {
  criteria.maxBudget = '';
}

const filterOptions = [
  ['types', 'type', propertyTypes], ['rooms', 'arrangement', roomTypes],
  ['gender', 'gender', genderPolicies], ['amenities', 'amenity', amenities],
  ['status', 'status', availabilityOptions]
];

for (const [group, name, options] of filterOptions) {
  document.querySelector('#filter-' + group).innerHTML = options.map(option =>
    '<label class="check-line"><input type="checkbox" name="' + name + '" value="' + option + '"> ' + option + '</label>'
  ).join('');
}

addOptions(searchForm.elements.campus, Object.entries(campuses));
if (criteria.maxBudget && !presetBudgets.includes(criteria.maxBudget)) {
  addOptions(searchForm.elements.maxBudget, [[criteria.maxBudget, 'Up to ' + money(Number(criteria.maxBudget))]]);
}

function refreshAreas() {
  const area = searchForm.elements.area;
  const previous = area.value;
  const campus = searchForm.elements.campus.value;
  const areas = [...new Set(properties.filter(property => !campus || property.campus === campus)
    .map(property => property.area))].sort();
  area.options.length = 1;
  addOptions(area, areas.map(name => [name, name]));
  area.value = areas.includes(previous) ? previous : '';
}

searchForm.elements.campus.value = criteria.campus;
searchForm.elements.maxBudget.value = criteria.maxBudget;
refreshAreas();
searchForm.elements.area.value = criteria.area;
criteria.area = searchForm.elements.area.value;
searchForm.elements.campus.addEventListener('change', refreshAreas);

let appliedFilters = new FormData(filtersForm);

function updateURL(propertyId) {
  const url = new URL(location.href);
  for (const key of ['campus', 'area', 'maxBudget']) {
    if (criteria[key]) url.searchParams.set(key, criteria[key]);
    else url.searchParams.delete(key);
  }
  if (criteria.saved) url.searchParams.set('view', 'saved');
  else url.searchParams.delete('view');
  if (propertyId) url.searchParams.set('property', propertyId);
  else url.searchParams.delete('property');
  history.replaceState(null, '', url);
}

function matchesFilters(property) {
  if (criteria.campus && property.campus !== criteria.campus) return false;
  if (criteria.area && property.area !== criteria.area) return false;
  if (criteria.maxBudget && property.rent > Number(criteria.maxBudget)) return false;

  const distance = appliedFilters.get('distance');
  const min = appliedFilters.get('minRent');
  const max = appliedFilters.get('maxRent');
  if (distance && property.distance > Number(distance)) return false;
  if (min && property.rent < Number(min)) return false;
  if (max && property.rent > Number(max)) return false;

  return filterOptions.every(([, name]) => {
    const selected = appliedFilters.getAll(name);
    if (name === 'amenity') return selected.every(feature => property.features.includes(feature));
    return !selected.length || selected.includes(property[name]);
  });
}

const sorters = {
  distance: (a, b) => a.distance - b.distance,
  'rent-low': (a, b) => a.rent - b.rent,
  'rent-high': (a, b) => b.rent - a.rent,
  name: (a, b) => a.name.localeCompare(b.name)
};

function statusBadge(property) {
  return '<span class="status-badge" data-status="' + property.status + '">' + property.status + '</span>';
}

function detailLink(property) {
  const url = new URL(location.href);
  url.searchParams.set('property', property.id);
  return url.search.replaceAll('&', '&amp;');
}

function renderListing(property) {
  return `
    <article class="listing-card directory-card" id="${property.id}">
      <div class="directory-photo">
        <a href="${detailLink(property)}" data-property="${property.id}" aria-label="View ${property.name}">
          <img class="property-photo" src="${roomPhoto(property)}" alt="Illustrative bedroom for ${property.name}">
        </a>
        <span class="photo-label">Sample</span>
        <button class="save-btn" type="button" aria-label="Save property">
          <img class="heart-icon heart-outline" src="assets/icons/heart.svg" alt="">
          <img class="heart-icon heart-filled" src="assets/icons/heart-filled.svg" alt="">
        </button>
      </div>
      <div class="directory-card-main">
        ${statusBadge(property)}
        <h3><a href="${detailLink(property)}" data-property="${property.id}">${property.name}</a></h3>
        <p class="meta">${property.area}, ${property.city}</p>
        <p class="distance-line">${property.distance} km to ${campusName(property.campus)}</p>
        <p class="room-line">${property.room} · ${property.gender}</p>
        <p class="meta">${property.features.slice(0, 3).join(' · ')}</p>
        <label class="compare"><input class="compare-checkbox" type="checkbox"> Compare</label>
      </div>
      <div class="directory-rent">
        <p class="meta">${property.type}</p>
        <p class="rent-amount">${money(property.rent)}</p>
        <p class="meta">per ${property.basis} / month</p>
        <p class="slot-line">${slotLabel(property)}</p>
        <a class="btn btn-red btn-small" href="${detailLink(property)}" data-property="${property.id}">View Details</a>
      </div>
      <p class="card-message" aria-live="polite"></p>
    </article>`;
}

function selectedProperties() {
  return loadList(COMPARE_KEY).map(id => properties.find(property => property.id === id)).filter(Boolean);
}

function updateCompare() {
  const count = selectedProperties().length;
  document.querySelector('#compare-count').textContent = '(' + count + ')';
  compareView.disabled = count === 0;
}

function renderResults() {
  const saved = loadList(SAVED_KEY);
  const matches = properties.filter(property => (!criteria.saved || saved.includes(property.id)) && matchesFilters(property));
  matches.sort(sorters[sort.value]);
  const noun = criteria.saved ? 'saved accommodation' : 'accommodation';

  document.querySelector('#results-title').textContent =
    matches.length + ' ' + noun + (matches.length === 1 ? '' : 's')
    + (criteria.campus ? ' near ' + campuses[criteria.campus] : '');
  document.querySelector('#results-context').textContent = [
    criteria.campus ? campusName(criteria.campus) : 'All campuses',
    criteria.area || 'All areas',
    criteria.maxBudget ? 'Up to ' + money(Number(criteria.maxBudget)) : 'Any search budget'
  ].join(' · ');
  savedView.setAttribute('aria-pressed', criteria.saved);
  results.innerHTML = matches.length ? matches.map(renderListing).join('') :
    '<div class="empty-state"><h3>No matching accommodations</h3><p>Try a different campus or clear your filters to see more sample listings.</p><button type="button" class="btn btn-red" data-reset>Clear filters</button></div>';
  document.querySelector('#results-foot').textContent = matches.length
    ? 'Ask the owner to confirm the price, room setup, and availability before arranging a viewing.' : '';
  results.querySelectorAll('.listing-card').forEach(card => bindListingCard(card, (key, id) => {
    if (key === SAVED_KEY && criteria.saved && !loadList(SAVED_KEY).includes(id)) {
      renderResults();
      (results.querySelector('.save-btn') || savedView).focus();
    }
    updateCompare();
  }));
  updateCompare();
}

function resetFilters() {
  searchForm.reset();
  refreshAreas();
  filtersForm.reset();
  filtersForm.elements.maxRent.setCustomValidity('');
  appliedFilters = new FormData(filtersForm);
  sort.value = 'distance';
  Object.assign(criteria, { campus: '', area: '', maxBudget: '', saved: false });
  updateURL();
  renderResults();
}

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  for (const key of ['campus', 'area', 'maxBudget']) criteria[key] = searchForm.elements[key].value;
  updateURL();
  renderResults();
});

filtersForm.addEventListener('input', () => filtersForm.elements.maxRent.setCustomValidity(''));
filtersForm.addEventListener('submit', event => {
  event.preventDefault();
  const next = new FormData(filtersForm);
  const min = next.get('minRent');
  const max = next.get('maxRent');
  if (min && max && Number(min) > Number(max)) {
    filtersForm.elements.maxRent.setCustomValidity('Enter a maximum at or above the minimum.');
    filtersForm.reportValidity();
    return;
  }
  appliedFilters = next;
  renderResults();
});
sort.addEventListener('change', renderResults);
document.querySelector('#reset-filters').addEventListener('click', resetFilters);
const toggleFilters = document.querySelector('#toggle-filters');
toggleFilters.addEventListener('click', () => {
  const expanded = filtersForm.classList.toggle('mobile-expanded');
  toggleFilters.setAttribute('aria-expanded', expanded);
  toggleFilters.textContent = expanded ? 'Hide filters' : 'Show filters';
});
savedView.addEventListener('click', () => {
  criteria.saved = !criteria.saved;
  updateURL();
  renderResults();
});

function factsMarkup(entries) {
  return entries.map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>').join('');
}

function openProperty(property) {
  const has = feature => property.features.includes(feature);
  const bathroom = has('Private bathroom') ? 'Private bathroom' : 'Shared bathroom';
  const gallery = [
    ['Bedroom', property.photo],
    ['Bathroom', has('Private bathroom') ? 'private-bath' : 'shared-bath'],
    ...(has('Kitchen') ? [['Kitchen', 'kitchen']] : []),
    ...(has('Study area') ? [['Study area', 'study-area']] : []),
    ['Exterior', 'exterior']
  ];
  document.querySelector('#property-title').textContent = property.name;
  document.querySelector('#property-subtitle').textContent = property.area + ', ' + property.city + ' · ' + property.type;

  const body = document.querySelector('#property-content');
  body.innerHTML = `
    <div class="property-detail-grid">
      <div>
        <figure class="gallery-main">
          <img id="gallery-photo" src="${roomPhoto(property)}" alt="Illustrative bedroom">
          <figcaption>Illustrative accommodation photos</figcaption>
        </figure>
        <div class="gallery-thumbs" aria-label="Property gallery">${gallery.map(([label, photo], index) => `
          <button type="button" class="gallery-thumb" data-photo="${photo}" aria-pressed="${index === 0}">
            <img src="assets/properties/${photo}.jpg" alt=""><span>${label}</span>
          </button>`).join('')}</div>
        <section class="detail-section"><h3>About this accommodation</h3><p>${property.description}</p>
          <p class="sample-note">Fictional sample property</p></section>
        <section class="detail-section"><h3>Amenities &amp; facilities</h3>
          <ul class="amenity-list">${property.features.map(feature => '<li>' + feature + '</li>').join('')}</ul>
        </section>
        <section class="detail-section"><h3>House rules</h3><p>${property.rules}</p></section>
        <section class="detail-section"><h3>Location</h3><p>${property.location} · ${property.distance} km to ${campusName(property.campus)}.</p></section>
      </div>
      <div class="detail-aside">
        <div class="detail-rent">
          <p class="small-header">Monthly rent</p>
          <p class="rent-amount">${money(property.rent)}</p>
          <p>per ${property.basis} / month</p>
          ${statusBadge(property)}
        </div>
        <dl class="detail-facts">${factsMarkup([
          ['Room arrangement', property.room], ['Gender policy', property.gender],
          ['Occupancy', property.occupied === null ? 'Unconfirmed · capacity ' + property.capacity : property.occupied + ' occupied / ' + property.capacity + ' capacity'],
          ['Availability', slotLabel(property)], ['Bathroom', bathroom], ['Cooling', property.cooling]
        ])}</dl>
        <section class="detail-section"><h3>Expenses at a glance</h3>
          <dl>${factsMarkup([['Included', property.included], ['Additional costs', property.extras],
            ['Advance payment', money(property.advance)], ['Security deposit', money(property.deposit)]])}</dl>
        </section>
        <section class="detail-section"><h3>Property owner</h3>
          <p><strong>${property.owner}</strong> · Sample owner</p>
          <p class="meta">Preferred contact: ${property.contact}</p>
          <details class="owner-contact"><summary class="btn btn-red">Contact Owner</summary>
            <p>Demo contact details. Sample owners cannot receive messages.</p>
            <p>09XX XXX XXXX · ${property.photo}@example.com</p>
          </details>
        </section>
      </div>
    </div>`;
  body.querySelectorAll('.gallery-thumb').forEach(button => button.addEventListener('click', () => {
    const image = body.querySelector('#gallery-photo');
    image.src = 'assets/properties/' + button.dataset.photo + '.jpg';
    image.alt = 'Illustrative ' + button.textContent.trim().toLowerCase();
    body.querySelector('.gallery-thumb[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
  }));

  updateURL(property.id);
  propertyDialog.showModal();
  propertyDialog.scrollTop = 0;
}

results.addEventListener('click', event => {
  if (event.target.closest('[data-reset]')) {
    resetFilters();
    document.querySelector('#reset-filters').focus();
    return;
  }
  const link = event.target.closest('[data-property]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  openProperty(properties.find(property => property.id === link.dataset.property));
});

compareView.addEventListener('click', () => {
  const selected = selectedProperties();
  const rows = [
    ['Campus', property => campusName(property.campus)],
    ['Monthly rent', property => money(property.rent) + ' per ' + property.basis],
    ['Distance', property => property.distance + ' km'],
    ['Room arrangement', property => property.room],
    ['Gender policy', property => property.gender],
    ['Availability', slotLabel],
    ['Amenities', property => property.features.join(', ')],
    ['Included in rent', property => property.included]
  ];
  document.querySelector('#compare-content').innerHTML = `
    <div class="comparison-scroll" tabindex="0" aria-label="Comparison table">
      <table class="comparison-table">
        <thead><tr><th scope="col">Feature</th>${selected.map(property => '<th scope="col">' + property.name + '</th>').join('')}</tr></thead>
        <tbody>${rows.map(([label, display]) => '<tr><th scope="row">' + label + '</th>'
          + selected.map(property => '<td>' + display(property) + '</td>').join('') + '</tr>').join('')}</tbody>
      </table>
    </div>`;
  compareDialog.showModal();
});

for (const dialog of [propertyDialog, compareDialog]) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom) dialog.close();
  });
}
propertyDialog.addEventListener('close', () => updateURL());

renderResults();
const initialProperty = properties.find(property => property.id === params.get('property'));
if (initialProperty) openProperty(initialProperty);
