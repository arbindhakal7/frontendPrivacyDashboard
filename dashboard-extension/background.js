/* global chrome */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background: Message received', message);

  if (message.type === 'formSubmission') {
    const token = message.token;
    console.log('Background: Token used for authorization:', token);
    console.log('Background: Sending data to backend...');

    fetch('http://localhost:5000/api/forms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(message.data)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('Background: Success sending data', result);
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Background: Error sending data', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keeps message channel open
  }
});
