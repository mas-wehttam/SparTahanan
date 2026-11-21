const SAVED_KEY = 'saved';
const COMPARE_KEY = 'compare';

function loadList(key) {
  try {
    const list = JSON.parse(localStorage.getItem(key));
    return Array.isArray(list) ? list.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function updateSavedCount() {
  const count = loadList(SAVED_KEY).length;
  document.querySelectorAll('.saved-count').forEach(badge => {
    badge.textContent = count;
    badge.hidden = count === 0;
  });
}

function bindListingCard(card, onChange = () => {}) {
  const { id } = card;
  const saveButton = card.querySelector('.save-btn');
  const compareBox = card.querySelector('.compare-checkbox');
  const message = card.querySelector('.card-message');

  function updateSaveButton(saved) {
    saveButton.classList.toggle('saved', saved);
    saveButton.setAttribute('aria-pressed', saved);
    saveButton.setAttribute('aria-label', saved ? 'Remove saved property' : 'Save property');
  }

  updateSaveButton(loadList(SAVED_KEY).includes(id));
  compareBox.checked = loadList(COMPARE_KEY).includes(id);

  saveButton.addEventListener('click', () => {
    const saved = loadList(SAVED_KEY);
    const shouldSave = !saved.includes(id);
    const next = shouldSave ? [...saved, id] : saved.filter(item => item !== id);
    if (!saveList(SAVED_KEY, next)) {
      message.textContent = 'Could not update saved properties in this browser.';
      return;
    }
    updateSaveButton(shouldSave);
    message.textContent = '';
    updateSavedCount();
    onChange(SAVED_KEY, id);
  });

  compareBox.addEventListener('change', () => {
    const selected = loadList(COMPARE_KEY);
    const wasSelected = selected.includes(id);
    if (compareBox.checked && !wasSelected && selected.length >= 3) {
      compareBox.checked = false;
      message.textContent = 'Choose up to three properties to compare.';
      return;
    }

    const next = compareBox.checked ? [...new Set([...selected, id])] : selected.filter(item => item !== id);
    if (!saveList(COMPARE_KEY, next)) {
      compareBox.checked = wasSelected;
      message.textContent = 'Could not update the comparison in this browser.';
      return;
    }
    message.textContent = compareBox.checked
      ? 'Added to comparison (' + next.length + ' of 3).'
      : 'Removed from comparison.';
    onChange(COMPARE_KEY, id);
  });
}

document.querySelectorAll('.listing-card').forEach(card => bindListingCard(card));
updateSavedCount();

const header = document.querySelector('.header-overlay');
if (header && !header.classList.contains('interior-header')) {
  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 0);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}
