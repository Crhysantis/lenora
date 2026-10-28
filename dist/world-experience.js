'use strict';
globalThis.createWorldExperience=function({storage,toast,showModal,esc,getAsset,putAsset}){
  const W=globalThis.LenoraWorld,$=s=>document.querySelector(s);
  const stored=storage.get('world-editor',null);
  let published=W.migrateInitialWorld(stored?.published);
  let draft=stored?.draft?W.migrateInitialWorld(stored.draft):W.clone(published);
  let revision=Number.isSafeInteger(stored?.revision)?stored.revision:0;
  let progress=W.normalizeProgress(published,storage.get('world-progress-'+published.id,{}));
  let filter='all',query='',editing=null;
  const scenes=globalThis.createSceneExperience({esc,toast,storage,getAsset,putAsset,getWorld:()=>published,getDraft:()=>draft,getProgress:()=>progress,readingLink:()=>nextLink(),openEntity,
    visitEntity:id=>{progress=W.visit(published,progress,id);persistProgress();},
    saveScene:scene=>{
      const list=draft.scenes||[],candidate={...draft,scenes:list.some(s=>s.id===scene.id)?list.map(s=>s.id===scene.id?scene:s):[...list,scene]};
      const result=W.validateWorld(candidate);if(result.error){toast(result.error);return false;}
      const previous=draft;draft=result.world;if(!persist()){draft=previous;toast('Não foi possível salvar a cena. O rascunho anterior foi mantido.');return false;}return true;
    }
  });
  function persist(){
    return storage.set('world-editor',{draft,published,revision});
  }
  function persistProgress(){
    if(!storage.set('world-progress-'+published.id,progress))toast('Sua jornada está disponível apenas nesta sessão.');
  }
  function chapterHref(chapter){return chapter.text?'#chapter/'+chapter.id:chapter.url;}
  function nextLink(label='Continuar a história'){
    const next=published.chapters[progress.completed.length]||published.chapters.at(-1);
    if(next&&progress.completed.length===published.chapters.length)label='Reler '+next.title;
    return next?`<a class="world-button gold" href="${esc(chapterHref(next))}" ${next.text?'':'target="_blank" rel="noopener noreferrer"'}>${label} <span aria-hidden="true">↗</span></a>`:'<a class="world-button gold" href="#journey">Começar pelo livro <span aria-hidden="true">↗</span></a>';
  }
  function heading(kicker,title,body){return `<header class="world-heading"><p class="world-eyebrow">${kicker}</p><h1>${title}</h1><p>${body}</p></header>`;}
  function stats(){
    const unlocked=W.discoverable(published,progress).filter(e=>!e.locked),r=W.rewards(published,progress);
    return `<div class="world-stats"><span><strong>${String(unlocked.length).padStart(2,'0')}</strong> descobertas abertas</span><span><strong>${String(progress.completed.length).padStart(2,'0')}</strong> capítulos concluídos</span><span><strong>${r.points}</strong> pontos de jornada</span></div>`;
  }
  function home(){
    const stars=Array.from({length:24},(_,i)=>`<i style="--x:${(i*37+11)%100}%;--y:${(i*23+7)%100}%;--delay:${i%7}s"></i>`).join('');
    $('#content').innerHTML=`<section class="world-hero"><div class="world-stars" aria-hidden="true">${stars}</div><div class="world-hero-copy"><p class="world-eyebrow">EXPLORE UM MUNDO VIVO · LENORA</p><p class="world-overline">O AÇO GUARDA HISTÓRIAS. A LUZ REVELA CAMINHOS.</p><h1>${esc(published.intro)}</h1><p class="world-lead">Entre em <strong>${esc(published.name)}</strong>. Conheça suas histórias. Encontre lugares e personagens. Deixe a leitura revelar o que vem depois.</p><div class="world-actions"><a class="world-button gold" href="#scenes">Entrar nos lugares ↗</a>${nextLink('Ler a história')}<a class="world-button ghost" href="#atlas">Explorar o mundo <span aria-hidden="true">↗</span></a></div><p class="world-footnote">${esc(published.book)} · ${esc(published.subtitle)}</p></div><div class="world-orbit" aria-hidden="true"><div class="orbit-ring r1"></div><div class="orbit-ring r2"></div><div class="world-sphere"></div><span class="orbit-caption">${esc(published.name.toLocaleUpperCase())}<br><small>UM MUNDO EM DESCOBERTA</small></span><span class="orbit-coordinate">01 / O PRIMEIRO CONTATO</span></div><a class="world-scroll" href="#atlas">DESÇA MAIS FUNDO <span>↓</span></a></section>
      <section class="world-section">${stats()}<div class="world-section-top"><div><p class="world-eyebrow">O MUNDO SE ABRE COM VOCÊ</p><h2>Cada capítulo. Uma nova camada.</h2></div><a class="world-text-link" href="#journey">Sua jornada ↗</a></div><div class="world-paths"><a href="#atlas"><span>01 / EXPLORAR</span><h3>Além da história</h3><p>Lugares, personagens e vestígios. Um mundo para percorrer no seu ritmo.</p><b>Entrar no atlas ↗</b></a><a href="#journey"><span>02 / DESCOBRIR</span><h3>O que a leitura revela</h3><p>Avance pelo livro. Novas descobertas se abrem sem antecipar os seus mistérios.</p><b>Acompanhar a jornada ↗</b></a><a href="#world-studio"><span>03 / CONSTRUIR</span><h3>Um mundo vivo</h3><p>O estúdio conecta cada detalhe ao momento em que ele pode ser revelado.</p><b>Abrir o estúdio ↗</b></a></div></section><footer class="world-bottom"><strong>${esc(published.name)}</strong><p>O mundo continua. A história espera por você.</p>${nextLink()}</footer>`;
  }
  function entityCard(entity){
    if(entity.locked)return `<article class="world-card locked"><span class="world-card-symbol" aria-hidden="true">◇</span><p class="world-eyebrow">AINDA ALÉM DO HORIZONTE</p><h3>Uma descoberta espera.</h3><p>Revelada após a etapa ${entity.unlockChapter} da leitura. O nome e a história permanecem ocultos.</p><a class="world-text-link" href="#journey">Avançar na leitura ↗</a></article>`;
    return `<button class="world-card" data-entity="${entity.id}"><span class="world-card-symbol" aria-hidden="true">${entity.kind==='character'?'♙':entity.kind==='place'?'⌁':'✧'}</span><span class="world-eyebrow">${esc(W.KINDS[entity.kind])} / ${progress.visited.includes(entity.id)?'EXPLORADO':'A DESCOBRIR'}</span><h3>${esc(entity.title)}</h3><p>${esc(entity.body.slice(0,150))}${entity.body.length>150?'…':''}</p><span class="world-text-link">Abrir descoberta ↗</span></button>`;
  }
  function atlas(){
    $('#content').innerHTML=`<section class="world-section">${heading('O ATLAS VIVO','O mundo, no seu horizonte.','Explore o que a sua jornada já revelou. A próxima página pode mudar o que você conhece.')}<div class="atlas-controls"><label class="sr-only" for="worldSearch">Buscar nas descobertas abertas</label><input id="worldSearch" type="search" placeholder="Buscar nas suas descobertas…" value="${esc(query)}"><div class="world-filters">${[['all','Tudo'],['place','Lugares'],['character','Personagens'],['people','Povos'],['relic','Vestígios']].map(([key,label])=>`<button data-world-filter="${key}" aria-pressed="${filter===key}">${label}</button>`).join('')}</div></div><div id="worldEntities" class="world-entities"></div><aside class="world-reading-prompt"><div><p class="world-eyebrow">A HISTÓRIA É A CHAVE</p><h2>Nem todo caminho aparece em um mapa.</h2><p>Volte ao livro para abrir a próxima camada de ${esc(published.name)}.</p></div>${nextLink()}</aside></section>`;
    function refresh(){
      const entities=W.discoverable(published,progress).filter(e=>e.locked?(filter==='all'&&!query):((filter==='all'||e.kind===filter)&&`${e.title} ${e.body}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
      $('#worldEntities').innerHTML=entities.map(entityCard).join('')||'<div class="world-empty"><h2>O horizonte ainda vai crescer.</h2><p>Nenhuma descoberta aberta corresponde a esta busca. O conteúdo de Ayîvernî está sendo conectado à leitura pelo autor.</p></div>';
      document.querySelectorAll('[data-entity]').forEach(button=>button.onclick=()=>openEntity(button.dataset.entity));
    }
    $('#worldSearch').oninput=e=>{query=e.target.value;refresh();};
    document.querySelectorAll('[data-world-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.worldFilter;document.querySelectorAll('[data-world-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refresh();});refresh();
  }
  function openEntity(id){
    const entity=W.discoverable(published,progress).find(e=>e.id===id&&!e.locked);if(!entity)return;
    const already=progress.visited.includes(id);progress=W.visit(published,progress,id);persistProgress();
    const marker=document.querySelector(`[data-entity="${id}"] .world-eyebrow`);if(marker)marker.textContent=W.KINDS[entity.kind]+' / EXPLORADO';
    showModal(entity.title,`<p class="world-eyebrow">${esc(W.KINDS[entity.kind])} · SEU CADERNO DE DESCOBERTAS</p><p class="lore-body">${esc(entity.body)}</p>${entity.layers.map(layer=>`<section class="lore-layer"><p class="world-eyebrow">${esc(published.chapters[layer.chapter-1]?.title||'Etapa '+layer.chapter)} · NOVA CAMADA</p><p class="lore-body">${esc(layer.body)}</p></section>`).join('')}<a class="world-button gold" href="#journey" id="backToStory">Voltar à história ↗</a>`);
    $('#backToStory').onclick=()=>$('#modal').close();
    if(!already)toast('Nova descoberta explorada · +10 pontos');
  }
  function journey(){
    const reward=W.rewards(published,progress),nextIndex=progress.completed.length;
    $('#content').innerHTML=`<section class="world-section">${heading('SEU PASSAPORTE PARA '+esc(published.name.toLocaleUpperCase()),'Uma jornada que é sua.','Leia. Descubra. Volte com outros olhos. Seus avanços ficam guardados neste navegador.')} ${stats()}<div class="journey-layout"><section><p class="world-eyebrow">${esc(published.book)} · ${esc(published.subtitle)}</p><h2>A história abre o caminho.</h2><p class="world-muted">Leia aqui no portal ou siga o link oficial quando disponível. Marque a etapa como lida para abrir suas descobertas. O progresso é informado por você.</p><ol class="chapter-path">${published.chapters.map((c,i)=>`<li class="${i<nextIndex?'done':i===nextIndex?'next':'future'}"><span class="chapter-number">${String(i+1).padStart(2,'0')}</span><div><small>${i<nextIndex?'CONCLUÍDO':i===nextIndex?'SEU PRÓXIMO PASSO':'MAIS ADIANTE'}</small><h3>${i<=nextIndex?esc(c.title):'Um capítulo ainda por descobrir'}</h3>${i<=nextIndex?`<a class="world-text-link" href="${esc(chapterHref(c))}" ${c.text?'':'target="_blank" rel="noopener noreferrer"'}>${i<nextIndex?'Reler':c.text?'Ler no portal':'Ler no canal oficial'} ↗</a>`:''}${i===nextIndex?`<button class="world-button gold complete-chapter" data-complete="${c.id}">Já li esta etapa · abrir descobertas</button>`:''}</div></li>`).join('')||'<li class="world-empty"><h3>A primeira porta está sendo preparada.</h3><p>O link oficial e as descobertas do capítulo 1 ainda precisam ser conectados pelo autor.</p><a class="world-text-link" href="#world-studio">Preparar o primeiro capítulo ↗</a></li>'}</ol></section><aside class="journey-passport"><p class="world-eyebrow">CADERNO DO VIAJANTE</p><h2>${reward.points}<small> pontos de jornada</small></h2><p>50 por etapa concluída.<br>10 por descoberta explorada.<br>Cada avanço conta uma única vez.</p><div class="world-badges">${reward.badges.map(b=>`<div class="${b.earned?'earned':''}"><span aria-hidden="true">${b.earned?'✦':'◇'}</span><strong>${b.name}</strong><p>${b.description}</p><small>${b.earned?'CONQUISTADO':'A DESCOBRIR'}</small></div>`).join('')}</div><a class="world-text-link" href="#atlas">Voltar ao atlas ↗</a></aside></div></section>`;
    document.querySelectorAll('[data-complete]').forEach(button=>button.onclick=()=>{
      const before=W.discoverable(published,progress).filter(e=>!e.locked).length,result=W.completeChapter(published,progress,button.dataset.complete);
      if(result.error)return toast(result.error);
      progress=result.progress;persistProgress();const opened=W.discoverable(published,progress).filter(e=>!e.locked).length-before;
      journey();toast(`Etapa concluída · +50 pontos${opened?' · '+opened+' nova(s) descoberta(s)':''}`);
    });
  }
  function saveWorldDraft(){
    const result=W.validateWorld(draft);if(result.error){toast(result.error);return false;}
    draft=result.world;if(!persist()){toast('Sem acesso ao armazenamento. O mundo continua nesta sessão; não feche a página.');return false;}return true;
  }
  function studio(){
    $('#content').innerHTML=`<section class="world-section">${heading('ESTÚDIO DE MUNDOS','Construa o que será descoberto.','Ayîvernî primeiro. O atlas cresce a partir do cânone e de momentos exatos da leitura.')}<p class="world-editor-notice">Protótipo de autoria local. Salvar prepara um rascunho; publicar atualiza apenas a experiência deste navegador. O percurso inicial contém somente o prólogo e o capítulo 1 fornecidos pelo autor. Novos textos e revelações serão preparados em etapas futuras.</p><div class="world-actions"><a class="world-button gold" href="#scene-studio">Abrir editor visual de cenas ↗</a><a class="world-text-link" href="#scenes">Ver experiências publicadas ↗</a></div><form id="worldPresentation" class="world-editor-panel"><h2>A porta de entrada</h2><div class="world-form-grid"><label>Nome do mundo<input name="name" value="${esc(draft.name)}" required maxlength="200"></label><label>Nome do livro<input name="book" value="${esc(draft.book)}" required maxlength="200"></label><label>Subtítulo<input name="subtitle" value="${esc(draft.subtitle)}" maxlength="200"></label><label>Apresentação breve<input name="intro" value="${esc(draft.intro)}" required maxlength="500"></label></div><div class="world-actions"><button class="world-button ghost" type="submit">Salvar apresentação</button><button class="world-button gold" type="button" id="publishWorld">Publicar experiência neste navegador</button></div><p class="world-muted" id="worldRevision">${revision?'Versão publicada: '+revision:draft.chapters.length+' etapa(s) de leitura preparadas'}</p></form>
      <div class="world-studio-layout"><section class="world-editor-panel"><p class="world-eyebrow">01 / O CAMINHO DE LEITURA</p><h2>Conecte os capítulos.</h2><p class="world-muted">Na ordem do livro, incluindo o prólogo se desejar. Cada posição é uma etapa de desbloqueio.</p><ol class="studio-chapters">${draft.chapters.map((c,i)=>`<li><b>${i+1}.</b> ${esc(c.title)} <button type="button" data-edit-chapter="${i}">Editar</button></li>`).join('')||'<li>Nenhum capítulo conectado.</li>'}</ol><form id="chapterForm"><input type="hidden" name="index" value=""><label>Título do capítulo<input name="title" required maxlength="200"></label><label>Link oficial HTTPS · opcional se houver texto<input name="url" type="url" placeholder="https://…"></label><label>Texto para ler no portal<textarea name="text" maxlength="200000" rows="8"></textarea></label><button class="world-button ghost" type="submit">Salvar capítulo</button></form></section><section class="world-editor-panel"><p class="world-eyebrow">02 / AS CAMADAS DO MUNDO</p><h2>Crie uma descoberta.</h2><form id="entityForm"><label>Nome<input name="title" required maxlength="200"></label><div class="world-form-grid"><label>Categoria<select name="kind">${Object.entries(W.KINDS).map(([key,value])=>`<option value="${key}">${value}</option>`).join('')}</select></label><label>Revelar após<select name="unlockChapter">${chapterOptions(0)}</select></label></div><label>O que o leitor pode saber nesse ponto<textarea name="body" required maxlength="12000" rows="5"></textarea></label><details><summary>Adicionar uma revelação posterior</summary><div id="worldLayers">${layerRow()}</div><button type="button" id="addWorldLayer" class="world-button ghost">Mais uma camada</button></details><div class="world-actions"><button class="world-button ghost" type="submit">Salvar descoberta</button><button class="world-button ghost" id="cancelEntity" type="button" hidden>Cancelar edição</button></div></form></section></div><section class="world-editor-panel"><div class="world-section-top"><div><p class="world-eyebrow">03 / ACERVO DO MUNDO</p><h2>O que está sendo preparado</h2></div><span>${draft.entities.length} descoberta(s)</span></div><div class="studio-entities">${draft.entities.map(e=>`<article><div><small>${esc(W.KINDS[e.kind])} · ${e.unlockChapter?'APÓS A ETAPA '+e.unlockChapter:'ACESSO INICIAL'}</small><h3>${esc(e.title)}</h3><p>${e.layers.length} camada(s) posterior(es)</p></div><button type="button" data-edit-entity="${e.id}">Editar</button><button type="button" data-remove-entity="${e.id}">Remover</button></article>`).join('')}</div></section><p class="world-muted">O leitor interativo anterior permanece como laboratório de recursos: <a class="world-text-link" href="#reading-demo">abrir demonstração</a> · <a class="world-text-link" href="#studio">editor de texto e mídia</a>.</p></section>`;
    document.querySelectorAll('#worldPresentation,#chapterForm,#entityForm').forEach(form=>form.addEventListener('input',()=>{form.dataset.changed='true';}));
    $('#worldPresentation').onsubmit=e=>{e.preventDefault();updatePresentation();if(saveWorldDraft()){e.target.dataset.changed='false';toast('Apresentação salva como rascunho.');}};
    $('#publishWorld').onclick=()=>{
      if($('#chapterForm').dataset.changed==='true'||$('#entityForm').dataset.changed==='true')return toast('Salve o capítulo ou a descoberta em edição antes de publicar.');
      if(!$('#worldPresentation').reportValidity())return;updatePresentation();
      const result=W.validateWorld(draft);if(result.error)return toast(result.error);
      const old=published;published=W.clone(result.world);revision++;
      if(!persist()){published=old;revision--;return toast('Não foi possível publicar. A versão anterior foi mantida.');}
      progress=W.normalizeProgress(published,old.id===published.id?progress:storage.get('world-progress-'+published.id,{}));persistProgress();studio();toast('Experiência publicada neste navegador.');
    };
    $('#chapterForm').onsubmit=e=>{
      e.preventDefault();const f=new FormData(e.target),url=W.httpsURL(f.get('url')),text=String(f.get('text')||'');
      if(url===null||(!url&&!text.trim()))return toast('Informe o texto da etapa ou um link oficial HTTPS válido.');
      const index=f.get('index'),chapter={id:index===''?'chapter-'+crypto.randomUUID():draft.chapters[Number(index)].id,title:String(f.get('title')).trim(),url,text};
      if(index==='')draft.chapters.push(chapter);else draft.chapters[Number(index)]=chapter;
      if(saveWorldDraft()){studio();toast('Capítulo salvo no rascunho.');}
    };
    document.querySelectorAll('[data-edit-chapter]').forEach(button=>button.onclick=()=>{
      const form=$('#chapterForm'),i=Number(button.dataset.editChapter),c=draft.chapters[i];
      form.elements.index.value=i;form.elements.title.value=c.title;form.elements.url.value=c.url;form.elements.text.value=c.text||'';form.elements.title.focus();
    });
    $('#entityForm').onsubmit=e=>{
      e.preventDefault();const f=new FormData(e.target),chapters=f.getAll('layerChapter'),bodies=f.getAll('layerBody').map(body=>String(body).trim()),layers=[];
      for(let i=0;i<chapters.length;i++){if(Boolean(chapters[i])!==Boolean(bodies[i]))return toast('Preencha o capítulo e o texto de cada nova camada.');if(chapters[i])layers.push({chapter:Number(chapters[i]),body:bodies[i]});}
      const previous=editing?draft.entities.find(entity=>entity.id===editing):null;
      const entity={id:editing||'entry-'+crypto.randomUUID(),kind:f.get('kind'),title:String(f.get('title')).trim(),body:String(f.get('body')).trim(),unlockChapter:Number(f.get('unlockChapter')),layers};
      const candidate={...draft,entities:previous?draft.entities.map(item=>item.id===editing?entity:item):[...draft.entities,entity]};
      const result=W.validateWorld(candidate);if(result.error)return toast(result.error);
      draft=result.world;editing=null;if(saveWorldDraft()){studio();toast('Descoberta salva no rascunho.');}
    };
    $('#addWorldLayer').onclick=()=>$('#worldLayers').insertAdjacentHTML('beforeend',layerRow());
    $('#cancelEntity').onclick=()=>{editing=null;studio();};
    document.querySelectorAll('[data-edit-entity]').forEach(button=>button.onclick=()=>{
      editing=button.dataset.editEntity;const entity=draft.entities.find(e=>e.id===editing),form=$('#entityForm');
      for(const key of ['title','kind','body','unlockChapter'])form.elements[key].value=entity[key];
      $('#worldLayers').innerHTML=(entity.layers.length?entity.layers:[{}]).map(layerRow).join('');
      $('#cancelEntity').hidden=false;form.elements.title.focus();
    });
    document.querySelectorAll('[data-remove-entity]').forEach(button=>button.onclick=()=>{
      draft.entities=draft.entities.filter(e=>e.id!==button.dataset.removeEntity);editing=null;
      if(saveWorldDraft()){studio();toast('Descoberta removida do rascunho. Publique para atualizar o atlas.');}
    });
  }
  function layerRow(layer={}){return `<div class="world-layer-editor"><label>Capítulo da nova camada<select name="layerChapter"><option value="">Sem camada adicional</option>${draft.chapters.map((c,i)=>`<option value="${i+1}" ${layer.chapter===i+1?'selected':''}>Etapa ${i+1}: ${esc(c.title)}</option>`).join('')}</select></label><label>Novo detalhe<textarea name="layerBody" maxlength="12000" rows="3">${esc(layer.body||'')}</textarea></label></div>`;}
  function chapterOptions(selected){return `<option value="0" ${selected===0?'selected':''}>Desde a entrada no mundo</option>`+draft.chapters.map((c,i)=>`<option value="${i+1}">Etapa ${i+1}: ${esc(c.title)}</option>`).join('');}
  function updatePresentation(){const f=new FormData($('#worldPresentation'));for(const key of ['name','book','subtitle','intro'])draft[key]=String(f.get(key)).trim();}
  function chapter(id){
    const c=W.readableChapter(published,progress,id);
    if(!c){$('#content').innerHTML='<section class="world-section">'+heading('UM PASSO DE CADA VEZ','Essa etapa ainda está fechada.','Continue pela ordem da história para preservar suas descobertas.')+'<a class="world-button gold" href="#journey">Voltar à jornada</a></section>';return;}
    if(!c.text){$('#content').innerHTML='<section class="world-section">'+heading('LEITURA NO CANAL OFICIAL',esc(c.title),'Esta etapa está disponível no canal oficial do livro.')+'<a class="world-button gold" target="_blank" rel="noopener noreferrer" href="'+esc(c.url)+'">Abrir leitura oficial ↗</a><a class="world-button ghost" href="#journey">Voltar à jornada</a></section>';return;}
    const complete=progress.completed.includes(c.id);
    const size=Math.min(30,Math.max(16,Number(storage.get('world-reading-size',21))||21));
    $('#content').innerHTML=`<section class="world-section world-chapter"><a class="world-text-link" href="#journey">← Minha jornada</a>${heading(esc(published.book),esc(c.title),'Leia no seu ritmo. As descobertas desta etapa se abrem quando você indicar que concluiu a leitura.')}<div class="world-reading-controls"><button id="worldSmaller" aria-label="Diminuir fonte da história">A−</button><button id="worldLarger" aria-label="Aumentar fonte da história">A+</button>${c.url?`<a class="world-text-link" target="_blank" rel="noopener noreferrer" href="${esc(c.url)}">Canal oficial ↗</a>`:''}</div><article class="world-story" aria-label="Texto de ${esc(c.title)}" style="--story-size:${size}px">${c.text.split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join('')}</article><div class="world-reading-prompt"><div><p class="world-eyebrow">A HISTÓRIA ABRE O MUNDO</p><h2>${complete?'Esta etapa já faz parte da sua jornada.':'Pronto para descobrir o que se abriu?'}</h2><p>A conclusão é informada por você. Relê-la não repete a recompensa.</p></div>${complete?'<a class="world-button gold" href="#atlas">Explorar descobertas</a>':'<button class="world-button gold" id="finishWorldChapter">Concluí a leitura · abrir descobertas</button>'}</div></section>`;
    function resize(delta){const el=$('.world-story'),n=Math.min(30,Math.max(16,parseInt(el.style.getPropertyValue('--story-size'))+delta));el.style.setProperty('--story-size',n+'px');storage.set('world-reading-size',n);}
    $('#worldSmaller').onclick=()=>resize(-1);$('#worldLarger').onclick=()=>resize(1);
    if($('#finishWorldChapter'))$('#finishWorldChapter').onclick=()=>{
      const result=W.completeChapter(published,progress,c.id);if(result.error)return toast(result.error);
      progress=result.progress;persistProgress();query='';filter='all';location.hash='atlas';toast('Leitura concluída · descobertas atualizadas.');
    };
  }
  function render(route,chapterId){
    editing=null;progress=W.normalizeProgress(published,progress);
    if(route==='scenes')scenes.list();else if(route==='scene')scenes.enter(chapterId);else if(route==='scene-studio')scenes.editor();else if(route==='chapter')chapter(chapterId);else if(route==='home')home();else if(route==='atlas')atlas();else if(route==='journey')journey();else studio();
  }
  function hasUnsaved(){return scenes.hasUnsaved()||Boolean(document.querySelector('#worldPresentation[data-changed="true"],#chapterForm[data-changed="true"],#entityForm[data-changed="true"]'));}
  return{render,hasUnsaved,stopMedia:scenes.stop,isBusy:scenes.isBusy};
};
