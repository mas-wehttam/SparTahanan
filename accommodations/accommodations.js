
// The page
const cards = document.querySelectorAll('.directory-card');
const choices = document.querySelectorAll('.choice');
const amenities = document.querySelectorAll('.amenity-box');
const budget = document.querySelector('#budget');
const sort = document.querySelector('#sort-listings');
const comparePopup = document.querySelector('#compare-popup');

// The part of the link after the ? (example: ?campus=lipa)
const link = new URLSearchParams(location.search);
const savedOnly = link.get('view') === 'saved';


// Reads a number written on a card
function getNumber(card, name) {
  return Number(card.querySelector(name).textContent.replace(',', ''));
}


// SEARCH AND FILTERS
function showListings() {
  let count = 0;

  cards.forEach(function (card) {
    let match = true;

    // Dropdowns: the card must have the chosen class
    choices.forEach(function (choice) {
      if (choice.value !== '' && !card.classList.contains(choice.value)) {
        match = false;
      }
    });

    // Amenities: the card must have all the checked ones
    amenities.forEach(function (box) {
      if (box.checked && !card.classList.contains(box.value)) {
        match = false;
      }
    });

    if (budget.value !== '' && getNumber(card, '.rent') > Number(budget.value)) {
      match = false;
    }

    if (savedOnly && !loadList('saved').includes(card.id)) {
      match = false;
    }

    // Show or hide the card
    card.classList.toggle('hidden', !match);

    if (match) {
      count = count + 1;
    }
  });

  document.querySelector('#results-title').textContent = 'Accommodations: ' + count;
  document.querySelector('#empty-state').classList.toggle('hidden', count > 0);
}

// Search and Apply filters
document.querySelectorAll('.show-btn').forEach(function (button) {
  button.addEventListener('click', showListings);
});


// SORT (the card with the smallest order goes first)
sort.addEventListener('change', function () {
  cards.forEach(function (card) {
    if (sort.value === 'rent-low') {
      card.style.order = getNumber(card, '.rent');
    } else if (sort.value === 'rent-high') {
      card.style.order = -getNumber(card, '.rent');
    } else {
      card.style.order = 0; // nearest first, like in the HTML
    }
  });
});


// CARDS
cards.forEach(function (card) {
  const details = document.getElementById(card.id + '-details');

  // Heart and Compare (in shared.js)
  setUpCard(card);
  card.querySelector('.save-btn').addEventListener('click', showListings);

  // Photo, name and View Details
  card.querySelectorAll('.open-details').forEach(function (item) {
    item.addEventListener('click', function () {
      details.classList.add('open');
    });
  });

  // Small photos
  details.querySelectorAll('.gallery-thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      details.querySelector('.gallery-thumb.active').classList.remove('active');
      thumb.classList.add('active');
      details.querySelector('.gallery-photo').src = thumb.querySelector('img').src;
    });
  });

  // Contact Owner
  details.querySelector('.contact-button').addEventListener('click', function () {
    details.querySelector('.contact-details').classList.toggle('open');
  });
});


// COMPARE
document.querySelector('#compare-view').addEventListener('click', function () {
  const selected = loadList('compare');

  // Show only the columns of the chosen listings
  cards.forEach(function (card) {
    document.querySelectorAll('.' + card.id + '-cell').forEach(function (cell) {
      cell.classList.toggle('hidden', !selected.includes(card.id));
    });
  });

  if (selected.length === 0) {
    alert('Check Compare on a listing first.');
  } else {
    comparePopup.classList.add('open');
  }
});


// Close button of the popups
document.querySelectorAll('.popup').forEach(function (popup) {
  popup.querySelector('.popup-close').addEventListener('click', function () {
    popup.classList.remove('open');
  });
});


// WHEN THE PAGE OPENS
document.querySelector('#campus').value = link.get('campus') || '';
budget.value = link.get('maxBudget') || '';
document.querySelector('#saved-view').classList.toggle('active', savedOnly);
showListings();

// View Details from the Home page
if (link.get('property')) {
  document.getElementById(link.get('property') + '-details').classList.add('open');
}
