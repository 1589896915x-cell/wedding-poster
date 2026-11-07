/* Load saved presets into the existing native editors. No renderer or auth replacement. */
(() => {
  'use strict';
  const presetId = new URL(location.href).searchParams.get('preset');
  if (!presetId) return; // Ordinary 18/22/118 URLs keep their existing behavior.
  const script = document.currentScript;
  const baseURL = new URL('.', script.src);
  const version = new URL(script.src).searchParams.get('v') || '20261107-collages-v1';
  const templateId = Number(location.pathname.match(/\/(18|22|118)\.html$/)?.[1]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const paint = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  let panel;
  let nativeReady = false;

  function message(text, failed = false) {
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'jinhe-preset-opening';
      panel.setAttribute('role', 'status');
      panel.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:grid;place-content:center;gap:16px;text-align:center;background:#171717;color:#fff;font:16px/1.6 sans-serif;';
      document.body.append(panel);
    }
    panel.replaceChildren(document.createTextNode(text));
    if (failed) {
      const retry = document.createElement('button');
      retry.textContent = '重新载入';
      retry.onclick = () => location.reload();
      panel.append(retry);
    }
  }

  function sameOriginURL(path, relativeTo) {
    const url = new URL(path, relativeTo);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) throw Error('预置素材地址无效');
    return url;
  }

  async function fetchRead(url, kind, cache = kind === 'json' ? 'no-cache' : 'force-cache') {
    if (!['json', 'blob'].includes(kind)) throw Error('预置读取类型无效');
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(url, { cache, credentials: 'same-origin', signal: controller.signal });
        if (!response.ok) {
          const failure = Error('预置文件读取失败：' + response.status);
          failure.retryable = response.status >= 500;
          throw failure;
        }
        // Keep the timer alive until the complete body is read, not just the headers.
        return await response[kind]();
      } catch (error) {
        const retryable = error.retryable === true || error.name === 'AbortError' || error instanceof TypeError;
        if (attempt || !retryable) throw error;
      } finally { clearTimeout(timer); }
    }
  }

  async function decodeImage(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (!img.naturalWidth || !img.naturalHeight) throw Error('预置照片无法解码');
    } finally { URL.revokeObjectURL(url); }
  }

  async function fetchAssets(seed, seedURL) {
    if (!Array.isArray(seed.assets)) throw Error('预置素材清单缺失');
    const seen = new Set();
    for (const item of seed.assets) {
      if (!item || !['image', 'font'].includes(item.kind) || typeof item.slot !== 'string' || seen.has(item.slot)) throw Error('预置素材槽位无效');
      if (!/^[a-f0-9]{64}$/.test(item.sha256 || '')) throw Error('预置素材校验值缺失');
      seen.add(item.slot);
    }
    return new Map(await Promise.all(seed.assets.map(async item => {
      const blob = await fetchRead(sameOriginURL(item.src, seedURL), 'blob');
      if (!blob.size) throw Error('预置素材为空');
      const bytes = await blob.arrayBuffer();
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
      if (hash !== item.sha256) throw Error('预置素材校验不匹配');
      if (item.kind === 'image') await decodeImage(blob);
      return [item.slot, blob];
    })));
  }

  async function waitNative() {
    const started = Date.now();
    for (;;) {
      // Both native init() functions populate _state and #pname only after wpCheckAuth succeeds.
      // No auth function, card key, quota, or native init behavior is replaced here.
      try {
        if (_db && _state?.id && document.getElementById('pname')?.value === _state.name && document.querySelector('#cv')?.childElementCount) return;
      } catch (_) { /* Native lexical globals may not be initialized yet. */ }
      if (Date.now() - started > 60000) throw Error('原编辑器尚未完成登录或初始化；请完成登录后重新打开卡片');
      await pause(60);
    }
  }

  function legacyAdapter() {
    const signature = () => JSON.stringify({ ..._state, updatedAt: undefined });
    let baseline = null;
    // Native renderAll schedules an async render through RAF. Serializing those
    // same native calls prevents interleaved DOM appends; no layout is recreated.
    const nativeRenderPreview = renderPreview;
    let renderTail = Promise.resolve();
    renderPreview = function (...args) {
      const next = renderTail.catch(() => {}).then(() => nativeRenderPreview.apply(this, args));
      renderTail = next;
      next.catch(() => {}); // Native RAF callers do not await their render.
      return next;
    };
    async function settleNativeRender() {
      await paint(); // Let native scheduleRender enqueue its work first.
      await renderTail;
      await paint();
    }
    async function persistCurrent() {
      if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
      if (_state?.id && signature() !== baseline) {
        await saveProjectNow();
        await dbGet('projects', _state.id); // Read transaction queues after the native write commits.
        baseline = signature();
      }
    }
    return {
      ready: async () => { await waitNative(); if (baseline === null) baseline = signature(); },
      currentId: () => _state?.id || null,
      read: id => dbGet('projects', id),
      async load(id) {
        await persistCurrent();
        await loadAllProjects();
        if (!_projects.some(project => project.id === id)) return false;
        await loadProject(id);
        baseline = signature();
        return true;
      },
      async create({ id, seed, assets }) {
        await persistCurrent();
        const state = migrateState(clone(seed.project));
        state.id = id;
        state.createdAt = state.updatedAt = Date.now();
        state.name = seed.project.name;
        const slots = seed.assets.filter(item => item.kind === 'image').map(item => item.slot);
        if (!slots.includes('topImg') || !slots.includes('botImg') || seed.assets.some(item => item.kind !== 'image' || !['topImg', 'botImg', 'logoImg'].includes(item.slot))) throw Error('原模板需要完整上下两张照片');
        for (const key of ['topImg', 'botImg', 'logoImg']) if (key in state) state[key] = '';
        for (const slot of slots) state[slot] = id + ':image:' + slot;
        let created = true;
        try {
          await new Promise((resolve, reject) => {
            const tx = _db.transaction(['projects', 'imgs'], 'readwrite');
            // add(), never put(): an existing edited project cannot be overwritten, even across tabs.
            tx.objectStore('projects').add(state);
            for (const slot of slots) tx.objectStore('imgs').put(assets.get(slot), state[slot]);
            tx.oncomplete = resolve;
            tx.onerror = tx.onabort = () => reject(tx.error || Error('预置项目保存失败'));
          });
        } catch (error) {
          if (error.name !== 'ConstraintError' || !await dbGet('projects', id)) throw error;
          created = false;
        }
        if (!await this.load(id)) throw Error('已保存的预置项目无法打开');
        return { id, created };
      },
      async verify() {
        await settleNativeRender();
        await document.fonts.ready;
        const images = [...document.querySelectorAll('#cv .half-wrap img')];
        await Promise.all(images.map(image => image.decode()));
        await paint();
        const imageCount = images.filter(image => image.complete && image.naturalWidth > 0).length;
        const fields = templateId === 18 ? [['title', 'data-role', 'title'], ['subtitle', 'data-role', 'subtitle']] : [['cnTitle', 'data-k', 'cnTitle'], ['enLine1', 'data-k', 'enLine1'], ['enLine2', 'data-k', 'enLine2']];
        const textCounts = Object.fromEntries(fields.map(([field, attr, value]) => [field, document.querySelectorAll('#cv [' + attr + '="' + value + '"]').length]));
        const textsUnique = fields.every(([field]) => textCounts[field] === (_state[field] ? 1 : 0));
        const halvesUnique = ['top', 'bot'].every(which => document.querySelectorAll('#cv .half-wrap[data-which="' + which + '"]').length === 1);
        return { ok: Boolean(_state.topImg && _state.botImg && imageCount === 2 && images.length === 2 && halvesUnique && textsUnique), projectId: _state.id, imageCount, textCounts, halvesUnique };
      }
    };
  }

  async function activatePreset(entry, adapter, resources) {
    await adapter.ready();
    const existing = await adapter.read(entry.projectId);
    if (existing) {
      if (!await adapter.load(entry.projectId)) throw Error('已保存的拼图无法打开');
      let report;
      try { report = await adapter.verify(); } catch (error) { report = { ok: false, warning: error.message }; }
      // A user may intentionally clear a photo or edit beyond the original text bounds.
      // Keep the editor accessible and never reset that project from a seed.
      return { ok: true, reused: true, projectId: entry.projectId, report };
    }
    const seed = await resources.seed(entry);
    if (seed.schemaVersion !== 1 || seed.presetId !== entry.id || Number(seed.templateId) !== Number(entry.templateId) || !seed.project || typeof seed.project.name !== 'string') throw Error('拼图预置数据与卡片不匹配');
    const assets = await resources.assets(seed, entry);
    const result = await adapter.create({ id: entry.projectId, seed, assets });
    let report;
    try { report = await adapter.verify(); }
    catch (error) {
      if (result.created !== false) throw error;
      report = { ok: false, warning: error.message };
    }
    if (result.created !== false && report.ok === false) throw Error('拼图保存后未通过实际渲染检查');
    return { ok: true, reused: result.created === false, projectId: entry.projectId, report };
  }

  async function start() {
    if (!/^jinhe-collage-(18|22|118)-[a-z0-9-]+$/.test(presetId) || ![18, 22, 118].includes(templateId) || !presetId.startsWith('jinhe-collage-' + templateId + '-')) throw Error('拼图入口无效');
    window.__jinhePresetReady = { ok: false, presetId, templateId };
    const manifestURL = new URL('manifest.json?v=' + encodeURIComponent(version), baseURL);
    const adapter = templateId === 118 ? window.JinhePresetAdapters?.[118] : legacyAdapter();
    if (!adapter) throw Error('原编辑器尚未接入完整项目载入接口');
    // Do not cover the native login or card-input UI while authentication is pending.
    await adapter.ready();
    nativeReady = true;
    message('正在载入可编辑拼图…');
    let seedURL;
    // Stable project IDs let an existing local draft open without any preset network requests.
    const result = await activatePreset({ id: presetId, projectId: presetId, templateId }, adapter, {
      seed: async () => {
        const manifest = await fetchRead(manifestURL, 'json');
        const entry = manifest.presets?.find(item => item.id === presetId);
        if (!entry || !entry.enabled || entry.templateId !== templateId || entry.projectId !== entry.id) throw Error('这张拼图尚未准备好');
        seedURL = sameOriginURL(entry.seed, manifestURL);
        return fetchRead(seedURL, 'json');
      },
      assets: seed => fetchAssets(seed, seedURL)
    });
    window.__jinhePresetReady = { ...result, presetId, templateId };
    panel?.remove();
    window.dispatchEvent(new CustomEvent('jinhe-preset-ready', { detail: window.__jinhePresetReady }));
  }

  start().catch(error => {
    window.__jinhePresetReady = { ok: false, presetId, templateId, error: error.message };
    console.error('[jinhe-preset]', error);
    if (nativeReady) message('这张拼图未能载入，请重新载入。', true);
  });
})();
