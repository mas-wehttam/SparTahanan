
// SAVED
const SAVED_KEY = 'saved';
const COMPARE_KEY = 'compare';



function loadList(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}


function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}


function updateSavedCount() {
  const badge = document.querySelector('.saved-count');
  const count = loadList(SAVED_KEY).length;
  badge.textContent = count;
  badge.hidden = count === 0;
}


// Listing cards
const cards = document.querySelectorAll('.listing-card');

cards.forEach(function (card) {
  const id = card.id;
  const saveButton = card.querySelector('.save-btn');
  const compareBox = card.querySelector('.compare-checkbox');
  const message = card.querySelector('.card-message');

 
  if (loadList(SAVED_KEY).includes(id)) {
    saveButton.classList.add('saved');
  }
  compareBox.checked = loadList(COMPARE_KEY).includes(id);

  // Heart button
  saveButton.addEventListener('click', function () {
    const saved = loadList(SAVED_KEY);

    if (saved.includes(id)) {
      saved.splice(saved.indexOf(id), 1); // remove
    } else {
      saved.push(id); // add
    }

    saveButton.classList.toggle('saved');
    saveList(SAVED_KEY, saved);
    updateSavedCount();
  });


  // Compare checkbox
  compareBox.addEventListener('change', function () {
    const selected = loadList(COMPARE_KEY);

    if (compareBox.checked && selected.length === 3) {
      compareBox.checked = false;
      message.textContent = 'You can compare up to 3 properties. Remove one before adding another.';
      return;
    }

    if (compareBox.checked) {
      selected.push(id);
      message.textContent = 'Added to comparison (' + selected.length + ' of 3). View it on Find Accommodation.';
    } else {
      selected.splice(selected.indexOf(id), 1);
      message.textContent = 'Removed from comparison.';
    }

    saveList(COMPARE_KEY, selected);
  });
});

updateSavedCount();



// NavBar
const header = document.querySelector('.header-overlay');

if (header) {
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 0);
  });
}
