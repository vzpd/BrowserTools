// DOM elements
const darkModeToggle = document.getElementById('darkModeToggle');
const imagesToggle = document.getElementById('imagesToggle');
const settingsPanel = document.getElementById('settings-panel');
const loadingState = document.getElementById('loading-state');
const currentSiteEl = document.getElementById('current-site');

let activeTab;
let hostname;

// --- Helper Functions ---

/**
 * Applies settings to a tab using a more robust "reset and apply" approach.
 * This prevents state conflicts when toggling switches quickly.
 * @param {number} tabId The ID of the tab to apply settings to.
 * @param {object} settings The settings object { darkMode, showImages }.
 */
async function applySettingsToTab(tabId, settings) {
    try {
        // Step 1: First, try to remove all potentially injected CSS files to get a clean slate.
        // We add a .catch to ignore errors if the files weren't there to begin with.
        await chrome.scripting.removeCSS({
            target: { tabId: tabId },
            files: ['styles/dark-mode.css', 'styles/hide-images.css']
        }).catch(() => {}); // Suppress errors, it's ok if files don't exist

        // Step 2: Build a list of CSS files to insert based on the current settings.
        const filesToInsert = [];
        if (settings.darkMode) {
            filesToInsert.push('styles/dark-mode.css');
        }
        if (!settings.showImages) {
            filesToInsert.push('styles/hide-images.css');
        }

        // Step 3: If there are any files to insert, inject them in a single call.
        if (filesToInsert.length > 0) {
            await chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: filesToInsert
            });
        }
    } catch (e) {
        // This might happen on special pages like about:blank or chrome://
        console.error("无法应用样式:", e.message);
    }
}


/**
 * Saves the current settings for the active hostname to chrome.storage.
 */
async function saveSettings() {
    if (hostname) {
        const settings = {
            darkMode: darkModeToggle.checked,
            showImages: imagesToggle.checked,
        };
        await chrome.storage.sync.set({ [hostname]: settings });
    }
}

// --- Event Handlers ---

/**
 * Handles the change event for both toggles.
 * Saves the new settings and applies them to the active tab.
 */
async function handleToggleChange() {
    await saveSettings();
    if (activeTab && activeTab.id) {
        // Await the application to ensure it completes before another toggle can be made.
        await applySettingsToTab(activeTab.id, {
            darkMode: darkModeToggle.checked,
            showImages: imagesToggle.checked,
        });
    }
}


// --- Initialization ---

async function initialize() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0 || !tabs[0]) {
             loadingState.textContent = '无法获取当前标签页信息。';
             return;
        }
        activeTab = tabs[0];

        if (!activeTab.url || !activeTab.url.startsWith('http')) {
            loadingState.textContent = '无法在此页面上应用设置。';
            settingsPanel.classList.add('hidden');
            loadingState.classList.remove('hidden');
            return;
        }

        hostname = new URL(activeTab.url).hostname;
        currentSiteEl.textContent = `当前站点: ${hostname}`;
        
        const data = await chrome.storage.sync.get(hostname);
        const settings = data[hostname] || { darkMode: false, showImages: true };
        
        darkModeToggle.checked = settings.darkMode;
        imagesToggle.checked = settings.showImages;

        settingsPanel.classList.remove('hidden');
        loadingState.classList.add('hidden');

        darkModeToggle.addEventListener('change', handleToggleChange);
        imagesToggle.addEventListener('change', handleToggleChange);

    } catch (error) {
        console.error("弹窗初始化失败:", error);
        loadingState.textContent = '初始化失败，请在网页上重试。';
        settingsPanel.classList.add('hidden');
        loadingState.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', initialize);
