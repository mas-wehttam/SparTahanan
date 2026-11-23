updateSavedCount();

// Save each contact form and display its own confirmation.
const messageLabels = {
  inquiry: 'Inquiry',
  report: 'Listing report',
  feedback: 'Feedback'
};

for (const form of document.querySelectorAll('[data-message]')) {
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const status = form.querySelector('[role="status"]');
    if (submit.disabled) {
      return;
    }

    const kind = form.dataset.message;
    const fields = readFormFields(new FormData(form));
    submit.disabled = true;
    status.textContent = 'Saving…';
    saveSubmission(kind, fields, [], function (id) {
      submit.disabled = false;
      if (id === null) {
        status.textContent = 'This browser could not save the form. Please try again.';
        return;
      }

      // Keep any edits made while the submission was saving.
      let unchanged = true;
      for (const name in fields) {
        if (form.elements[name].value !== fields[name]) {
          unchanged = false;
          break;
        }
      }
      if (unchanged) {
        form.reset();
      }
      status.textContent = messageLabels[kind] + ' #' + id + ' saved in this browser.';
    });
  });
}

function openLinkedSection() {
  const section = document.getElementById(window.location.hash.slice(1));
  if (section && section.tagName === 'DETAILS') {
    section.open = true;
  }
}

openLinkedSection();
window.addEventListener('hashchange', openLinkedSection);
