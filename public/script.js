/* eslint-disable */

const baseUrl = 'http://localhost:3000';
const url = `${baseUrl}/report`;

const $form = document.querySelector('#form');
const $submitButton = document.querySelector('#submitButton');
$form.addEventListener('submit', onFormSubmit);

async function onFormSubmit(event) {
  try {
    event.preventDefault();
    const formData = new FormData($form);
    disableFormButton();
    const response = await fetch(url, {
      body: formData,
      method: 'post',
    });
    if (response.status !== 200) {
      throw new Error('Failed');
    }
    const blob = await response.blob();
    downloadFile(blob);
    enableFormButton();
  } catch(err) {
    enableFormButton();
    window.alert('Something went wrong, Please try again');
  }
}

function disableFormButton() {
  $submitButton.innerText = 'Preparing report...';
  $submitButton.disabled = true;
}

function enableFormButton() {
  $submitButton.innerText = 'Submit';
  $submitButton.disabled = false;
}

function downloadFile(blob) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report.csv';
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
