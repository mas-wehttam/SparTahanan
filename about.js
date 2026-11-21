const messageLabels = { inquiry: 'Inquiry', report: 'Listing report', feedback: 'Feedback' };

for (const form of document.querySelectorAll('[data-message]')) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const status = form.querySelector('[role="status"]');
    if (submit.disabled) return;
    const record = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    status.textContent = 'Saving…';
    try {
      const kind = form.dataset.message;
      const id = await storeSubmission(kind, record);
      if (Object.entries(record).every(([name, value]) => form.elements[name].value === value)) form.reset();
      status.textContent = messageLabels[kind] + ' #' + id + ' saved in this browser.';
    } catch {
      status.textContent = 'This browser could not save the form. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
}

function openLinkedSection() {
  const section = document.getElementById(location.hash.slice(1));
  if (section instanceof HTMLDetailsElement) section.open = true;
}

openLinkedSection();
window.addEventListener('hashchange', openLinkedSection);
