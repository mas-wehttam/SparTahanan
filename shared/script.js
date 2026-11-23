// Read the property IDs saved in this browser.
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

// Show the saved count in the navigation.
function updateSavedCount() {
  const count = loadPropertyIds('saved').length;
  const badge = document.querySelector('.saved-count');
  badge.textContent = count;
  badge.hidden = count === 0;
}

// Format a rental price in pesos.
function money(amount) {
  return '₱' + amount.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}
