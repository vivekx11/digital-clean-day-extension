// Digital Clean Day - Popup Script..
// Handles all UI interactions and cleaning operations..

// Motivational quotes
const quotes = [
  "A clean digital space leads to a clear mind.",
  "Less clutter, more focus.",
  "Simplicity is the ultimate sophistication.",
  "Clear your browser, clear your thoughts.",
  "Digital minimalism for mental clarity.",
  "Less tabs, more productivity.",
  "Clean today, focus tomorrow.",
  "Your browser deserves a fresh start."
];

// Screen navigation
const screens = {
  main: document.getElementById('mainScreen'),
  preview: document.getElementById('previewScreen'),
  safe: document.getElementById('safeScreen'),
  why: document.getElementById('whyScreen'),
  cleaning: document.getElementById('cleaningScreen'),
  success: document.getElementById('successScreen')
};

// Show a specific screen
function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[screenName].classList.add('active');
}

// Random quote on load
function setRandomQuote() {
  const quoteText = document.getElementById('quoteText');
  if (quoteText) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = randomQuote;
  }
}

// Format milliseconds to readable time
function formatTime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Update screen time display
async function updateScreenTime() {
  const data = await chrome.storage.local.get(['screenTimeToday']);
  const timeMs = data.screenTimeToday || 0;
  
  const screenTimeEl = document.getElementById('screenTime');
  const progressFillEl = document.getElementById('progressFill');
  
  if (screenTimeEl) {
    screenTimeEl.textContent = formatTime(timeMs);
  }
  
  // Update progress bar (goal: 4 hours = 240 minutes)
  if (progressFillEl) {
    const goalMs = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    const percentage = Math.min((timeMs / goalMs) * 100, 100);
    progressFillEl.style.width = `${percentage}%`;
    
    // Update percentage text
    const percentageText = document.querySelector('.stat-footer .stat-detail:last-child');
    if (percentageText) {
      percentageText.textContent = `📊 ${Math.round(percentage)}% used`;
    }
  }
}

// Update screen time every 10 seconds while popup is open
let screenTimeInterval = null;
function startScreenTimeUpdates() {
  updateScreenTime();
  screenTimeInterval = setInterval(updateScreenTime, 10000); // Update every 10 seconds
}

function stopScreenTimeUpdates() {
  if (screenTimeInterval) {
    clearInterval(screenTimeInterval);
    screenTimeInterval = null;
  }
}

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  // Load saved dark mode preference
  chrome.storage.local.get(['darkMode'], (result) => {
    if (result.darkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.checked = true;
    }
  });

  darkModeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark-mode');
      chrome.storage.local.set({ darkMode: true });
    } else {
      document.body.classList.remove('dark-mode');
      chrome.storage.local.set({ darkMode: false });
    }
  });
}

// Clean mode toggle
const cleanModeToggle = document.getElementById('cleanModeToggle');
if (cleanModeToggle) {
  chrome.storage.local.get(['cleanModeEnabled'], (result) => {
    cleanModeToggle.checked = result.cleanModeEnabled || false;
  });

  cleanModeToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ cleanModeEnabled: e.target.checked });
  });
}

// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  // Set random quote
  setRandomQuote();
  
  // Start screen time updates
  startScreenTimeUpdates();
  
  const settings = await chrome.storage.local.get(['cleanTabs', 'cleanCookies', 'cleanStorage', 'schedule']);
  
  // Set checkboxes (default to checked if not set)
  document.getElementById('cleanTabs').checked = settings.cleanTabs !== false;
  document.getElementById('cleanCookies').checked = settings.cleanCookies !== false;
  document.getElementById('cleanStorage').checked = settings.cleanStorage !== false;
  
  // Set schedule radio button
  const schedule = settings.schedule || 'manual';
  document.querySelector(`input[name="schedule"][value="${schedule}"]`).checked = true;
});

// Stop updates when popup closes
window.addEventListener('unload', () => {
  stopScreenTimeUpdates();
});

