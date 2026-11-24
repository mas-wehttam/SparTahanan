
// Listing cards
const cards = document.querySelectorAll('.listing-card');

cards.forEach(function (card) {
  setUpCard(card); // in shared.js
});


// Navbar turns dark when scrolled
const header = document.querySelector('.header-overlay');

window.addEventListener('scroll', function () {
  header.classList.toggle('scrolled', window.scrollY > 0);
});
