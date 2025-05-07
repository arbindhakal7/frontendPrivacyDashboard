/* global chrome */
(function() {
  console.log('Content script loaded');

  window.__formLabelCaptureEnabled = false;
  chrome.storage.local.get(['captureEnabled'], (result) => {
    window.__formLabelCaptureEnabled = result.captureEnabled || false;
    console.log('Form capture enabled:', window.__formLabelCaptureEnabled);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.captureEnabled) {
      window.__formLabelCaptureEnabled = changes.captureEnabled.newValue;
      console.log('Form capture enabled changed:', window.__formLabelCaptureEnabled);
    }
  });

  // Listen for messages from the web app to receive auth token
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && (event.data.type === 'SET_AUTH_TOKEN' || event.data.type === 'SAVE_AUTH_TOKEN') && event.data.token) {
      console.log('Content script received auth token from web app');
      chrome.storage.local.set({ auth_token: event.data.token }, () => {
        console.log('Auth token stored in chrome.storage.local');
      });
    }
  });

  function getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get('auth_token', (result) => {
        resolve(result.auth_token);
      });
    });
  }

  document.addEventListener('submit', async (event) => {
    console.log('Form submit event detected');
    if (!window.__formLabelCaptureEnabled) {
      console.log('Form capture disabled, ignoring submit');
      return;
    }

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      console.log('Event target is not a form element');
      return;
    }

    const labels = [];
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      let labelText = '';

      if (input.id) {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (label) {
          labelText = label.innerText.trim();
        }
      }

      if (!labelText) {
        const parentLabel = input.closest('label');
        if (parentLabel) {
          labelText = parentLabel.innerText.trim();
        }
      }

      if (!labelText && input.placeholder) {
        labelText = input.placeholder.trim();
      }

      if (labelText) {
        labels.push(labelText);
      }
    });

    if (labels.length === 0) {
      console.log('No labels found in form, skipping');
      return;
    }

    const formMetadata = {
      url: window.location.href,
      page_title: document.title,
      fields: labels.map(label => ({
        field_name: label,
        field_value: ''
      }))
    };

    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token found, cannot send form metadata');
      return;
    }

    console.log('Sending form metadata to background:', formMetadata);
    chrome.runtime.sendMessage({
      type: 'formSubmission',
      data: formMetadata,
      token: token
    }, (response) => {
      console.log('Background response:', response);
    });
  });
})();
