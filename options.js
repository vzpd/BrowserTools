// 选项页白名单管理脚本
function renderWhitelist() {
  chrome.storage.sync.get({ whitelist: [] }, function (data) {
    const list = data.whitelist || [];
    const ul = document.getElementById('whitelist');
    ul.innerHTML = '';
    list.forEach((domain, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="domain">${domain}</span> <button data-idx="${idx}" class="removeBtn">移除</button>`;
      ul.appendChild(li);
    });
    document.querySelectorAll('.removeBtn').forEach(btn => {
      btn.onclick = function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        list.splice(idx, 1);
        chrome.storage.sync.set({ whitelist: list }, renderWhitelist);
      };
    });
  });
}

document.getElementById('addBtn').onclick = function () {
  const input = document.getElementById('domainInput');
  const domain = input.value.trim();
  if (!domain) return;
  chrome.storage.sync.get({ whitelist: [] }, function (data) {
    const list = data.whitelist || [];
    if (!list.includes(domain)) {
      list.push(domain);
      chrome.storage.sync.set({ whitelist: list }, renderWhitelist);
    }
    input.value = '';
  });
};

renderWhitelist();