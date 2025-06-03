/* global chrome */
(function () {
  console.log('Content script version 2 loaded');

  let formCaptureEnabled = false;
  let processingForm = false;

  // Initialize capture state
  chrome.storage.local.get(['captureEnabled'], (result) => {
    formCaptureEnabled = result.captureEnabled || false;
  });

  // Listen for capture state changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.captureEnabled) {
      formCaptureEnabled = changes.captureEnabled.newValue;
    }
  });

  // Handle auth token storage
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type === 'SET_AUTH_TOKEN' && event.data.token) {
      chrome.storage.local.set({ auth_token: event.data.token });
    }
  });

  // Get auth token
  function getAuthToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get('auth_token', (result) => {
        resolve(result.auth_token);
      });
    });
  }

  // Extract form data without blocking
  function extractFormData(form) {
    const fields = [];
    const inputs = form.querySelectorAll('input:not([type="password"]), select, textarea');
    
    inputs.forEach(input => {
      let labelText = '';
      
      // Try to find label
      if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) labelText = label.textContent.trim();
      }
      
      if (!labelText) {
        const parentLabel = input.closest('label');
        if (parentLabel) labelText = parentLabel.textContent.trim();
      }
      
      labelText = labelText || input.getAttribute('aria-label') || 
                 input.getAttribute('placeholder') || 
                 input.name || 'Unnamed Field';

      // Remove translation call to avoid delay
      // const translatedLabel = labelText ? await translateLabel(labelText) : 'Unnamed Field';

      fields.push({
        field_name: labelText,
        field_value: input.value || ''
      });
    });

    return fields;
  }

  // Send form data to background
  async function sendFormData(fields) {
    const token = await getAuthToken();
    if (!token) return;

    const formMetadata = {
      url: window.location.href,
      page_title: document.title,
      fields: fields
    };

    chrome.runtime.sendMessage({
      type: 'formSubmission',
      data: formMetadata,
      token: token
    });
  }

  // Watch for form submissions using MutationObserver
  const observer = new MutationObserver((mutations) => {
    if (!formCaptureEnabled) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element node
          const forms = node.matches('form') ? [node] : node.getElementsByTagName('form');
          
          for (const form of forms) {
  form.addEventListener('submit', function(event) {
    if (!formCaptureEnabled) return;

    console.log(`[${new Date().toISOString()}] Form submit event captured`);

    try {
      const fields = extractFormData(form);
      console.log(`[${new Date().toISOString()}] Extracted ${fields.length} fields`);

      if (fields.length) {
        if (window.requestIdleCallback) {
          requestIdleCallback(() => {
            console.log(`[${new Date().toISOString()}] Sending form data`);
            sendFormData(fields);
          });
        } else {
          setTimeout(() => {
            console.log(`[${new Date().toISOString()}] Sending form data`);
            sendFormData(fields);
          }, 0);
        }
      }
    } catch (error) {
      console.error('Form processing error:', error);
    }
  });
          }
        }
      }
    }
  });

  // Start observing the document
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Handle existing forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!formCaptureEnabled || processingForm) return;
      
      processingForm = true;
      
      try {
        const fields = extractFormData(form);
        if (fields.length) {
          if (window.requestIdleCallback) {
            requestIdleCallback(() => sendFormData(fields));
          } else {
            setTimeout(() => sendFormData(fields), 0);
          }
        }
      } catch (error) {
        console.error('Form processing error:', error);
      } finally {
        processingForm = false;
      }
    });
  });
})();
