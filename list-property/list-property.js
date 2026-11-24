
// The form
const form = document.querySelector('#listing-form');
const fields = form.elements;
const statusMessage = document.querySelector('#property-status');
const photoInput = document.querySelector('#photo-input');
const gallery = document.querySelector('#upload-gallery');


// PREVIEW
function updatePreview() {
  const rent = Number(fields.rent.value);
  const total = rent + Number(fields.advance.value) + Number(fields.deposit.value);

  document.querySelector('#preview-name').textContent = fields.property.value;
  document.querySelector('#preview-address').textContent = fields.address.value;
  document.querySelector('#preview-rent').textContent = '₱' + rent.toLocaleString();
  document.querySelector('#preview-total').textContent = 'Move-in: ₱' + total.toLocaleString();
  document.querySelector('#spaces-left').value = fields.capacity.value - fields.occupied.value;
}

form.addEventListener('input', updatePreview);
updatePreview();


// PHOTOS
photoInput.addEventListener('change', function () {
  gallery.innerHTML = '';

  for (const file of photoInput.files) {
    const image = document.createElement('img');
    image.className = 'upload-photo';
    image.src = URL.createObjectURL(file); // link to the chosen photo
    gallery.append(image);
  }
});


// SUBMIT
form.addEventListener('submit', function (event) {
  event.preventDefault(); // stay on this page

  if (fields.capacity.value - fields.occupied.value < 0) {
    statusMessage.textContent = 'Current occupants cannot be more than the room capacity.';
  } else {
    statusMessage.textContent = 'Thank you! Your property details are complete.';
    form.reset();
    gallery.innerHTML = '';
    updatePreview();
  }
});
