(() => {
  'use strict';
  const script = document.currentScript;
  const id = script.dataset.template;
  const base = new URL('./', script.src);
  const usesRestore = [1,4,5,10,12,16,17,19,25,62,68].includes(Number(id));
  let finished = false, tick = null, slowTimer = null, previewTimer = null;
  const previewController = new AbortController();
  const panel = document.createElement('div');
  panel.id = 'jinhe-opening';
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#141510;display:flex;align-items:center;justify-content:center;padding:24px;color:#f4eedf;font:14px system-ui,sans-serif;text-align:center';
  const content = document.createElement('div');
  content.style.cssText = 'max-width:90vw';
  const picture = document.createElement('img');
  picture.hidden = true;
  picture.alt = '锦禾 ' + id + ' 号封面预览';
  picture.style.cssText = 'display:none;margin:0 auto 16px;max-width:80vw;max-height:65vh;object-fit:contain;border-radius:5px';
  const title = document.createElement('p');
  title.textContent = '正在打开锦禾 ' + id + ' 号模板…';
  title.style.fontWeight = '600';
  const hint = document.createElement('p');
  hint.textContent = '首次打开需要载入照片和字体，请稍候';
  hint.style.cssText = 'color:#c2bba8;line-height:1.6';
  const link = document.createElement('a');
  link.href = new URL('../../index.html#tpl-grid', base).href;
  link.textContent = '返回模板库';
  link.style.cssText = 'display:inline-block;margin-top:8px;color:#dec58a';
  content.append(picture, title, hint, link);
  panel.append(content);
  document.body.append(panel);
  const observer = new MutationObserver(() => {
    if (!finished && !panel.isConnected && document.body) document.body.append(panel);
  });
  observer.observe(document.documentElement, {childList:true,subtree:true});
  function cleanup() {
    finished = true;
    clearInterval(tick);
    clearTimeout(slowTimer);
    clearTimeout(previewTimer);
    previewController.abort();
    observer.disconnect();
    picture.onload = picture.onerror = null;
  }
  let retry = null;
  function offerRetry() {
    if (retry) return;
    retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = '重新打开';
    retry.style.cssText = 'display:block;margin:16px auto 0;padding:10px 24px;background:#dec58a;color:#17170e;border:0;border-radius:6px;cursor:pointer';
    retry.onclick = () => location.reload();
    content.insertBefore(retry, link);
  }
  function checkReady() {
    if (finished) return;
    const legacy = window.__jinheLibraryReady;
    if (usesRestore ? legacy?.ok === true : window.__posterTemplateReady === true) {
      cleanup();
      panel.remove();
      return;
    }
    const nativeError = document.getElementById('status')?.textContent || '';
    if (window.__jinheAuthError || legacy?.error || /初始化失败|登录验证失败/.test(nativeError)) {
      cleanup();
      title.textContent = '这次没有完整打开模板';
      hint.textContent = window.__jinheAuthError || '请检查网络后重试，已保存的编辑内容会保留。';
      offerRetry();
    }
  }
  tick = setInterval(checkReady, 150);
  slowTimer = setTimeout(() => {
    checkReady();
    if (finished) return;
    hint.textContent = '加载时间较长，可以继续等待或重新打开。已保存的编辑内容会保留。';
    offerRetry();
  }, 15000);
  // The manifest supplies content-hashed thumbnails. Never load a full preview here.
  previewTimer = setTimeout(() => previewController.abort(), 5000);
  fetch(new URL('manifest.json', base).href, {signal:previewController.signal})
    .then(response => {if (!response.ok) throw new Error('PREVIEW_MANIFEST');return response.json();})
    .then(manifest => {
      if (finished) return;
      const item = manifest.templates?.find(item => String(item.id) === String(id));
      if (!item?.thumbnail) return;
      const source = new URL(item.thumbnail, base);
      if (source.origin !== base.origin || !source.pathname.startsWith(base.pathname + 'thumbs/')) return;
      picture.onload = () => {if (!finished) {picture.hidden = false;picture.style.display = 'block';}};
      picture.onerror = () => {picture.hidden = true;picture.style.display = 'none';};
      picture.src = source.href;
    })
    .catch(() => {})
    .finally(() => clearTimeout(previewTimer));
  checkReady();
})();
