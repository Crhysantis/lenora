(async function startLenora(){
'use strict';
const C=globalThis.LenoraCore, $=s=>document.querySelector(s), esc=C.escapeHTML;
let backing;try{backing=localStorage;}catch{backing={getItem(){throw Error();},setItem(){throw Error();}};}
const storage=C.createStorage(backing);
let mediaBackend;try{mediaBackend=window.indexedDB;}catch{}
const mediaStore=globalThis.LenoraMedia.createMediaStore(mediaBackend);
let mediaBusy=false,mediaLoadFailed=false;
let draft=C.validateDraft(storage.get('draft',C.DEFAULT_DRAFT)).draft||{...C.DEFAULT_DRAFT};
let prefs=C.normalizePrefs(storage.get('prefs',C.DEFAULT_PREFS));
let saved=Boolean(storage.get('library',false)),page=Math.max(0,Number(storage.get('progress',0))||0);
let routeName='',lastAuthorHash='',dirty=false,observer=null,readerEpoch=0,dwellTimers=new Set(),toastTimer,hoverTimer;
let enabled=false,audioContext=null,track=null,zone=-1,voices=new Set(),effects=new Set(),media={};
const sceneSeen=new Set(),effectSeen=new Set();
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function save(key,value){const ok=storage.set(key,value);if(!ok)toast('Sem acesso ao armazenamento: alterações apenas nesta sessão.');return ok;}
function showModal(title,html){$('#modalBody').innerHTML='<h2 id="modalTitle">'+esc(title)+'</h2>'+html;$('#modal').showModal();}
const worldExperience=globalThis.createWorldExperience({storage,toast,showModal,esc,getAsset:key=>media[key],putAsset:async(key,file)=>{
  await mediaStore.put(key,file);media[key]={url:URL.createObjectURL(file),type:file.type,name:file.name};
}});
$('#closeModal').onclick=()=>$('#modal').close();
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close();});
function stopTrack(fade=false){
  if(!track)return;
  const old=track;track=null;zone=-1;
  if(old.media){old.media.pause();return;}
  const t=audioContext.currentTime;
  old.gain.gain.cancelScheduledValues(t);
  if(fade){old.gain.gain.setTargetAtTime(0,t,.15);for(const o of old.nodes){try{o.stop(t+.65);}catch{}}}
  else for(const o of old.nodes){try{o.stop();}catch{}}
}
function stopAll(){
  stopTrack();
  for(const o of voices){try{o.stop();}catch{}}voices.clear();
  for(const a of effects)a.pause();effects.clear();
  const v=$('#sceneVideo');if(v)v.pause();
}
async function toggleAudio(){
  if(enabled){enabled=false;stopAll();}
  else{
    try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();await audioContext.resume();enabled=true;updateTrack();}
    catch{toast('Áudio indisponível neste navegador.');}
  }
  if($('#audioToggle'))$('#audioToggle').textContent=enabled?'♫ Desativar áudio':'♫ Ativar áudio';
  if($('#sceneVideo'))$('#sceneVideo').muted=!enabled;
}
function updateTrack(){
  if(!enabled||!prefs.track||prefs.plain||routeName!=='reader'){stopTrack();return;}
  const next=page>=draft.trackBlock-1?1:0;
  if(track&&zone===next)return;
  stopTrack(true);zone=next;
  if(media.track){
    const a=new Audio(media.track.url);a.loop=true;a.volume=.22;track={media:a};
    a.play().catch(()=>toast('Não foi possível reproduzir a trilha enviada.'));return;
  }
  const g=audioContext.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(.022,audioContext.currentTime+1);g.connect(audioContext.destination);
  const nodes=(next?[146.83,220,293.66]:[130.81,196,261.63]).map(f=>{
    const o=audioContext.createOscillator();o.type='sine';o.frequency.value=f;o.connect(g);
    o.onended=()=>{voices.delete(o);o.disconnect();};voices.add(o);o.start();return o;
  });
  track={gain:g,nodes};
}
function playEffect(){
  if(!enabled||prefs.plain||prefs.effects==='off'){if(!enabled)toast('Ative o áudio para ouvir a passagem.');return;}
  if(media.effect){
    const a=new Audio(media.effect.url);effects.add(a);a.onended=()=>effects.delete(a);
    a.play().catch(()=>{effects.delete(a);toast('Formato de áudio não suportado.');});return;
  }
  [0,.45,.9].forEach(delay=>{
    const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+delay;
    o.frequency.value=587.33;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+1.1);
    o.connect(g);g.connect(audioContext.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+1.2);
  });
}
function topbar(){return '<div class="topbar"><span class="section-label">LENORA / PRIMEIRA EDIÇÃO</span><span class="muted">Histórias para ler, ouvir e sentir.</span><span class="avatar">L</span></div>';}
function bookCard(){return `<article class="card"><a href="#reader"><div class="cover art"><small>LENORA ORIGINALS</small><span class="cover-title">${esc(draft.title)}</span><small>FANTASIA · EXPERIÊNCIA INTERATIVA</small></div></a><h3>${esc(draft.title)}</h3><p>Uma história original de demonstração</p><div class="card-footer"><span>♫ ÁUDIO · ✧ MICROCENA</span><button id="saveBook">${saved?'✓ Na biblioteca':'+ Salvar'}</button></div></article>`;}
function bindSave(){if($('#saveBook'))$('#saveBook').onclick=()=>{saved=!saved;save('library',saved);$('#saveBook').textContent=saved?'✓ Na biblioteca':'+ Salvar';};}
function home(){
  $('#content').innerHTML=topbar()+`<div class="intro"><p class="section-label">DESCUBRA. LEIA. SINTA.</p><h1>Uma história espera por você.</h1><p class="muted">Novas vozes. Outros mundos. Muito além das palavras.</p></div>
  <section class="hero"><div class="hero-copy"><span class="section-label">✧ EXPERIÊNCIA EM DESTAQUE</span><h2>Algumas portas só se abrem por dentro.</h2><p>Entre no jardim das horas esquecidas. Uma história para ler, ouvir e descobrir no seu ritmo.</p><a class="button primary" href="#reader">Explorar a história ↗</a><div class="metadata">FANTASIA / 1 CAPÍTULO / LEITURA IMERSIVA</div></div><div class="hero-art art" aria-hidden="true"><span class="stars">· ✧ ·<br>✧ ·</span></div></section>
  <div class="section-head"><h2>Encontre seu próximo universo</h2></div>
  <input class="search" id="search" aria-label="Buscar histórias" placeholder="Buscar uma história…">
  <div class="chips">${['Todos','Fantasia','Romance','Ficção científica'].map((g,i)=>`<button class="chip ${i?'':'selected'}" data-filter="${g}" aria-pressed="${!i}">${g}</button>`).join('')}</div>
  <div class="grid" id="books"></div><p class="notice">Protótipo local: a primeira obra é interativa. As outras capas são conceitos visuais, sem capítulos disponíveis.</p>`;
  let filter='Todos';
  function refresh(){
    const q=$('#search').value.trim().toLocaleLowerCase();
    const cards=[];
    if((filter==='Todos'||filter==='Fantasia')&&draft.title.toLocaleLowerCase().includes(q))cards.push(bookCard());
    const concepts=[['Romance','Onde o sol encontra o mar','two'],['Ficção científica','Depois da última estrela','three']];
    for(const[g,title,cls]of concepts)if((filter==='Todos'||filter===g)&&title.toLocaleLowerCase().includes(q))cards.push(`<article class="card"><div class="cover ${cls}"><small>COLEÇÃO CONCEITUAL</small><span class="cover-title">${title}</span><small>${g}</small></div><h3>${title}</h3><p>Conceito de capa · em breve</p></article>`);
    $('#books').innerHTML=cards.join('')||'<p class="muted">Nenhuma história encontrada.</p>';bindSave();
  }
  $('#search').oninput=refresh;
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});refresh();});refresh();
}
function library(){
  $('#content').innerHTML=topbar()+`<h1>Sua biblioteca</h1><p class="muted">Histórias que você quer manter por perto.</p>`+(saved?'<div class="grid">'+bookCard()+'</div>':'<div class="empty"><h2>Seu próximo universo está lá fora.</h2><p>Salve uma história para encontrá-la aqui.</p><a class="button primary" href="#home">Descobrir histórias ↗</a></div>');
  bindSave();
}
function renderText(text){
  return C.interactionSegments(text,draft,prefs.plain).map(s=>s.type?`<button class="interactive" data-interaction="${s.type}" aria-label="${esc(s.text)}: ${s.type==='effect'?'ouvir efeito':'abrir ficha'}">${esc(s.text)} ${s.type==='effect'?'♫':'↗'}</button>`:esc(s.text)).join('');
}
function cleanupReader(){
  readerEpoch++;if(observer)observer.disconnect();observer=null;
  for(const t of dwellTimers)clearTimeout(t);dwellTimers.clear();
  closeScene(false);stopAll();enabled=false;
}
function reader(){
  cleanupReader();
  const ps=C.blocks(draft.text);page=Math.min(ps.length-1,page);
  $('#content').innerHTML=`<div class="reader-top"><a href="#home">← Voltar à descoberta</a><span class="badge">CAPÍTULO DEMONSTRATIVO</span><a href="#studio">Editar experiência ↗</a></div>
  <div class="reader-layout"><header class="reader-title"><span class="section-label">${esc(draft.title)}</span><h1>${esc(draft.chapter)}</h1><p class="muted">Capítulo 01 · Fantasia · Interações opcionais</p></header>
  <div class="toolbar"><button id="audioToggle">♫ Ativar áudio</button><button id="settings">⚙ Interações</button><button id="smaller" aria-label="Diminuir fonte">A−</button><button id="larger" aria-label="Aumentar fonte">A+</button><button id="theme">◐ Tema</button><label class="sr-only" for="readMode">Modo de leitura</label><select id="readMode"><option value="scroll">Rolagem</option><option value="pages">Páginas por trecho</option></select></div>
  <p class="help">Áudio somente com sua autorização. Passe o mouse ou toque em “Ver microcena” para abrir uma prévia. Progresso salvo neste navegador.</p>
  <article class="reading ${prefs.mode==='pages'?'paged':''}" style="--readsize:${prefs.size}px">
  ${ps.map((p,i)=>`<section class="passage ${i===page?'current':''}" data-page="${i}"><p>${renderText(p)}</p>${i===draft.sceneBlock-1&&prefs.scene&&!prefs.plain?'<button class="scene-trigger" id="sceneTrigger" aria-expanded="false" aria-controls="scenePopup">✧ Ver microcena</button>':''}</section>`).join('')}</article>
  <div class="progress"><div id="progressFill"></div></div><div class="reader-footer"><button id="prev">← Anterior</button><span id="pageLabel" class="muted"></span><button id="next">Próximo →</button></div>
  <p class="notice">Trilha e badaladas de demonstração são sintetizadas. A microcena padrão é uma animação, não um vídeo gerado por IA.</p></div>`;
  document.body.classList.toggle('reader-night',prefs.night);
  $('#audioToggle').onclick=toggleAudio;$('#settings').onclick=settings;
  $('#theme').onclick=()=>{prefs.night=!prefs.night;document.body.classList.toggle('reader-night',prefs.night);save('prefs',prefs);};
  function resize(n){prefs.size=Math.min(30,Math.max(16,prefs.size+n));$('.reading').style.setProperty('--readsize',prefs.size+'px');save('prefs',prefs);positionScene();}
  $('#smaller').onclick=()=>resize(-1);$('#larger').onclick=()=>resize(1);
  $('#readMode').value=prefs.mode;$('#readMode').onchange=e=>{prefs.mode=e.target.value;save('prefs',prefs);reader();};
  function go(delta){const next=Math.min(ps.length-1,Math.max(0,page+delta));setPage(next);if(prefs.mode==='scroll')document.querySelector(`[data-page="${next}"]`).scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'center'});else window.scrollTo({top:0,behavior:'auto'});}
  $('#prev').onclick=()=>go(-1);$('#next').onclick=()=>go(1);
  document.querySelectorAll('[data-interaction]').forEach(b=>b.onclick=()=>b.dataset.interaction==='effect'?playEffect():showModal(draft.lore,'<p class="section-label">FICHA DE PERSONAGEM</p><p>'+esc(draft.loreText)+'</p>'));
  if($('#sceneTrigger'))bindScene();
  setPage(page,false);
  if(prefs.mode==='scroll'){
    const epoch=readerEpoch;
    observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        clearTimeout(entry.target.dwellTimer);dwellTimers.delete(entry.target.dwellTimer);
        if(entry.isIntersecting){
          const t=setTimeout(()=>{dwellTimers.delete(t);if(epoch===readerEpoch&&routeName==='reader'&&!document.hidden)setPage(Number(entry.target.dataset.page));},550);
          entry.target.dwellTimer=t;dwellTimers.add(t);
        }
      }
    },{rootMargin:'-15% 0px -45% 0px',threshold:0});
    document.querySelectorAll('.passage').forEach(el=>observer.observe(el));
    if(page>0)requestAnimationFrame(()=>{if(epoch===readerEpoch)document.querySelector(`[data-page="${page}"]`)?.scrollIntoView({block:'center'});});
  }else{
    const epoch=readerEpoch;const t=setTimeout(()=>{dwellTimers.delete(t);if(epoch===readerEpoch&&!document.hidden)setPage(page);},550);dwellTimers.add(t);
  }
}
function setPage(p,allowAutomatic=true){
  const count=C.blocks(draft.text).length;
  page=Math.min(count-1,Math.max(0,p));
  if(page!==draft.sceneBlock-1)closeScene(false);
  document.querySelectorAll('.passage').forEach(el=>el.classList.toggle('current',Number(el.dataset.page)===page));
  $('#pageLabel').textContent='Trecho '+(page+1)+' de '+count;
  $('#progressFill').style.width=((page+1)/count*100)+'%';
  $('#prev').disabled=page===0;$('#next').disabled=page===count-1;$('#next').textContent=page===count-1?'Capítulo concluído ✓':'Próximo →';
  storage.set('progress',page);updateTrack();
  const key=draft.chapter+'|'+draft.text+'|'+page;
  if(allowAutomatic&&!prefs.plain&&enabled&&prefs.effects==='auto'&&!effectSeen.has(key)&&C.blocks(draft.text)[page].includes(draft.phrase)&&draft.phrase){effectSeen.add(key);playEffect();}
  if(allowAutomatic&&!document.hidden&&!prefs.plain&&prefs.scene&&prefs.sceneAuto&&draft.sceneMode==='auto'&&page===draft.sceneBlock-1&&!sceneSeen.has(key)){
    sceneSeen.add(key);openScene(true);
  }
}
function reducedMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
function sceneHTML(){
  let visual='<div class="scene-art" aria-hidden="true"><span>✧</span></div><button id="playScene">▷ Reproduzir microcena</button>';
  if(media.scene?.type.startsWith('video/'))visual=`<video id="sceneVideo" controls playsinline preload="metadata" ${enabled?'':'muted'} src="${media.scene.url}" aria-label="Vídeo da passagem"></video>`;
  else if(media.scene)visual=`<img src="${media.scene.url}" alt="Ilustração enviada pelo autor">`;
  return `<div class="scene-head"><strong>✧ Uma passagem ganha vida</strong><button id="closeScene" aria-label="Fechar microcena">×</button></div><div class="scene" id="scene">${visual}<small>${media.scene?'MÍDIA DO AUTOR':'ANIMAÇÃO DE DEMONSTRAÇÃO'}</small></div><div class="scene-footer"><span>Continue no seu ritmo.</span><button id="fullScene">⤢ Ampliar</button></div>`;
}
function bindScene(){
  const trigger=$('#sceneTrigger');
  trigger.onclick=()=>openScene(false);
  trigger.onfocus=()=>openScene(false);
  trigger.onpointerenter=e=>{if(e.pointerType==='mouse'){clearTimeout(hoverTimer);openScene(false);}};
  trigger.onpointerleave=queueCloseScene;
}
function queueCloseScene(){
  clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{
    const pop=$('#scenePopup'),v=$('#sceneVideo');
    if(pop&&!pop.matches(':hover')&&!pop.contains(document.activeElement)&&document.activeElement!==$('#sceneTrigger')&&!$('#scene')?.classList.contains('playing')&&(!v||v.paused))closeScene(false);
  },450);
}
function openScene(automatic=false){
  const trigger=$('#sceneTrigger');if(!trigger||prefs.plain||!prefs.scene)return;
  clearTimeout(hoverTimer);let popup=$('#scenePopup');
  if(!popup){
    popup=document.createElement('section');popup.id='scenePopup';popup.className='scene-popup';popup.setAttribute('role','region');popup.setAttribute('aria-label','Prévia da microcena');popup.innerHTML=sceneHTML();document.body.append(popup);
    popup.onpointerenter=()=>clearTimeout(hoverTimer);popup.onpointerleave=queueCloseScene;
    $('#closeScene').onclick=()=>closeScene(true);
    if($('#playScene'))$('#playScene').onclick=()=>{const playing=$('#scene').classList.toggle('playing');$('#playScene').textContent=playing?'Ⅱ Pausar microcena':'▷ Reproduzir microcena';};
    $('#fullScene').onclick=()=>{if($('#scene').requestFullscreen)$('#scene').requestFullscreen().catch(()=>toast('Tela cheia indisponível.'));else toast('Tela cheia indisponível neste navegador.');};
    if($('#sceneVideo'))$('#sceneVideo').onerror=()=>toast('Não foi possível abrir o vídeo. Verifique o formato do arquivo.');
  }
  trigger.setAttribute('aria-expanded','true');positionScene();
  if(automatic&&prefs.sceneAutoplay&&!reducedMotion()){
    if($('#sceneVideo')){$('#sceneVideo').muted=!enabled;$('#sceneVideo').play().catch(()=>{});}
    else if($('#playScene')){$('#scene').classList.add('playing');$('#playScene').textContent='Ⅱ Pausar microcena';}
  }
}
function closeScene(returnFocus=false){
  clearTimeout(hoverTimer);const popup=$('#scenePopup');if(!popup)return;
  const v=popup.querySelector('video');if(v)v.pause();popup.remove();
  const trigger=$('#sceneTrigger');
  if(trigger){trigger.setAttribute('aria-expanded','false');if(returnFocus){const focusHandler=trigger.onfocus;trigger.onfocus=null;trigger.focus({preventScroll:true});trigger.onfocus=focusHandler;}}
}
function positionScene(){
  const pop=$('#scenePopup'),trigger=$('#sceneTrigger');if(!pop||!trigger)return;
  const rect=trigger.getBoundingClientRect();
  if(rect.bottom<0||rect.top>innerHeight){closeScene(false);return;}
  pop.style.width=Math.min(370,innerWidth-24)+'px';
  const height=pop.getBoundingClientRect().height;
  pop.style.left=Math.max(12,Math.min(rect.left,innerWidth-pop.offsetWidth-12))+'px';
  const above=innerHeight-rect.bottom<height+20&&rect.top>height+12;
  pop.style.top=Math.max(12,Math.min(above?rect.top-height-8:rect.bottom+8,innerHeight-height-12))+'px';
}
function settings(){
  closeScene(false);
  showModal('Sua leitura, seu ritmo.',`<form id="preferences"><p class="muted">Interações opcionais, sempre sob seu controle.</p>
  <label class="checkrow"><input name="plain" type="checkbox" ${prefs.plain?'checked':''}> Ler sem nenhuma interação</label>
  <label class="checkrow"><input name="track" type="checkbox" ${prefs.track?'checked':''}> Trilha sonora por trecho</label>
  <label class="checkrow"><input name="scene" type="checkbox" ${prefs.scene?'checked':''}> Exibir prévias de microcenas</label>
  <label class="checkrow"><input name="sceneAuto" type="checkbox" ${prefs.sceneAuto?'checked':''}> Permitir popup automático sugerido pelo autor</label>
  <label class="checkrow"><input name="sceneAutoplay" type="checkbox" ${prefs.sceneAutoplay?'checked':''}> Reproduzir ao abrir automaticamente</label>
  <label for="effects">Efeitos sonoros</label><select id="effects" name="effects"><option value="click">Ao clicar</option><option value="auto">Automáticos com áudio autorizado</option><option value="off">Desligados</option></select>
  <p class="help">Vídeos automáticos ficam mudos sem áudio autorizado. Redução de movimento desativa reprodução automática. O popup não reabre automaticamente na mesma passagem durante esta sessão.</p>
  <button class="primary" type="submit">Aplicar preferências</button></form>`);
  $('#effects').value=prefs.effects;
  $('#preferences').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);for(const k of ['plain','track','scene','sceneAuto','sceneAutoplay'])prefs[k]=f.has(k);prefs.effects=f.get('effects');save('prefs',prefs);$('#modal').close();reader();};
}
function studio(){
  $('#content').innerHTML=topbar()+`<div class="intro"><span class="section-label">ESTÚDIO DO AUTOR</span><h1>Dê vida às suas palavras.</h1><p class="muted">Escreva uma passagem. Escolha como ela será sentida.</p></div>
  <p class="notice">Rascunho local. Áudio, imagens e vídeos ficam salvos neste navegador. Nada é enviado a um servidor. Limpar os dados do site também remove os arquivos.</p>
  ${mediaLoadFailed?'<p class="notice" role="alert">Não foi possível acessar os arquivos salvos. O texto continua disponível; recarregue para tentar novamente.</p>':''}
  <form id="editorForm"><div class="studio-grid"><section class="panel"><h2>Seu capítulo</h2>
  <label for="title">Nome da obra</label><input id="title" name="title" maxlength="200" value="${esc(draft.title)}" required>
  <label for="chapter">Título do capítulo</label><input id="chapter" name="chapter" maxlength="200" value="${esc(draft.chapter)}" required>
  <label for="text">Texto · separe os trechos com uma linha em branco</label><textarea id="text" name="text" class="editor" maxlength="200000" required>${esc(draft.text)}</textarea>
  <div class="studio-actions"><button class="primary" type="submit">Salvar rascunho</button><button type="button" id="previewDraft">Salvar e visualizar ↗</button><button type="button" id="restore">Restaurar versão anterior</button></div>
  <p class="help">Editor de texto simples. HTML/CSS avançados e publicação para outros leitores ainda não estão disponíveis.</p>
  </section><aside class="panel"><h2>Interatividade</h2>
  <div class="binding"><strong>♫ Trilha ambiente</strong><p>Muda de atmosfera a partir de um trecho. Um arquivo próprio substitui a trilha sintetizada e toca em loop.</p></div>
  <label for="trackBlock">Trecho da mudança de trilha</label><input id="trackBlock" name="trackBlock" type="number" min="1" value="${draft.trackBlock}" required>
  ${uploadField('track','Sua trilha','audio/*')}
  <div class="binding"><strong>◉ Som em uma frase</strong></div>
  <label for="phrase">Frase exata no texto</label><input id="phrase" name="phrase" value="${esc(draft.phrase)}">
  ${uploadField('effect','Seu efeito sonoro','audio/*')}
  <div class="binding"><strong>✧ Microcena contextual</strong><p>Prévia junto ao trecho, sem deslocar o texto.</p></div>
  <label for="sceneMode">Abertura sugerida</label><select id="sceneMode" name="sceneMode"><option value="hover">Ao passar o mouse ou tocar</option><option value="auto">Popup automático ao chegar ao trecho</option></select>
  <label for="sceneBlock">Vincular ao trecho</label><input id="sceneBlock" name="sceneBlock" type="number" min="1" value="${draft.sceneBlock}" required>
  ${uploadField('scene','Seu vídeo ou imagem','video/*,image/*')}
  <label for="lore">Nome clicável do personagem ou local</label><input id="lore" name="lore" value="${esc(draft.lore)}">
  <label for="loreText">Ficha de lore</label><textarea id="loreText" name="loreText" rows="4">${esc(draft.loreText)}</textarea>
  </aside></div></form>`;
  $('#sceneMode').value=draft.sceneMode;
  $('#editorForm').addEventListener('input',()=>{dirty=true;});
  $('#editorForm').onsubmit=e=>{e.preventDefault();saveDraft();};
  $('#previewDraft').onclick=()=>{if($('#editorForm').reportValidity()&&saveDraft())location.hash='reader';};
  $('#restore').onclick=()=>{
    const previous=storage.get('previous',null),result=C.validateDraft(previous);
    if(result.error)return toast('Ainda não há uma versão anterior válida.');
    if(dirty&&!confirm('Descartar alterações não salvas e restaurar a versão anterior?'))return;
    if(!save('draft',result.draft))return;
    storage.set('previous',draft);draft=result.draft;dirty=false;studio();toast('Versão anterior restaurada.');
  };
  for(const type of ['track','effect','scene']){
    $('#'+type+'Upload').onchange=async e=>{
      const f=e.target.files[0];if(!f)return;
      if(!globalThis.LenoraMedia.validFile(type,f)){e.target.value='';return toast('Escolha um formato compatível, não vazio, de até 25 MB.');}
      if(mediaBusy){e.target.value='';return toast('Aguarde o arquivo terminar de salvar.');}
      setMediaBusy(true);
      try{
        await mediaStore.put(type,f);
        if(media[type])URL.revokeObjectURL(media[type].url);
        media[type]={url:URL.createObjectURL(f),type:f.type,name:f.name};
        if($('#'+type+'Name'))$('#'+type+'Name').textContent=f.name;
        toast('Arquivo salvo neste navegador.');
      }catch{toast('Não foi possível salvar o arquivo. A mídia anterior foi mantida. Verifique o espaço e as permissões do navegador.');}
      finally{e.target.value='';setMediaBusy(false);}
    };
    $('#'+type+'Remove').onclick=async()=>{
      if(mediaBusy)return;
      setMediaBusy(true);
      try{
        await mediaStore.remove(type);
        if(media[type])URL.revokeObjectURL(media[type].url);
        delete media[type];
        if($('#'+type+'Name'))$('#'+type+'Name').textContent='Demonstração padrão';
        toast('Arquivo removido deste navegador.');
      }catch{toast('Não foi possível remover o arquivo. A mídia anterior foi mantida.');}
      finally{setMediaBusy(false);}
    };
  }
  setMediaBusy(mediaBusy);
}
function setMediaBusy(busy){
  mediaBusy=busy;
  for(const type of ['track','effect','scene']){
    if($('#'+type+'Upload'))$('#'+type+'Upload').disabled=busy;
    if($('#'+type+'Remove'))$('#'+type+'Remove').disabled=busy||!media[type];
  }
  for(const selector of ['#previewDraft','#editorForm button[type="submit"]'])if($(selector))$(selector).disabled=busy;
}
function uploadField(key,label,accept){
  return `<label for="${key}Upload">${label} · opcional</label><input id="${key}Upload" type="file" accept="${accept}"><div class="upload-status"><small id="${key}Name">${esc(media[key]?.name||'Demonstração padrão')}</small><button id="${key}Remove" type="button" ${media[key]?'':'disabled'}>Remover arquivo</button></div>`;
}
function saveDraft(){
  const input=Object.fromEntries(new FormData($('#editorForm'))),result=C.validateDraft(input);
  if(result.error){toast(result.error);return false;}
  const previous=draft;
  if(!save('draft',result.draft)){draft=result.draft;dirty=true;return false;}
  storage.set('previous',previous);draft=result.draft;dirty=false;toast('Rascunho e interações salvos.');return true;
}
function renderRoute(){
  const requested=location.hash.slice(1);
  if(requested==='content'){ $('#content').focus(); return; }
  const mapId=requested.startsWith('map-editor/')?requested.slice(11):requested.startsWith('maps-studio/')?requested.slice(12):null;
  const chapterId=requested.startsWith('chapter/')?requested.slice(8):null;
  const sceneId=requested.startsWith('scene/')?requested.slice(6):null;
  const next=mapId?(requested.startsWith('map-editor/')?'map-editor':'maps-studio'):chapterId?'chapter':sceneId?'scene':['home','atlas','journey','world-studio','scene-studio','maps-studio','scenes','reading-demo','library','reader','studio'].includes(requested)?requested:'home';
  if(worldExperience.isBusy()){history.replaceState(null,'',lastAuthorHash||'#scene-studio');toast('Aguarde o arquivo terminar de salvar.');return;}
  if(['world-studio','scene-studio','maps-studio','map-editor'].includes(routeName)&&worldExperience.hasUnsaved()&&!confirm('Sair sem salvar as alterações do mundo?')){history.replaceState(null,'',lastAuthorHash||'#'+routeName);return;}
  if(routeName==='studio'&&mediaBusy&&next!=='studio'){history.replaceState(null,'','#studio');toast('Aguarde o arquivo terminar de salvar.');return;}
  if(routeName==='studio'&&dirty&&next!=='studio'&&!confirm('Sair sem salvar as alterações do texto?')){history.replaceState(null,'','#studio');return;}
  dirty=false;worldExperience.stopMedia();cleanupReader();if($('#modal').open)$('#modal').close();routeName=next;if(['world-studio','scene-studio','maps-studio','map-editor'].includes(next))lastAuthorHash='#'+requested;
  document.body.classList.remove('reader-night');
  const worldRoutes=['home','atlas','journey','world-studio','chapter','scenes','scene','scene-studio','maps-studio','map-editor'];
  document.body.classList.toggle('world-mode',worldRoutes.includes(next));
  const activeRoute=next==='chapter'?'journey':next==='scene'?'scenes':['scene-studio','maps-studio','map-editor'].includes(next)?'world-studio':next;
  document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===activeRoute);if(a.dataset.nav===activeRoute)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(worldRoutes.includes(next))worldExperience.render(next,chapterId||sceneId||mapId);
  else if(next==='reader')reader();else if(next==='studio')studio();else if(next==='library')library();else home();
  if(next!=='reader')window.scrollTo(0,0);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeScene(true);});
document.addEventListener('pointerdown',e=>{if($('#scenePopup')&&!$('#scenePopup').contains(e.target)&&!$('#sceneTrigger')?.contains(e.target))closeScene(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){worldExperience.stopMedia();enabled=false;stopAll();closeScene(false);if($('#audioToggle'))$('#audioToggle').textContent='♫ Ativar áudio';}});
window.addEventListener('scroll',positionScene,{passive:true});window.addEventListener('resize',positionScene);
window.addEventListener('beforeunload',e=>{if(dirty||mediaBusy||worldExperience.hasUnsaved()){e.preventDefault();e.returnValue='';}});
try{
  for(const record of await mediaStore.load())media[record.slot]={url:URL.createObjectURL(record.blob),type:record.blob.type,name:record.name};
}catch{mediaLoadFailed=true;}
window.addEventListener('hashchange',renderRoute);
renderRoute();
if(storage.hasFailure())toast('Armazenamento indisponível ou dados inválidos. Usando a sessão atual.');
})();
