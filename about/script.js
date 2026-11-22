// Show the number of saved properties in the navigation.
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

function updateSavedCount() {
  const count = loadPropertyIds('saved').length;
  const badge = document.querySelector('.saved-count');
  badge.textContent = count;
  badge.hidden = count === 0;
}

updateSavedCount();

// IndexedDB stores form submissions and attached photos in this browser.
function saveSubmission(kind, fields, photos, showResult) {
  let reported = false;

  function finish(id) {
    if (!reported) {
      reported = true;
      showResult(id);
    }
  }

  let request;
  try {
    request = indexedDB.open('spartahanan-submissions', 1);
  } catch {
    finish(null);
    return;
  }
  request.onupgradeneeded = function () {
    request.result.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
  };
  request.onerror = function () {
    finish(null);
  };
  request.onblocked = function () {
    finish(null);
  };
  request.onsuccess = function () {
    const database = request.result;
    if (reported) {
      database.close();
      return;
    }
    try {
      const transaction = database.transaction('submissions', 'readwrite');
      const store = transaction.objectStore('submissions');
      const entry = store.add({
        kind: kind,
        fields: fields,
        photos: photos,
        savedAt: new Date().toISOString()
      });
      transaction.oncomplete = function () {
        database.close();
        finish(entry.result);
      };
      transaction.onabort = function () {
        database.close();
        finish(null);
      };
    } catch {
      database.close();
      finish(null);
    }
  };
}

// Collect the text fields. Photo files and multiple amenity choices are handled separately.
function readFormFields(formData) {
  const fields = {};
  for (const name of formData.keys()) {
    fields[name] = formData.get(name);
  }
  return fields;
}

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

