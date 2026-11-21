function storeSubmission(kind, fields, photos = []) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('spartahanan-submissions', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Submission storage is busy'));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('submissions', 'readwrite');
      const entry = transaction.objectStore('submissions').add({
        kind, fields, photos, savedAt: new Date().toISOString()
      });
      transaction.oncomplete = () => {
        db.close();
        resolve(entry.result);
      };
      transaction.onabort = () => {
        db.close();
        reject(transaction.error);
      };
    };
  });
}
