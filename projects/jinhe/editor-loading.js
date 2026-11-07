(() => {
  'use strict';
  const id = document.currentScript.dataset.template;
  const usesRestore = [1,4,5,10,12,16,17,19,25,62,68].includes(Number(id));
  const panel = document.createElement('div');
  panel.id = 'jinhe-opening';
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#141510;display:flex;align-items:center;justify-content:center;padding:24px;color:#f4eedf;font:14px system-ui,sans-serif;text-align:center';
  const content = document.createElement('div');
  content.style.cssText = 'max-width:90vw';
  const picture = document.createElement('img');
  picture.src = '../previews/' + id + '.jpg';
  picture.alt = '锦禾 ' + id + ' 号封面预览';
  picture.style.cssText = 'display:block;margin:0 auto 16px;max-width:80vw;max-height:65vh;object-fit:contain;border-radius:5px';
  const title = document.createElement('p');
  title.textContent = '正在打开锦禾 ' + id + ' 号模板…';
  title.style.fontWeight = '600';
  const hint = document.createElement('p');
  hint.textContent = '首次打开需要载入照片和字体，请稍候';
  hint.style.cssText = 'color:#c2bba8;line-height:1.6';
  const link = document.createElement('a');
  link.href = '../';
  link.textContent = '返回锦禾模板库';
  link.style.cssText = 'display:inline-block;margin-top:8px;color:#dec58a';
  content.append(picture, title, hint, link);
  panel.append(content);
  document.body.append(panel);
  const observer = new MutationObserver(() => {
    if (!panel.isConnected && document.body) document.body.append(panel);
  });
  observer.observe(document.documentElement, {childList:true,subtree:true});
  const start = Date.now();
  const tick = setInterval(() => {
    const legacy = window.__jinheLibraryReady;
    if (usesRestore ? legacy?.ok === true : window.__posterTemplateReady === true) {
      clearInterval(tick);
      observer.disconnect();
      panel.remove();
      return;
    }
    const nativeError = document.getElementById('status')?.textContent || '';
    if (legacy?.error || /初始化失败|登录验证失败/.test(nativeError) || Date.now() - start > 120000) {
      clearInterval(tick);
      title.textContent = '这次没有完整打开模板';
      hint.textContent = '请检查网络后重试，已保存的编辑内容会保留。';
      const retry = document.createElement('button');
      retry.textContent = '重新打开';
      retry.style.cssText = 'display:block;margin:16px auto 0;padding:10px 24px;background:#dec58a;color:#17170e;border:0;border-radius:6px;cursor:pointer';
      retry.onclick = () => location.reload();
      content.insertBefore(retry, link);
    }
  }, 100);
})();
