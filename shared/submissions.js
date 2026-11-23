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
