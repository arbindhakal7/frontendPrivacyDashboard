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

  // Handle auth token storage and clearing
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    console.log('Content script received message:', event.data);
    if ((event.data?.type === 'SET_AUTH_TOKEN' || event.data?.type === 'SAVE_AUTH_TOKEN') && event.data.token) {
      console.log('Content script setting auth_token');
      chrome.storage.local.set({ auth_token: event.data.token });
    }
    if (event.data?.type === 'CLEAR_AUTH_TOKEN') {
      console.log('Content script clearing auth_token');
      chrome.storage.local.remove('auth_token');
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

  // Determine sensitivity based on field name or type
  function determineSensitivity(fieldName, fieldType) {
    const sensitiveKeywords = ['password', 'ssn', 'social security', 'credit card', 'cc', 'cvv', 'pin', 'security code', 'dob', 'date of birth', 'passport', 'driver license', 'bank account', 'routing number'];
    const nameLower = fieldName.toLowerCase();
    for (const keyword of sensitiveKeywords) {
      if (nameLower.includes(keyword)) {
        return 'high';
      }
    }
    if (fieldType === 'email') {
      return 'medium';
    }
    return 'low';
  }

  // Extract form data without blocking
  function extractFormData(form) {
    const fields = [];
    // Include password fields now
    const inputs = form.querySelectorAll('input, select, textarea');

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

      // Additional check: aria-labelledby attribute
      if (!labelText && input.hasAttribute('aria-labelledby')) {
        const labelledId = input.getAttribute('aria-labelledby');
        const labelledElem = document.getElementById(labelledId);
        if (labelledElem) labelText = labelledElem.textContent.trim();
      }

      // Additional heuristic: check previous sibling label
      if (!labelText) {
        const prevSibling = input.previousElementSibling;
        if (prevSibling && prevSibling.tagName.toLowerCase() === 'label') {
          labelText = prevSibling.textContent.trim();
        }
      }

      // Additional heuristic: check next sibling label
      if (!labelText) {
        const nextSibling = input.nextElementSibling;
        if (nextSibling && nextSibling.tagName.toLowerCase() === 'label') {
          labelText = nextSibling.textContent.trim();
        }
      }

      // Additional heuristic: check preceding text node
      if (!labelText) {
        let prevNode = input.previousSibling;
        while (prevNode) {
          if (prevNode.nodeType === Node.TEXT_NODE && prevNode.textContent.trim()) {
            labelText = prevNode.textContent.trim();
            break;
          }
          prevNode = prevNode.previousSibling;
        }
      }

      labelText = labelText || input.getAttribute('aria-label') ||
                 input.getAttribute('placeholder') ||
                 input.name || 'Unnamed Field';

      const sensitivity = determineSensitivity(labelText, input.type);

      fields.push({
        field_name: labelText,
        field_value: input.value || '',
        field_type: input.type || 'text',
        sensitivity: sensitivity
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
            // Capture the current value of formCaptureEnabled
            const isCaptureEnabled = formCaptureEnabled;
            form.addEventListener('submit', function(event) {
              if (!isCaptureEnabled) return;

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
