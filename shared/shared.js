
// Gets a list from the browser storage
function loadList(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}


// Adds the id to the list, or removes it if it is already there
function toggleItem(key, id) {
  const list = loadList(key);

  if (list.includes(id)) {
    list.splice(list.indexOf(id), 1); // remove
  } else {
    list.push(id); // add
  }

  localStorage.setItem(key, JSON.stringify(list));
}


// The number beside Saved in the navbar
function updateSavedCount() {
  const badge = document.querySelector('.saved-count');
  const count = loadList('saved').length;
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
}

updateSavedCount();


// Heart and Compare of one listing card
function setUpCard(card) {
  const saveButton = card.querySelector('.save-btn');
  const compareBox = card.querySelector('.compare-checkbox');
  const message = card.querySelector('.card-message');

  // Show what was chosen before
  saveButton.classList.toggle('saved', loadList('saved').includes(card.id));
  compareBox.checked = loadList('compare').includes(card.id);

  // Heart button
  saveButton.addEventListener('click', function () {
    toggleItem('saved', card.id);
    saveButton.classList.toggle('saved');
    updateSavedCount();
  });

  // Compare checkbox
  compareBox.addEventListener('change', function () {
    message.classList.add('show');

    if (compareBox.checked && loadList('compare').length === 3) {
      compareBox.checked = false;
      message.textContent = 'You can compare up to 3 properties.';
    } else {
      toggleItem('compare', card.id);
      message.textContent = 'Chosen to compare: ' + loadList('compare').length + ' of 3';
    }
  });
}
