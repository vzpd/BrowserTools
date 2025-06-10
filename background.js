/**
 * Applies settings for a tab on page load using the same robust logic as the popup.
 * @param {number} tabId The ID of the tab being updated.
 * @param {string} url The URL of the tab.
 */
async function applySettingsForTab(tabId, url) {
    if (!url || !url.startsWith('http')) {
        return;
    }

    try {
        const hostname = new URL(url).hostname;
        const data = await chrome.storage.sync.get(hostname);
        const settings = data[hostname];

        // First, always try to remove any existing styles to ensure a clean slate on reload.
        await chrome.scripting.removeCSS({
            target: { tabId: tabId },
            files: ['styles/dark-mode.css', 'styles/hide-images.css']
        }).catch(() => {}); // Suppress errors

        // If settings exist for this site, apply them.
        if (settings) {
            const filesToInsert = [];
            if (settings.darkMode) {
                filesToInsert.push('styles/dark-mode.css');
            }
            if (!settings.showImages) {
                filesToInsert.push('styles/hide-images.css');
            }

            if (filesToInsert.length > 0) {
                await chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    files: filesToInsert
                });
            }
        }
    } catch (error) {
        // This can happen if the extension tries to act on a tab that's already closed.
        if (!error.message.includes('No tab with id')) {
            console.warn(`无法为 ${url} 应用设置:`, error);
        }
    }
}

/**
 * Listens for tab updates to automatically apply settings on page load.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only inject when the page is loading to avoid multiple injections.
    if (changeInfo.status === 'loading' && tab.url) {
        applySettingsForTab(tabId, tab.url);
    }
});
