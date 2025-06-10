/**
 * 安全地注入CSS，忽略在特殊页面上可能发生的错误。
 * @param {object} injection The injection object for insertCSS.
 */
async function safeInsertCSS(injection) {
  try {
      await chrome.scripting.insertCSS(injection);
  } catch (err) {
      // 忽略错误，这在特殊页面或CSS已注入时是正常现象
  }
}

/**
* 安全地移除CSS，忽略在CSS未注入时可能发生的错误。
* @param {object} injection The injection object for removeCSS.
*/
async function safeRemoveCSS(injection) {
  try {
      await chrome.scripting.removeCSS(injection);
  } catch (err) {
      // 忽略错误，这在CSS从未注入时是正常现象
  }
}

/**
* 根据已存储的设置为指定标签页应用样式。
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

      if (settings) {
          // 应用或移除暗黑模式
          if (settings.darkMode) {
              await safeInsertCSS({ target: { tabId }, files: ['styles/dark-mode.css'] });
          } else {
              await safeRemoveCSS({ target: { tabId }, files: ['styles/dark-mode.css'] });
          }

          // 应用或移除隐藏图片样式
          if (!settings.showImages) {
              await safeInsertCSS({ target: { tabId }, files: ['styles/hide-images.css'] });
          } else {
              await safeRemoveCSS({ target: { tabId }, files: ['styles/hide-images.css'] });
          }
      } else {
          // 如果没有设置，确保移除所有样式，恢复默认状态
          await safeRemoveCSS({ target: { tabId }, files: ['styles/dark-mode.css'] });
          await safeRemoveCSS({ target: { tabId }, files: ['styles/hide-images.css'] });
      }
  } catch (error) {
      console.warn(`无法为 ${url} 应用设置:`, error);
  }
}

/**
* 监听标签页更新事件，以便在页面加载时自动应用设置。
*/
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 仅在页面开始加载时注入，防止重复操作
  if (changeInfo.status === 'loading' && tab.url) {
      applySettingsForTab(tabId, tab.url);
  }
});
