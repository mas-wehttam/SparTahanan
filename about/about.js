
// Questions (open and close)
const faqs = document.querySelectorAll('.faq');

faqs.forEach(function (faq) {
  const question = faq.querySelector('.faq-question');
  const sign = faq.querySelector('.faq-sign');

  question.addEventListener('click', function () {
    faq.classList.toggle('open');

    if (faq.classList.contains('open')) {
      sign.textContent = '−';
    } else {
      sign.textContent = '+';
    }
  });
});


// Forms
const forms = document.querySelectorAll('.contact-form');

forms.forEach(function (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // stay on this page
    form.reset();
    form.querySelector('.form-status').textContent = 'Thank you for your message!';
  });
});
