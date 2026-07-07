(() => {
  const files = [1, 2, 3, 4, 5].map(i => `game-v3.part${i}.txt?v=3`);
  Promise.all(files.map(file => fetch(file, { cache: 'no-store' }).then(response => {
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    return response.text();
  }))).then(parts => {
    const source = parts.join('');
    new Function(source)();
  }).catch(error => {
    console.error('PIXEL RIFT 載入失敗', error);
    const message = document.createElement('div');
    message.style.cssText = 'position:fixed;inset:0;z-index:999;display:grid;place-items:center;padding:24px;background:#09061d;color:#ffd166;font:700 16px Courier New;text-align:center';
    message.textContent = '遊戲載入失敗，請重新整理頁面。';
    document.body.appendChild(message);
  });
})();
