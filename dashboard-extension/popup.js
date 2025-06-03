/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleCapture');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const mainCard = document.querySelector('.main-card');

  // Initialize with loading state
  mainCard.classList.add('loading');

  // Enhanced animation delays for staggered loading
  setTimeout(() => {
    mainCard.classList.remove('loading');
  }, 800);

  // Load saved state and initialize UI
  chrome.storage.local.get(['captureEnabled', 'auth_token'], (result) => {
    const isEnabled = result.captureEnabled || false;
    const token = result.auth_token;

    // Set toggle state with animation
    toggle.checked = isEnabled;
    updateStatusIndicator(isEnabled);

    // Handle dashboard button visibility
    if (token) {
      dashboardBtn.style.display = 'flex';
      dashboardBtn.classList.add('animate-in');
    } else {
      dashboardBtn.style.display = 'none';
    }
  });

  // Helper function to notify all tabs to update capture state
  function notifyTabsCaptureState(enabled) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        try {
          chrome.tabs.sendMessage(tab.id, { type: 'updateCaptureState', enabled: enabled });
        } catch (error) {
          console.error('Error sending message to tab:', tab.id, error);
        }
      }
    });
  }

  // Enhanced toggle change handler with animations
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    
    // Add visual feedback
    const toggleContainer = document.querySelector('.toggle-container');
    toggleContainer.style.transform = 'scale(0.98)';
    setTimeout(() => {
      toggleContainer.style.transform = 'scale(1)';
    }, 150);

    // Update status with smooth transition
    updateStatusIndicator(enabled);
    
    // Save state and notify content scripts
    chrome.storage.local.set({ captureEnabled: enabled }, () => {
      notifyTabsCaptureState(enabled);
    });

    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  });

  // Enhanced dashboard button click with loading state
  dashboardBtn.addEventListener('click', () => {
    // Add loading state
    dashboardBtn.classList.add('loading');
    dashboardBtn.innerHTML = `
      <span class="material-icons" style="animation: spin 1s linear infinite;">refresh</span>
      <span>Opening...</span>
    `;

    const dashboardUrl = 'http://localhost:3000/dashboard';
    
    chrome.tabs.create({ url: dashboardUrl }, () => {
      // Reset button after a delay
      setTimeout(() => {
        dashboardBtn.classList.remove('loading');
        dashboardBtn.innerHTML = `
          <span class="material-icons">dashboard</span>
          <span>Open Dashboard</span>
        `;
      }, 1000);
    });
  });

  // Function to run in content script context
  function setCaptureState(enabled) {
    window.__formLabelCaptureEnabled = enabled;
  }

  // Enhanced status indicator update with smooth transitions
  function updateStatusIndicator(enabled) {
    const statusDot = statusIndicator.querySelector('.status-dot');
    
    if (enabled) {
      statusText.textContent = 'Protection Active';
      statusIndicator.style.background = 'rgba(78, 205, 196, 0.15)';
      statusIndicator.style.borderColor = 'rgba(78, 205, 196, 0.3)';
      statusText.style.color = '#4ECDC4';
      statusDot.style.background = '#4ECDC4';
      statusDot.style.animation = 'pulse 2s infinite';
    } else {
      statusText.textContent = 'Protection Disabled';
      statusIndicator.style.background = 'rgba(255, 107, 107, 0.15)';
      statusIndicator.style.borderColor = 'rgba(255, 107, 107, 0.3)';
      statusText.style.color = '#FF6B6B';
      statusDot.style.background = '#FF6B6B';
      statusDot.style.animation = 'none';
    }
  }

  // Add CSS for additional animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .animate-in {
      animation: slideUp 0.5s ease-out;
    }
    
    .toggle-container {
      transition: all 0.3s ease, transform 0.15s ease;
    }
    
    .status-indicator {
      transition: all 0.5s ease;
    }
    
    .status-text, .status-dot {
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Space or Enter to toggle
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      toggle.click();
    }
    // 'D' key to open dashboard
    if (e.code === 'KeyD' && dashboardBtn.style.display !== 'none') {
      e.preventDefault();
      dashboardBtn.click();
    }
  });

  // Add focus management for accessibility
  toggle.addEventListener('focus', () => {
    document.querySelector('.toggle-container').style.outline = '2px solid #4169e1';
  });

  toggle.addEventListener('blur', () => {
    document.querySelector('.toggle-container').style.outline = 'none';
  });
});
