// 获取白名单并判断当前站点是否启用功能
function checkWhitelist(callback) {
  chrome.storage.sync.get({ whitelist: [] }, function (data) {
    const whitelist = data.whitelist || [];
    const host = window.location.hostname;
    const enabled = whitelist.some(domain => host.endsWith(domain));
    callback(enabled);
  });
}

// 黑夜模式样式
const nightStyleId = '__night_mode_style__';
function enableNightMode() {
  if (document.getElementById(nightStyleId)) return;
  const style = document.createElement('style');
  style.id = nightStyleId;
  style.innerText = `
    html, body {
      background: #181a1b !important;
      color: #c8c8c8 !important;
    }
    img, picture, video, svg, source {
      filter: brightness(0.7) grayscale(0.5) !important;
    }
    * {
      background-color: transparent !important;
      border-color: #333 !important;
      color: #c8c8c8 !important;
    }
    a { color: #8ab4f8 !important; }
    input, textarea, select, button {
      background: #222 !important;
      color: #c8c8c8 !important;
      border: 1px solid #444 !important;
    }
  `;
  document.head.appendChild(style);
}

function disableNightMode() {
  const style = document.getElementById(nightStyleId);
  if (style) style.remove();
}

let imagesBlocked = true;
function blockImages() {
  document.querySelectorAll('img, picture, video, svg, source').forEach(el => {
    el.style.display = 'none';
  });
  // 动态插入的图片也屏蔽
  const observer = new MutationObserver(() => {
    document.querySelectorAll('img, picture, video, svg, source').forEach(el => {
      el.style.display = 'none';
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.__imgBlockObserver = observer;
}

function showImages() {
  document.querySelectorAll('img, picture, video, svg, source').forEach(el => {
    el.style.display = '';
  });
  if (window.__imgBlockObserver) {
    window.__imgBlockObserver.disconnect();
    window.__imgBlockObserver = null;
  }
}

// 消息监听
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'toggleNight') {
    if (document.getElementById(nightStyleId)) {
      disableNightMode();
    } else {
      enableNightMode();
    }
  } else if (request.action === 'toggleImages') {
    if (imagesBlocked) {
      showImages();
      imagesBlocked = false;
    } else {
      blockImages();
      imagesBlocked = true;
    }
  }
});

checkWhitelist(function (enabled) {
  if (!enabled) return;
  blockImages();
  enableNightMode();
});