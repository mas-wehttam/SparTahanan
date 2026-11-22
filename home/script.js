// Saved and compared properties are shared across pages through browser storage.
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

function savePropertyIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

function updateSavedCount() {
  const count = loadPropertyIds('saved').length;
  const badge = document.querySelector('.saved-count');
  badge.textContent = count;
  badge.hidden = count === 0;
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

// Set up the featured listings and the header on the home page.
for (const card of document.querySelectorAll('.listing-card')) {
  setUpListingCard(card);
}
updateSavedCount();

const header = document.querySelector('.header-overlay');
function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 0);
}
updateHeader();
window.addEventListener('scroll', updateHeader);
