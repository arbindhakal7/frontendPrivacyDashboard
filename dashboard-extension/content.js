/* global chrome */
(function () {
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

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && (event.data.type === 'SET_AUTH_TOKEN' || event.data.type === 'SAVE_AUTH_TOKEN') && event.data.token) {
      chrome.storage.local.set({ auth_token: event.data.token }, () => {
        console.log('Auth token stored');
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

  async function translateLabel(text) {
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: 'en',
          format: 'text'
        })
      });
      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  document.addEventListener('submit', async (event) => {
    if (!window.__formLabelCaptureEnabled) return;

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    event.preventDefault(); // prevent reload

    const fields = [];
    const inputs = form.querySelectorAll('input, select, textarea');

    for (const input of inputs) {
      let labelText = '';

      if (input.id) {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (label) labelText = label.innerText.trim();
      }

      if (!labelText) {
        const parentLabel = input.closest('label');
        if (parentLabel) labelText = parentLabel.innerText.trim();
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

      const translatedLabel = labelText ? await translateLabel(labelText) : 'Unnamed Field';

      fields.push({
        field_name: translatedLabel,
        field_value: input.value || ''
      });
    }

    if (!fields.length) return;

    const formMetadata = {
      url: window.location.href,
      page_title: document.title,
      fields: fields
    };

    const token = await getAuthToken();
    if (!token) {
      console.warn('No auth token found');
      return;
    }

    chrome.runtime.sendMessage({
      type: 'formSubmission',
      data: formMetadata,
      token: token
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Send message failed:', chrome.runtime.lastError.message);
      } else {
        console.log('Background response:', response);
      }
    });

    setTimeout(() => {
      form.submit(); // Let the form actually submit now
    }, 300);
  });
})();
