/* 首页预览：静态旧图秒开，小请求增量更新；不修改数据库。 */
const LEGACY_PREVIEWS={"24":[12,"0dcc229f99e92961907f229e7fff74b8e2dd11dbb0ba806c1a4d0cec48be04bf"],"22":[9,"060c630293a38afc32862b9d01374a6fd55102ca495b98131342ea43acccc821"],"13":[1,"546c80faf116afb83ccf21e56c21556690cc36d9fb3edc3cdfbb7a22eff7a777"],"21":[8,"d699112c471d8bb94f174aaa422b17843c534aadb897d8b4d9f4e0bd19a8bee4"],"19":[7,"34b8f1459144b51a1ae36e11b96bbe75df7481e653430f16e5286261382254cc"],"29":[17,"f46e430a9ccca0f25aa5d83316ddb6a97966b43bb34cd89e922969e5767fb7d7"],"15":[3,"f77445ced2b65222d3cc4c8b06ec41ec554d0c2653afc0412b706e055403a3be"],"25":[13,"a4bc00d2b953a9fb1e7e63e26be7097bc4552080ef275a76e335c11d9417bd92"],"31":[19,"976183772e87e3c7b62a8458bd9d43a7f03ce10410ba0421380554c579913580"],"41":[29,"9818d54eff8846a6194973e06116694752f7f22021d3e7eee2308cbfcf8db5b5"],"26":[14,"f7a402c61a5869cd2020cac01fa32da4d806cdcbbb13b1cc5048761c57bcb0c7"],"27":[15,"fb3f192b5bc19f147026af20d097e74c4eefd1789c6732f88fa040b171f3595e"],"28":[16,"5a042e5d85f80b89ffe12c74591710c1a5b87ea4d6cea9cbdb9a9a95c4e2f497"],"17":[5,"357804e28e34b3de747ced7145ce565cd82d946af3a5aed29870bcda7bcca9bc"],"23":[11,"935a18f66d910ab4f9a836899727d0eb950f83603b29dfb8c9024cbf835cb463"],"56":[39,"0d63a8cd6a9524b3b3cd65a73724d378d456bf2bdb3b87ff0f9d5fb4b76d92c8"],"33":[21,"920305d33cf7c292fb33684cb9c9fa67bfbdc4b94fddb591436125cb486b3984"],"57":[40,"4e0cc9c2dd49a637124360c6ccb62a28bad88a80d29b63e0a8ec2baa96a2e854"],"32":[20,"ea7da64f190ea900ce73bfe960c2b85a66e8061c92cf299f52709d422d0053ab"],"34":[22,"dc22ed48977215973d7c5ef0d87dd4fd54c3126a0f1ac6127389d95a069b2258"],"36":[24,"7ebbc0a0c2e42f1ab3cbbde13efb4b23c8de52902e48e0b2b1aebf5f020711e6"],"37":[25,"48322ec666e79188a38bf588bb1c507a0345a77474b8c73310dbdd00b1751c70"],"47":[30,"ceb39ede15f4eedcfb9a2500926beaca474dab10d7d8406663df930b7e7c915a"],"67":[51,"1f85d273897b5661a9fcd3d23fa25542f12a3e8258c21ca180bef54db2812205"],"58":[41,"f8bc2ffdebbd381fc8a0a2bc6706f53c232f0ebf2532d42cee5bbaf94975bdd2"],"59":[42,"0b9a3548a8227062fef35080c6cf1d9c3657310f97b46f779f0373c9151311d2"],"61":[44,"07a88f9ae645c45fb3fa19d52178b24dc9d77be281a34d5be42258b0d72fadba"],"18":[6,"57523b09fef9f22438876b1d8f03fa9f1c9872a92e1079c3e5a3642b14ea0567"],"48":[31,"8f83b93d150c1db7de4abe35d9e24a68fda3d1e3967474c91780089871d40c52"],"38":[26,"e353088761267b317b7b0b6a6fe57be24ad6164e5becfd2b30c789daa385c2ba"],"49":[32,"bfe537e143d5c25b908d8e254136149673039fd1516a0b1f926010bd842a93cc"],"62":[45,"c611593b1e1e07572037f713e5f0558d705ca696619729415593a76b206fc0fc"],"69":[53,"e71474efc36fec52d903bd01fdd4232ecceca03a757f6be222a1e85b98ebd483"],"70":[54,"a503b97356294e184ae4eb371ed345033b467e4fbecf17bd15c128fec3cb00b6"],"71":[55,"d8fa77bd9dcc3e40fda9a1b86333fdad3da664d8fd365c669cc1c718ceae45a6"],"72":[56,"d60211beb272344bf7e34c9d6d90b153ac48473cf4f8368e217f07a42bd56b93"],"73":[57,"fe088a0e7127a1572d2acadb10cf3c02bd9ffb545893e1eb5b0b5313737e7d4e"],"52":[35,"529288ac9f4a6116467fa1d9a4128bc1dbe62ad8eb99fb2cb6898b89f4de8436"],"53":[36,"9e2f7c57efcacba4a7cfcd61a7f540ec3ecce94efb8b6507d48e0c51f4ace5c6"],"54":[37,"e63f9ea8b571a878bef0069b66141d8c481894640f5a16b4c45a0f03bed73309"],"14":[2,"b2d473f030cbef4e092b04eaa93a1172327c1c42147c9bb1636ce313d76d2a62"],"30":[18,"fee6fcbe6662ddab4203a6b93432cbde1cfd6573a8e726fe9b3bf36aa7b0cda7"],"35":[23,"996a80bf54cb29cf500746437cd0190e48fbd38321d3df2ab32b0e768453e382"],"40":[28,"b5599cb6bf30c69a67b854b2bdc1d8cb02f1d74f74131b25f2684d98cdd39daf"],"63":[46,"15a965d0b8339270c08a80a974c8760f65972d283efe79383c59afb20f39860c"],"64":[47,"e3f09fd82af920207b2846b3661009b58fc5a9ef479f24890afc9947954f9f13"],"65":[48,"9054b90259ef65ab2a12e8c8bb33906aeb1be2d8fa651272e491c689c77ac4db"],"66":[50,"d091934d842558eb521e685cee2272d8a0537b2346f5b2f5d2fb54ce6dcfcdb3"],"20":[10,"05a81036b3033c555580a70ec66434ad8e2a4d2552e0ad8f27ff7566757105d0"],"51":[34,"152862e9e392804aedea57fbc63b47b3e72e84d8f69f237b20b57464a0178584"],"16":[4,"f153062248f20f7195519c4750d6b57291b5815bed48363278e890dd9e78080f"],"55":[38,"55a5c3ca826ae328c7d08c302acacef4cf1e34cf37076d5ba749ad606eb1c8cd"],"68":[52,"86383091e06f9d0a5d0c9f294416f7df3b67b887d61b065b2e536e5cb491d12e"],"74":[58,"37252a21809a4a684b2d664166bc289764f5382ab1143c5c55ad847817764f0f"],"75":[59,"b7ab27072b9c9d724207a7ff1c7c9e1aeed767223bfc090c557f470ebf5f330f"],"77":[62,"22f3e5f7c107fd05634d7da875ed871da8b1a3753395c556d1bd2f9abaf7e17d"],"60":[43,"3808df58375da3b8064258c397f7ec742779dd2f2b51104d2aedc2f810a55b49"]};
const PREVIEW_DB='wp-template-preview-v1', PREVIEW_STORE='images';
const LEGACY_CHECK_KEY='wp_tpl_legacy_checked_v1', LEGACY_CHECK_INTERVAL=6*60*60*1000;
let catalogRows=[], imageById=new Map(), imageGenerations=new Map();
const rowId=t=>String(t.id);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function previewFallback(t){
  const known=LEGACY_PREVIEWS[rowId(t)];
  if(!known)return '';
  const match=String(t.url||'').match(/(?:^|\/)(\d+)\.html(?:[?#].*)?$/);
  return match&&Number(match[1])===known[0]?'previews/legacy-'+known[0]+'.jpg':'';
}
function openPreviewDB(){return new Promise(resolve=>{
  let settled=false,timer=null;
  const finish=value=>{if(settled){if(value)value.close();return;}settled=true;clearTimeout(timer);resolve(value);};
  try{
    timer=setTimeout(()=>finish(null),2000);
    const req=indexedDB.open(PREVIEW_DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(PREVIEW_STORE))req.result.createObjectStore(PREVIEW_STORE,{keyPath:'id'});};
    req.onsuccess=()=>finish(req.result);req.onerror=()=>finish(null);req.onblocked=()=>finish(null);
  }catch(e){finish(null);}
});}
async function readStoredPreviews(){
  const db=await openPreviewDB();if(!db)return [];
  return await new Promise(resolve=>{try{const tx=db.transaction(PREVIEW_STORE,'readonly');const r=tx.objectStore(PREVIEW_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>resolve([]);tx.oncomplete=()=>db.close();}catch(e){db.close();resolve([]);}});
}
async function writeStoredPreviews(items){
  if(!items.length)return true;
  const db=await openPreviewDB();if(!db)return false;
  return await new Promise(resolve=>{try{const tx=db.transaction(PREVIEW_STORE,'readwrite');for(const item of items)tx.objectStore(PREVIEW_STORE).put(item);tx.oncomplete=()=>{db.close();resolve(true);};tx.onerror=tx.onabort=()=>{db.close();resolve(false);};}catch(e){db.close();resolve(false);}});
}
function safeImage(src){
  if(typeof src!=='string'||!src)return '';
  if(/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(src))return src;
  try{const u=new URL(src,location.href);return /^(?:https?:|file:)$/.test(u.protocol)?src:'';}catch(e){return '';}
}
function installImage(card,t,src){
  const frame=card.querySelector('.tpl-preview');if(!frame)return;
  const id=rowId(t), safe=safeImage(src), version=(imageGenerations.get(id)||0)+1;imageGenerations.set(id,version);
  frame.textContent='';
  if(!safe){const hint=document.createElement('span');hint.className='tpl-preview-hint';hint.textContent='暂无预览';frame.appendChild(hint);return;}
  const image=document.createElement('img');image.loading='lazy';image.decoding='async';image.alt=t.name||'模板预览';
  let tried=false;
  image.addEventListener('error',()=>{
    if(imageGenerations.get(id)!==version)return;
    if(!tried){tried=true;setTimeout(()=>{if(imageGenerations.get(id)===version){
      let retry=safe;try{const u=new URL(safe,location.href);if(u.protocol!=='data:'&&u.hostname==='1589896915x-cell.github.io'){u.searchParams.set('_retry',String(Date.now()));retry=u.href;}}catch(e){}
      image.src=retry;
    }},1000);return;}
    frame.textContent='';const hint=document.createElement('span');hint.className='tpl-preview-hint';hint.textContent='预览暂时无法加载';frame.appendChild(hint);
  });
  image.src=safe;frame.appendChild(image);
}
function showImage(id,src,opts={}){
  id=String(id);const row=catalogRows.find(t=>rowId(t)===id);if(!row)return;
  const safe=safeImage(src);const old=imageById.get(id)||'';
  if(opts.onlyIfEmpty&&old)return;
  if(old===safe&&document.querySelector('.tpl-card[data-template-id="'+CSS.escape(id)+'"] .tpl-preview img'))return;
  imageById.set(id,safe);
  const card=document.querySelector('.tpl-card[data-template-id="'+CSS.escape(id)+'"]');if(card)installImage(card,row,safe);
}
function rowSignature(rows){return JSON.stringify((rows||[]).map(t=>[rowId(t),t.name,t.url,t.description,t.tag]));}
function renderTemplates(rows){
  const grid=document.getElementById('tpl-grid');const same=catalogRows.length>0&&rowSignature(catalogRows)===rowSignature(rows);catalogRows=rows||[];
  if(same)return;
  if(!catalogRows.length){grid.innerHTML='<div style="color:#888;font-size:12px;">暂无模板</div>';return;}
  grid.innerHTML=catalogRows.map(t=>`<a class="tpl-card" data-template-id="${esc(rowId(t))}" href="${esc(t.url||'#')}">
    <div class="tpl-preview"></div><div class="tpl-info"><div class="tpl-name">${esc(t.name)}</div>
    <div class="tpl-desc">${esc(t.description||'')}</div>${t.tag?`<div class="tpl-tag">${esc(t.tag)}</div>`:''}</div></a>`).join('');
  for(const row of catalogRows){const id=rowId(row);const card=document.querySelector('.tpl-card[data-template-id="'+CSS.escape(id)+'"]');installImage(card,row,imageById.get(id)||'');}
}
function saveCatalog(){
  try{const data=catalogRows.map(t=>{const src=imageById.get(rowId(t))||'';return {...t,img:src&&!src.startsWith('data:')?src:undefined};});localStorage.setItem('wp_tpl_cache',JSON.stringify({ts:Date.now(),data}));}catch(e){}
}
async function queryCatalog(query,signal,timeoutMs=10000){
  const controller=new AbortController();const abort=()=>controller.abort();
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{const r=await fetch(SB_URL+'/rest/v1/templates?'+query,{...SB_HDR,signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}
  catch(e){if(controller.signal.aborted&&!signal?.aborted)throw Error('请求超时');throw e;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
async function queryWithRetry(query,signal,timeoutMs){try{return await queryCatalog(query,signal,timeoutMs);}catch(e){if(e.name==='AbortError'||signal?.aborted)throw e;return await queryCatalog(query,signal,timeoutMs);}}
async function sha256DataURI(src){
  if(!globalThis.crypto?.subtle)return '';
  const bytes=Uint8Array.from(atob(src.slice(src.indexOf(',')+1)),c=>c.charCodeAt(0));
  const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
async function refreshLegacyInBackground(signal){
  const stored=await readStoredPreviews();
  const cachedInline=new Set(stored.filter(s=>(s.src||'').startsWith('data:image/')).map(s=>String(s.id)));
  const ids=catalogRows.filter(t=>previewFallback(t)||cachedInline.has(rowId(t))).map(rowId).filter(x=>/^\d+$/.test(x));if(!ids.length)return;
  let last=0;try{last=Number(localStorage.getItem(LEGACY_CHECK_KEY)||0);}catch(e){}
  if(Date.now()-last<LEGACY_CHECK_INTERVAL)return;
  try{
    const rows=await queryWithRetry('is_active=eq.true&id=in.('+ids.join(',')+')&select=id,img',signal,30000);if(signal?.aborted)return;const changes=[];
    for(const row of rows){if(signal?.aborted)return;const id=String(row.id),value=row.img||'',known=LEGACY_PREVIEWS[id];
      if(value.startsWith('data:image/')){
        const digest=await sha256DataURI(value);if(digest&&digest===known?.[1]){changes.push({id,src:'',sameAsStatic:true});const row=catalogRows.find(t=>rowId(t)===id);if(row)showImage(id,previewFallback(row));continue;}
        changes.push({id,src:value});showImage(id,value);
      }else if(value){changes.push({id,src:value});showImage(id,value);}
      else {changes.push({id,src:'',empty:true});showImage(id,'');}
    }
    if(await writeStoredPreviews(changes)){try{localStorage.setItem(LEGACY_CHECK_KEY,String(Date.now()));}catch(e){}}
    saveCatalog();
  }catch(e){/* 现有缓存和静态图继续显示，下次再验证。 */}
}
function scheduleLegacyVerification(){
  let timer=null,controller=null,done=false;
  const cleanup=()=>{done=true;clearTimeout(timer);window.removeEventListener('scroll',reset);document.removeEventListener('visibilitychange',reset);};
  const reset=()=>{
    clearTimeout(timer);if(controller){controller.abort();controller=null;}
    if(done||document.visibilityState==='hidden')return;
    timer=setTimeout(async()=>{
      const active=new AbortController();controller=active;
      try{await refreshLegacyInBackground(active.signal);}finally{if(controller===active){controller=null;cleanup();}}
    },60000);
  };
  window.addEventListener('scroll',reset,{passive:true});document.addEventListener('visibilitychange',reset);reset();
}
async function loadTemplates(){
  let hadCache=false, cached=[];
  try{const parsed=JSON.parse(localStorage.getItem('wp_tpl_cache')||'null');if(Array.isArray(parsed?.data))cached=parsed.data;}catch(e){}
  if(cached.length){
    for(const t of cached){const src=safeImage(t.img)||previewFallback(t);if(src)imageById.set(rowId(t),src);}
    renderTemplates(cached);hadCache=true;
  }else showSkeletons();
  // 图片 URL 请求与轻量列表并行；旧版内嵌图不进入首屏请求。
  const urlPromise=queryWithRetry('is_active=eq.true&img=not.like.data:*&select=id,img').catch(()=>null);
  const storedPromise=readStoredPreviews();
  try{
    const fresh=await queryWithRetry('is_active=eq.true&order=sort_order.asc&select=id,name,url,description,tag,sort_order');
    if(!Array.isArray(fresh))throw Error('invalid list');
    const active=new Set(fresh.map(rowId));for(const id of imageById.keys())if(!active.has(id))imageById.delete(id);
    for(const t of fresh){const id=rowId(t);if(!imageById.get(id)){const src=previewFallback(t);if(src)imageById.set(id,src);}}
    renderTemplates(fresh);saveCatalog();
  }catch(e){if(!hadCache){document.getElementById('tpl-grid').innerHTML='<div style="color:#e05a5a;font-size:12px;">模板加载失败，请刷新重试</div>';return;}}
  const stored=await storedPromise;
  for(const item of stored){if(item.sameAsStatic){const row=catalogRows.find(t=>rowId(t)===String(item.id));if(row)showImage(item.id,previewFallback(row));}else showImage(item.id,item.src||'');}
  const remote=await urlPromise;
  if(Array.isArray(remote))for(const item of remote)if(item.img)showImage(item.id,item.img);
  // 未登记的新模板仅按缺失 id 批量读取 img：URL、内嵌图片和 null 均适用。
  const remoteIds=new Set(Array.isArray(remote)?remote.map(x=>String(x.id)):[]);
  const storedInline=new Set(stored.filter(s=>(s.src||'').startsWith('data:image/')).map(s=>String(s.id)));
  const missing=catalogRows.filter(t=>{
    const id=rowId(t),has=imageById.get(id),known=previewFallback(t);
    if(known||remoteIds.has(id))return false;
    // URL 查询成功且此 id 不在结果中：可能已改为内嵌图或移除图片。
    if(Array.isArray(remote))return !storedInline.has(id);
    return !has;
  }).map(rowId).filter(x=>/^\d+$/.test(x));
  if(missing.length){
    try{const rows=await queryWithRetry('is_active=eq.true&id=in.('+missing.join(',')+')&select=id,img');const toStore=[];
      for(const item of rows){if(item.img){showImage(item.id,item.img);if(item.img.startsWith('data:image/'))toStore.push({id:String(item.id),src:item.img});}else{showImage(item.id,'');toStore.push({id:String(item.id),src:'',empty:true});}}
      await writeStoredPreviews(toStore);
    }catch(e){}
  }
  saveCatalog();
  // 仅在页面可见且连续 60 秒没有滚动时低频复核；滚动或隐藏时取消请求。
  scheduleLegacyVerification();
}