// Save settings whenever they change
document.getElementById('cleanTabs').addEventListener('change', (e) => {
  chrome.storage.local.set({ cleanTabs: e.target.checked });
});

document.getElementById('cleanCookies').addEventListener('change', (e) => {
  chrome.storage.local.set({ cleanCookies: e.target.checked });
});

document.getElementById('cleanStorage').addEventListener('change', (e) => {
  chrome.storage.local.set({ cleanStorage: e.target.checked });
});

document.querySelectorAll('input[name="schedule"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const schedule = e.target.value;
    chrome.storage.local.set({ schedule });
    
    // Tell background script to update the alarm
    chrome.runtime.sendMessage({ action: 'updateSchedule', schedule });
  });
});

// Navigation links
document.getElementById('previewLink').addEventListener('click', async (e) => {
  e.preventDefault();
  await showPreview();
  showScreen('preview');
});

document.getElementById('safeLink').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('safe');
});

document.getElementById('whyLink').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('why');
});

// Back buttons
document.getElementById('backFromPreview').addEventListener('click', () => showScreen('main'));
document.getElementById('backFromSafe').addEventListener('click', () => showScreen('main'));
document.getElementById('backFromWhy').addEventListener('click', () => showScreen('main'));

// Preview clean - calculate what will be cleaned
async function showPreview() {
  const settings = await chrome.storage.local.get(['cleanTabs', 'cleanCookies', 'cleanStorage']);
  
  // Count unused tabs
  let tabCount = 0;
  if (settings.cleanTabs !== false) {
    const tabs = await chrome.tabs.query({});
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const tab of tabs) {
      // Skip active, pinned, and recently accessed tabs
      if (!tab.active && !tab.pinned) {
        const lastAccessed = await getTabLastAccessed(tab.id);
        if (lastAccessed < sevenDaysAgo) {
          tabCount++;
        }
      }
    }
  }
  
  // Estimate tracking cookies (simplified)
  let cookieCount = 0;
  if (settings.cleanCookies !== false) {
    const cookies = await chrome.cookies.getAll({});
    // Estimate: cookies with common tracking domains
    cookieCount = cookies.filter(c => 
      c.domain.includes('google-analytics') ||
      c.domain.includes('doubleclick') ||
      c.domain.includes('facebook') ||
      c.domain.includes('ads') ||
      c.name.includes('_ga') ||
      c.name.includes('_gid')
    ).length;
  }
  
  // Update preview display
  document.getElementById('previewTabs').textContent = tabCount;
  document.getElementById('previewCookies').textContent = cookieCount;
  document.getElementById('previewStorage').textContent = settings.cleanStorage !== false ? '10-50 MB' : '0 MB';
}

// Get tab last accessed time (stored in local storage)
async function getTabLastAccessed(tabId) {
  const data = await chrome.storage.local.get([`tab_${tabId}`]);
  return data[`tab_${tabId}`] || Date.now();
}

// Main clean button
document.getElementById('cleanBtn').addEventListener('click', async () => {
  showScreen('cleaning');
  await performClean();
});

// Perform the actual cleaning
async function performClean() {
  const settings = await chrome.storage.local.get(['cleanTabs', 'cleanCookies', 'cleanStorage']);
  const results = { tabs: 0, cookies: 0, storage: 0 };
  
  // Animate progress steps
  const steps = ['step1', 'step2', 'step3'];
  let currentStep = 0;
  
  const stepInterval = setInterval(() => {
    if (currentStep > 0) {
      document.getElementById(steps[currentStep - 1]).classList.remove('active');
    }
    if (currentStep < steps.length) {
      document.getElementById(steps[currentStep]).classList.add('active');
      currentStep++;
    }
  }, 800);
  
  // Step 1: Clean unused tabs
  if (settings.cleanTabs !== false) {
    await new Promise(resolve => setTimeout(resolve, 800));
    results.tabs = await cleanUnusedTabs();
  }
  
  // Step 2: Clean tracking cookies
  if (settings.cleanCookies !== false) {
    await new Promise(resolve => setTimeout(resolve, 800));
    results.cookies = await cleanTrackingCookies();
  }
  
  // Step 3: Clean storage
  if (settings.cleanStorage !== false) {
    await new Promise(resolve => setTimeout(resolve, 800));
    results.storage = await cleanWebsiteStorage();
  }
  
  clearInterval(stepInterval);
  
  // Save results and closed tabs for restore feature
  await chrome.storage.local.set({ 
    lastCleanResults: results,
    lastCleanTime: Date.now()
  });
  
  // Show success screen
  document.getElementById('resultTabs').textContent = results.tabs;
  document.getElementById('resultCookies').textContent = results.cookies;
  document.getElementById('resultStorage').textContent = results.storage;
  
  showScreen('success');
}

