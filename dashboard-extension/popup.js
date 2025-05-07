/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleCapture');
  const dashboardBtn = document.getElementById('dashboardBtn');

  // Load saved state for capture toggle
  chrome.storage.local.get(['captureEnabled'], (result) => {
    toggle.checked = result.captureEnabled || false;
  });

  // Save state on toggle change and notify content script
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ captureEnabled: enabled }, () => {
      // Notify all tabs to update capture state
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: setCaptureState,
            args: [enabled]
          });
        }
      });
    });
  });

  // Function to run in content script context to update capture state
  function setCaptureState(enabled) {
    window.__formLabelCaptureEnabled = enabled;
  }

  // Check if user is logged in by checking token in chrome.storage.local
  chrome.storage.local.get('auth_token', (result) => {
    const token = result.auth_token;
    console.log('Popup: Retrieved token:', token);
    if (token) {
      dashboardBtn.style.display = 'block';
    } else {
      dashboardBtn.style.display = 'none';
    }
  });

  // Open dashboard in new tab on button click
  dashboardBtn.addEventListener('click', () => {
    const dashboardUrl = 'http://localhost:3000/dashboard'; // Adjust URL as needed
    chrome.tabs.create({ url: dashboardUrl });
  });
});
