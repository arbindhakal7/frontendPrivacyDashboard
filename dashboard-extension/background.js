/* global chrome */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'formSubmission') {
    // Send immediate response to not block form submission
    sendResponse({ received: true });

    const token = message.token;
    
    // Create an AbortController for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    fetch('http://localhost:5000/api/forms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(message.data),
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('Form data saved successfully:', result);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          console.warn('Form data submission timed out, but form submission continued');
        } else {
          console.error('Error saving form data:', error);
        }
      });

    // Don't return true since we already sent the response
    return false;
  }
});
