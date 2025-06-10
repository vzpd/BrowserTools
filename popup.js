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
 * Applies the given settings to a tab by injecting or removing CSS.
 * @param {number} tabId The ID of the tab to apply settings to.
 * @param {object} settings The settings object { darkMode, showImages }.
 */
function applySettingsToTab(tabId, settings) {
    try {
        if (settings.darkMode) {
            chrome.scripting.insertCSS({ target: { tabId: tabId }, files: ['styles/dark-mode.css'] });
        } else {
            chrome.scripting.removeCSS({ target: { tabId: tabId }, files: ['styles/dark-mode.css'] });
        }

        if (!settings.showImages) {
            chrome.scripting.insertCSS({ target: { tabId: tabId }, files: ['styles/hide-images.css'] });
        } else {
            chrome.scripting.removeCSS({ target: { tabId: tabId }, files: ['styles/hide-images.css'] });
        }
    } catch (e) {
        console.error("无法应用设置:", e);
    }
}

/**
 * Saves the current settings for the active hostname to chrome.storage.
 */
async function saveSettings() {
    const settings = {
        darkMode: darkModeToggle.checked,
        showImages: imagesToggle.checked,
    };
    if (hostname) {
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
        applySettingsToTab(activeTab.id, {
            darkMode: darkModeToggle.checked,
            showImages: imagesToggle.checked,
        });
    }
}


// --- Initialization ---

/**
 * Initializes the popup: gets the active tab, loads settings, and sets up listeners.
 */
async function initialize() {
    try {
        // 1. 获取当前活动的标签页
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 关键检查：确保成功获取到标签页
        if (!tabs || tabs.length === 0 || !tabs[0]) {
             loadingState.textContent = '无法获取当前标签页信息。';
             return;
        }
        activeTab = tabs[0];

        // 2. 检查URL是否有效
        if (!activeTab.url || !activeTab.url.startsWith('http')) {
            loadingState.textContent = '无法在此页面上应用设置。';
            settingsPanel.classList.add('hidden');
            loadingState.classList.remove('hidden');
            return;
        }

        // 3. 从URL获取主机名
        hostname = new URL(activeTab.url).hostname;
        currentSiteEl.textContent = `当前站点: ${hostname}`;
        
        // 4. 从存储中加载设置
        const data = await chrome.storage.sync.get(hostname);
        const settings = data[hostname] || { darkMode: false, showImages: true };
        
        // 5. 更新UI开关状态
        darkModeToggle.checked = settings.darkMode;
        imagesToggle.checked = settings.showImages;

        // 6. 显示设置面板，隐藏加载提示
        settingsPanel.classList.remove('hidden');
        loadingState.classList.add('hidden');

        // 7. 绑定事件监听器
        darkModeToggle.addEventListener('change', handleToggleChange);
        imagesToggle.addEventListener('change', handleToggleChange);

    } catch (error) {
        // 如果在初始化过程中发生任何错误，则捕获并显示
        console.error("弹窗初始化失败:", error);
        loadingState.textContent = '初始化失败，请在网页上重试。';
        settingsPanel.classList.add('hidden');
        loadingState.classList.remove('hidden');
    }
}

// 当弹窗加载完毕后，执行初始化函数
document.addEventListener('DOMContentLoaded', initialize);
