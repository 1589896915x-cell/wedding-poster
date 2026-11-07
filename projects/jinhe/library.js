(()=>{
  'use strict';
  const data=JSON.parse(document.getElementById('library-data').textContent);
  const templates=data.templates;
  const el=id=>document.getElementById(id);
  // Card thumbnails are separate from the full-size comparison previews.
  const loadThumbnail=image=>{
    if(!image?.dataset.src)return;
    image.src=image.dataset.src;
    delete image.dataset.src;
  };
  const deferredImages=[...document.querySelectorAll('.template-card img[data-src]')];
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){loadThumbnail(entry.target);observer.unobserve(entry.target);}
    },{rootMargin:'160px 0px'});
    deferredImages.forEach(image=>observer.observe(image));
  }else deferredImages.forEach(loadThumbnail);
  const tabs=[...document.querySelectorAll('[data-channel]')];
  function setChannel(name,updateHash=true){
    name=name==='notes'?'notes':'templates';
    for(const tab of tabs){const selected=tab.dataset.channel===name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
    el('templates-panel').hidden=name!=='templates';el('notes-panel').hidden=name!=='notes';
    if(updateHash)history.replaceState(null,'','#'+name);
  }
  for(const tab of tabs){
    tab.addEventListener('click',()=>setChannel(tab.dataset.channel));
    tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs[tabs.length-1]:tabs[(tabs.indexOf(tab)+1)%tabs.length];setChannel(next.dataset.channel);next.focus();});
  }
  window.addEventListener('hashchange',()=>setChannel(location.hash.slice(1),false));
  setChannel(location.hash.slice(1),false);
  const cards=[...document.querySelectorAll('[data-template-id]')];
  el('template-search').addEventListener('input',event=>{
    const query=event.target.value.trim().replace(/^模板\s*/,'');let count=0;
    for(const card of cards){const show=!query||card.dataset.templateId===query;card.hidden=!show;if(show){count++;if(query)loadThumbnail(card.querySelector('img'));}}
    el('result-count').textContent=query?'找到 '+count+' 款模板':'共 22 款 · 本轮修订版 · 待审阅';
    el('empty-state').hidden=count>0;
  });
  const dialog=el('compare-dialog');let activeIndex=0,mode='compare',imageVersion=0;
  function showItem(index){
    activeIndex=(index+templates.length)%templates.length;const item=templates[activeIndex];
    el('dialog-title').textContent='模板 '+item.id+(mode==='compare'?' · 原图对照':' · 锦禾封面');
    el('dialog-count').textContent=(activeIndex+1)+' / '+templates.length;
    const version=++imageVersion;
    const reference=el('dialog-reference'),preview=el('dialog-preview');
    if(mode==='compare')reference.src=item.reference;
    else reference.removeAttribute('src');
    reference.alt='模板 '+item.id+' 参考原图';
    preview.src=item.thumbnail||item.preview;
    preview.alt='锦禾模板 '+item.id+' 当前版本';
    if(item.thumbnail){
      const fullImage=new Image();
      fullImage.onload=()=>{if(version===imageVersion&&dialog.open)preview.src=item.preview;};
      fullImage.src=item.preview;
    }
    el('dialog-reference-link').href=item.reference;el('dialog-preview-link').href=item.preview;el('dialog-edit').href=item.editor;
    dialog.scrollTop=0;
  }
  function openItem(id,nextMode){
    mode=nextMode;dialog.dataset.mode=mode;const index=templates.findIndex(item=>String(item.id)===String(id));if(index<0)return;
    showItem(index);if(!dialog.open)dialog.showModal();document.body.classList.add('dialog-open');
  }
  document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>openItem(button.dataset.preview,'preview')));
  document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>openItem(button.dataset.compare,'compare')));
  el('dialog-previous').addEventListener('click',()=>showItem(activeIndex-1));el('dialog-next').addEventListener('click',()=>showItem(activeIndex+1));
  el('dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{imageVersion++;document.body.classList.remove('dialog-open');el('dialog-reference').removeAttribute('src');el('dialog-preview').removeAttribute('src');});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('keydown',event=>{if(event.ctrlKey||event.altKey||event.metaKey)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showItem(activeIndex+(event.key==='ArrowRight'?1:-1));}});
})();
