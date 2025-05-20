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

  // Real translation function using LibreTranslate API
  async function translateLabel(text) {
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: 'en',
          format: 'text'
        })
      });
      if (!response.ok) {
        console.error('Translation API error:', response.statusText);
        return text; // fallback to original text
      }
      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation API fetch error:', error);
      return text; // fallback to original text
    }
  }

document.addEventListener('submit', async (event) => {
    console.log('Form submit event detected');
    if (!window.__formLabelCaptureEnabled) {
      console.log('Form capture disabled, ignoring submit');
      return;
    }

    // Exclude dashboard site from capturing
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
      console.log('Form submission on dashboard site ignored');
      return;
    }

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      console.log('Event target is not a form element');
      return;
    }

    const fields = [];
    const inputs = form.querySelectorAll('input, select, textarea');
    for (const input of inputs) {
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

      if (!labelText && input.getAttribute('aria-label')) {
        labelText = input.getAttribute('aria-label').trim();
      }

      if (!labelText && input.title) {
        labelText = input.title.trim();
      }

      if (!labelText && input.placeholder) {
        labelText = input.placeholder.trim();
      }

      if (labelText) {
        const translatedLabel = await translateLabel(labelText);
        fields.push({
          field_name_original: labelText,
          field_name_translated: translatedLabel,
          field_value: input.value || ''
        });
      }
    }

    if (fields.length === 0) {
      console.log('No fields found in form, skipping');
      return;
    }

    const formMetadata = {
      url: window.location.href,
      page_title: document.title,
      fields: fields
    };

    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token found, cannot send form metadata');
      return;
    }

    console.log('Sending form metadata to background:', formMetadata);
    console.log('Before sending message to background');
    chrome.runtime.sendMessage({
      type: 'formSubmission',
      data: formMetadata,
      token: token
    }, (response) => {
      console.log('Message sent to background');
      console.log('Background response:', response);
    });
  });
})();
