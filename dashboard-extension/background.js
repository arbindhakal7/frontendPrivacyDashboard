/* global chrome */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'formSubmission') {
    const token = message.token;
    console.log('Background: Received formSubmission message', message);
    fetch('http://localhost:5000/api/forms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(message.data)
    }).then(response => response.json())
      .then(result => {
        console.log('Background: Success sending data', result);
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Background: Error sending data', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async sendResponse
  }
});