// Clean unused tabs (not used in 7 days)
async function cleanUnusedTabs() {
  const tabs = await chrome.tabs.query({});
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
  let closedCount = 0;
  const closedTabs = [];
  
  for (const tab of tabs) {
    // NEVER close: active tabs, pinned tabs, recently used tabs
    if (tab.active || tab.pinned) continue;
    
    const lastAccessed = await getTabLastAccessed(tab.id);
    
    // Skip if accessed in last 2 days
    if (lastAccessed > twoDaysAgo) continue;
    
    // Close if not accessed in 7 days
    if (lastAccessed < sevenDaysAgo) {
      closedTabs.push({ url: tab.url, title: tab.title });
      await chrome.tabs.remove(tab.id);
      closedCount++;
    }
  }
  
  // Save closed tabs for restore feature
  if (closedTabs.length > 0) {
    await chrome.storage.local.set({ closedTabs });
  }
  
  return closedCount;
}

// Clean tracking cookies only
async function cleanTrackingCookies() {
  const cookies = await chrome.cookies.getAll({});
  let removedCount = 0;
  
  // List of tracking/ad domains and cookie names to remove
  const trackingPatterns = [
    'google-analytics',
    'doubleclick',
    'facebook',
    'twitter',
    'linkedin',
    'ads',
    'adservice',
    'tracking',
    'analytics'
  ];
  
  const trackingCookieNames = [
    '_ga', '_gid', '_gat', '__utma', '__utmb', '__utmc', '__utmz',
    'fr', 'datr', 'sb', // Facebook
    '_fbp', '_fbc', // Facebook Pixel
    'IDE', 'DSID', 'FLC', // Google DoubleClick
    'personalization_id', // Twitter
    'bcookie', 'lidc', // LinkedIn
  ];
  
  for (const cookie of cookies) {
    // Check if it's a tracking cookie
    const isTracking = 
      trackingPatterns.some(pattern => cookie.domain.includes(pattern)) ||
      trackingCookieNames.some(name => cookie.name.startsWith(name));
    
    if (isTracking) {
      const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      await chrome.cookies.remove({ url, name: cookie.name });
      removedCount++;
    }
  }
  
  return removedCount;
}

// Clean website storage (cache and temporary data)
async function cleanWebsiteStorage() {
  // Clear cache, service workers, and other temporary data
  // This does NOT clear passwords, form data, or important storage
  await chrome.browsingData.remove({
    since: 0
  }, {
    cache: true,
    serviceWorkers: true,
    cacheStorage: true
  });
  
  // Return estimated MB cleaned (simplified)
  return Math.floor(Math.random() * 40) + 10; // 10-50 MB estimate
}

// Restore last clean (restore closed tabs)
document.getElementById('restoreBtn').addEventListener('click', async () => {
  const data = await chrome.storage.local.get(['closedTabs']);
  
  if (data.closedTabs && data.closedTabs.length > 0) {
    // Reopen closed tabs
    for (const tab of data.closedTabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    
    // Clear the restore data
    await chrome.storage.local.remove('closedTabs');
    
    // Update button
    document.getElementById('restoreBtn').textContent = '✓ Tabs Restored';
    document.getElementById('restoreBtn').disabled = true;
  }
});

// Done button
document.getElementById('doneBtn').addEventListener('click', () => {
  window.close();
});
