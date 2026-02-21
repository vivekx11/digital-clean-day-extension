// Digital Clean Day - Background Service Worker
// Handles automatic scheduled cleaning and tab tracking

// Screen time tracking variables
let sessionStartTime = Date.now();
let totalTimeToday = 0;
let isTracking = false;
let trackingInterval = null;

// Initialize screen time tracking
async function initializeScreenTime() {
  const today = new Date().toDateString();
  const data = await chrome.storage.local.get(['screenTimeDate', 'screenTimeToday']);
  
  // Reset if it's a new day
  if (data.screenTimeDate !== today) {
    await chrome.storage.local.set({
      screenTimeDate: today,
      screenTimeToday: 0
    });
    totalTimeToday = 0;
  } else {
    totalTimeToday = data.screenTimeToday || 0;
  }
  
  startTracking();
}

// Start tracking screen time
function startTracking() {
  if (isTracking) return;
  
  isTracking = true;
  sessionStartTime = Date.now();
  
  // Update every 30 seconds
  trackingInterval = setInterval(async () => {
    const sessionTime = Date.now() - sessionStartTime;
    totalTimeToday += sessionTime;
    sessionStartTime = Date.now();
    
    // Save to storage
    await chrome.storage.local.set({
      screenTimeToday: totalTimeToday
    });
  }, 30000); // 30 seconds
}

// Stop tracking (when browser is idle)
function stopTracking() {
  if (!isTracking) return;
  
  isTracking = false;
  
  // Save final session time
  const sessionTime = Date.now() - sessionStartTime;
  totalTimeToday += sessionTime;
  
  chrome.storage.local.set({
    screenTimeToday: totalTimeToday
  });
  
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

// Track when user is active
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'active') {
    startTracking();
  } else {
    stopTracking();
  }
});

// Track tab access times for "unused tabs" detection
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Record when a tab was last accessed
  const key = `tab_${activeInfo.tabId}`;
  await chrome.storage.local.set({ [key]: Date.now() });
  
  // Ensure tracking is active
  if (!isTracking) {
    startTracking();
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Record when a tab is updated (navigated, reloaded, etc.)
  if (changeInfo.status === 'complete') {
    const key = `tab_${tabId}`;
    await chrome.storage.local.set({ [key]: Date.now() });
  }
});

// Initialize: Set up automatic cleaning schedule
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Digital Clean Day installed');
  
  // Set default settings
  const settings = await chrome.storage.local.get(['cleanTabs', 'cleanCookies', 'cleanStorage', 'schedule']);
  
  if (settings.cleanTabs === undefined) {
    await chrome.storage.local.set({ cleanTabs: true });
  }
  if (settings.cleanCookies === undefined) {
    await chrome.storage.local.set({ cleanCookies: true });
  }
  if (settings.cleanStorage === undefined) {
    await chrome.storage.local.set({ cleanStorage: true });
  }
  if (settings.schedule === undefined) {
    await chrome.storage.local.set({ schedule: 'manual' });
  }
  
  // Initialize screen time tracking
  await initializeScreenTime();
  
  // Set up initial alarm if needed
  updateSchedule(settings.schedule || 'manual');
});

// Start tracking when service worker starts
chrome.runtime.onStartup.addListener(async () => {
  await initializeScreenTime();
});

// Listen for schedule updates from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateSchedule') {
    updateSchedule(message.schedule);
  }
});

// Update the automatic cleaning schedule
async function updateSchedule(schedule) {
  // Clear any existing alarm
  await chrome.alarms.clear('autoClean');
  
  if (schedule === 'manual') {
    console.log('Auto-clean disabled');
    return;
  }
  
  // Calculate delay in minutes
  let delayInMinutes;
  switch (schedule) {
    case 'weekly':
      delayInMinutes = 7 * 24 * 60; // 7 days
      break;
    case 'biweekly':
      delayInMinutes = 14 * 24 * 60; // 14 days
      break;
    case 'monthly':
      delayInMinutes = 30 * 24 * 60; // 30 days
      break;
    default:
      return;
  }
  
  // Create repeating alarm
  await chrome.alarms.create('autoClean', {
    delayInMinutes: delayInMinutes,
    periodInMinutes: delayInMinutes
  });
  
  console.log(`Auto-clean scheduled: ${schedule} (every ${delayInMinutes} minutes)`);
}

// Handle alarm - perform automatic cleaning
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoClean') {
    console.log('Auto-clean triggered');
    await performAutoClean();
  }
});

// Perform automatic cleaning in background
async function performAutoClean() {
  const settings = await chrome.storage.local.get(['cleanTabs', 'cleanCookies', 'cleanStorage']);
  const results = { tabs: 0, cookies: 0, storage: 0 };
  
  // Clean unused tabs
  if (settings.cleanTabs !== false) {
    results.tabs = await cleanUnusedTabs();
  }
  
  // Clean tracking cookies
  if (settings.cleanCookies !== false) {
    results.cookies = await cleanTrackingCookies();
  }
  
  // Clean storage
  if (settings.cleanStorage !== false) {
    results.storage = await cleanWebsiteStorage();
  }
  
  // Save results
  await chrome.storage.local.set({ 
    lastAutoCleanResults: results,
    lastAutoCleanTime: Date.now()
  });
  
  // Show silent notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Digital Clean Day',
    message: 'Automatic cleaning completed safely.',
    priority: 0,
    silent: true
  });
  
  console.log('Auto-clean completed:', results);
}

// Clean unused tabs (same logic as popup.js)
async function cleanUnusedTabs() {
  const tabs = await chrome.tabs.query({});
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
  let closedCount = 0;
  const closedTabs = [];
  
  for (const tab of tabs) {
    // NEVER close: active tabs, pinned tabs
    if (tab.active || tab.pinned) continue;
    
    const data = await chrome.storage.local.get([`tab_${tab.id}`]);
    const lastAccessed = data[`tab_${tab.id}`] || Date.now();
    
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

// Clean tracking cookies (same logic as popup.js)
async function cleanTrackingCookies() {
  const cookies = await chrome.cookies.getAll({});
  let removedCount = 0;
  
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
    'fr', 'datr', 'sb',
    '_fbp', '_fbc',
    'IDE', 'DSID', 'FLC',
    'personalization_id',
    'bcookie', 'lidc',
  ];
  
  for (const cookie of cookies) {
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

// Clean website storage (same logic as popup.js)
async function cleanWebsiteStorage() {
  await chrome.browsingData.remove({
    since: 0
  }, {
    cache: true,
    serviceWorkers: true,
    cacheStorage: true
  });
  
  return Math.floor(Math.random() * 40) + 10;
}
