'use strict';
globalThis.createSceneExperience=function(api){
  const {esc,toast}=api,S=globalThis.LenoraScenes,$=s=>document.querySelector(s);
  let current=null,selected=0,dirty=false,pending=false,audio=null,synth=null,mediaEpoch=0;
  function stop(){
    mediaEpoch++;
    if(audio){audio.pause();audio=null;}
    if(synth){synth.close();synth=null;}
    if($('#sceneSound')){$('#sceneSound').textContent='Ativar som';$('#sceneSound').setAttribute('aria-pressed','false');}
  }
  function artwork(setting){
    if(setting!=='forest-city')return `<div class="scene-atmosphere ${setting}" aria-hidden="true"><i></i><i></i><i></i><div class="scene-moon"></div><div class="scene-ridge"></div></div>`;
    return `<svg class="scene-city" viewBox="0 0 1440 810" aria-hidden="true" focusable="false"><defs><linearGradient id="citySky" x2="0" y2="1"><stop stop-color="#203841"/><stop offset="1" stop-color="#0a141e"/></linearGradient><linearGradient id="cityMetal"><stop stop-color="#1b2933"/><stop offset=".45" stop-color="#597079"/><stop offset=".7" stop-color="#263e49"/><stop offset="1" stop-color="#101e29"/></linearGradient><linearGradient id="cityGlass" x2="0" y2="1"><stop stop-color="#8fa9b3" stop-opacity=".6"/><stop offset="1" stop-color="#27444f" stop-opacity=".15"/></linearGradient><radialGradient id="cityGlow"><stop stop-color="#9bffc6" stop-opacity=".6"/><stop offset="1" stop-color="#66cba5" stop-opacity="0"/></radialGradient></defs><path fill="url(#citySky)" d="M0 0h1440v810H0z"/><g opacity=".36" fill="#2a393e"><path d="M100 0h95l-14 810H75zM490 0h70l25 810H470zM1090 0h110l-10 810h-120z"/><path d="M0 280h1440v13H0zM0 530h1440v13H0z"/></g><g fill="#151f24"><path d="M280 0h125l-15 810H242zM895 0h120l32 810H860z"/></g><g fill="url(#cityMetal)" stroke="#739098" stroke-opacity=".35"><path d="M156 195q160-70 320 0v95q-160 55-320 0z"/><ellipse cx="316" cy="195" rx="160" ry="33"/><path d="M156 434q160-70 320 0v95q-160 55-320 0z"/><ellipse cx="316" cy="434" rx="160" ry="33"/><path d="M790 95q170-65 340 0v110q-170 50-340 0z"/><ellipse cx="960" cy="95" rx="170" ry="31"/><path d="M790 350q170-65 340 0v110q-170 50-340 0z"/><ellipse cx="960" cy="350" rx="170" ry="31"/><path d="M790 620q170-65 340 0v100q-170 50-340 0z"/><ellipse cx="960" cy="620" rx="170" ry="31"/></g><g fill="url(#cityGlass)"><path d="M174 215q140-38 283 0v45q-140 35-283 0zM174 456q140-38 283 0v45q-140 35-283 0zM810 112q150-35 300 0v55q-150 35-300 0zM810 374q150-35 300 0v55q-150 35-300 0zM810 640q150-35 300 0v48q-150 35-300 0z"/></g><g stroke="#7a9098" stroke-width="3" opacity=".5"><path d="M220 215v45M282 205v68M350 205v68M413 215v45M855 115v60M922 105v76M992 105v76M1058 115v60M855 375v60M922 365v76M992 365v76M1058 375v60"/></g><g fill="#263d49" stroke="#6b8690" stroke-width="3"><path d="M0 604l790-195v26L0 638zM475 259l965 269v22L475 285z"/></g><g stroke="#8aabb3" stroke-opacity=".7" stroke-width="2"><path d="M0 578l790-196M475 234l965 270"/><path d="M130 549v42M260 516v41M390 483v42M520 451v42M650 418v42M600 269v25M740 306v30M880 346v30M1020 386v30M1160 426v30M1300 466v30"/></g><g stroke="#7a918d" stroke-width="3" opacity=".5"><path d="M491 0v810M518 0v810M1149 0v810M1176 0v810"/></g><g class="scene-elevator"><rect x="486" y="295" width="38" height="60" rx="7" fill="#79949b"/><rect x="492" y="305" width="26" height="32" fill="#b7d4cc" opacity=".7"/></g><g class="scene-elevator reverse"><rect x="1144" y="430" width="38" height="60" rx="7" fill="#738d93"/><rect x="1150" y="440" width="26" height="32" fill="#b7d4cc" opacity=".7"/></g><g class="scene-reactors"><circle cx="430" cy="490" r="100" fill="url(#cityGlow)"/><circle cx="844" cy="398" r="90" fill="url(#cityGlow)"/><path d="M411 510l18-56 18 56zM826 418l18-54 18 54z" fill="#a2b7b5"/><ellipse cx="429" cy="504" rx="20" ry="7" fill="#92f0bd"/><ellipse cx="844" cy="412" rx="19" ry="7" fill="#92f0bd"/></g><g fill="#374d45"><ellipse cx="140" cy="-15" rx="280" ry="115"/><ellipse cx="420" cy="-15" rx="240" ry="90"/><ellipse cx="1180" cy="-20" rx="310" ry="125"/></g><g fill="#49465d" opacity=".8"><ellipse cx="700" cy="-10" rx="220" ry="86"/><ellipse cx="1300" cy="22" rx="170" ry="72"/></g><path d="M0 760q350-85 700 0t740 0v50H0z" fill="#081019"/><path d="M0 740h1440v2H0z" fill="#b3c6ac" opacity=".1"/></svg>`;
  }
  function visual(scene,points,editor=false){
    const asset=api.getAsset(scene.imageKey),src=asset?.url||scene.imageUrl;
    return `<div class="scene-canvas ${scene.motion?'motion':''} ${scene.fog?'fog':''}" style="--scene-accent:${scene.accent};--scene-sky:${scene.sky}"><div class="scene-visual">${src?`<img class="scene-background" src="${esc(src)}" alt="Ambientação de ${esc(scene.title)}">`:artwork(scene.setting)}</div><div class="scene-vignette" aria-hidden="true"></div>${points.map((p,i)=>`<button type="button" class="scene-point ${editor&&i===selected?'selected':''}" data-scene-point="${p.id}" style="left:${p.x}%;top:${p.y}%" aria-label="${editor?'Selecionar ponto: ':'Explorar: '}${esc(p.title)}"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(p.title)}</span></button>`).join('')}</div>`;
  }
  function list(){
    stop();const world=api.getWorld(),completed=api.getProgress().completed.length;
    $('#content').innerHTML=`<section class="world-section"><header class="world-heading"><p class="world-eyebrow">LUGARES PARA ATRAVESSAR</p><h1>Entre no mundo.</h1><p>Olhe de perto. Escolha um detalhe. Deixe o ambiente contar uma parte da história.</p></header><div class="world-entities">${(world.scenes||[]).map(raw=>{const s=S.project(raw,completed);return s.locked?`<article class="world-card locked"><span class="world-card-symbol">◇</span><h2>Um lugar além do horizonte.</h2><p>Abre após a etapa ${s.unlockChapter} da leitura.</p><a class="world-text-link" href="#journey">Continuar a história ↗</a></article>`:`<a class="world-card scene-card" href="#scene/${s.id}"><div class="scene-card-art">${artwork(s.setting)}</div><span class="world-eyebrow">EXPERIÊNCIA EXPLORÁVEL</span><h2>${esc(s.title)}</h2><p>${esc(s.intro)}</p><span class="world-text-link">Entrar neste lugar ↗</span></a>`;}).join('')||'<p class="world-muted">O primeiro lugar está sendo preparado pelo autor.</p>'}</div><div class="world-actions"><a class="world-button ghost" href="#scene-studio">Criar e customizar cenas</a><a class="world-text-link" href="#atlas">Abrir o atlas ↗</a></div></section>`;
  }
  function enter(id){
    stop();const world=api.getWorld(),scene=S.project(world.scenes?.find(s=>s.id===id),api.getProgress().completed.length);
    if(!scene||scene.locked){$('#content').innerHTML='<section class="world-section"><h1>Este lugar ainda está além do horizonte.</h1><p>Avance pela leitura para preservar suas descobertas.</p><a class="world-button gold" href="#journey">Continuar a história</a></section>';return;}
    const key='scene-exploration-'+world.id+'-'+scene.id;
    const raw=api.storage.get(key,[]),seen=new Set(Array.isArray(raw)?raw:[]);
    $('#content').innerHTML=`<section class="world-section scene-reader"><a class="world-text-link" href="#scenes">← Lugares para explorar</a><header class="world-heading"><p class="world-eyebrow">${esc(world.name)} / UMA APROXIMAÇÃO</p><h1>${esc(scene.title)}</h1><p>${esc(scene.intro)}</p></header><div class="scene-reader-tools"><span id="sceneExplored"></span><button id="sceneSound" aria-pressed="false">Ativar som</button><button id="sceneMotion" aria-pressed="${scene.motion}">${scene.motion?'Pausar movimento':'Ativar movimento'}</button></div><div class="scene-reader-layout"><div id="sceneStage">${visual(scene,scene.hotspots)}</div><aside class="scene-story-panel" id="sceneStory" aria-live="polite"><p class="world-eyebrow">SIGA SUA CURIOSIDADE</p><h2>Por onde começar?</h2><p>Toque nos pontos do ambiente. Cada um abre um detalhe que a sua leitura já permite conhecer.</p></aside></div><div class="scene-outro" id="sceneOutro" hidden><p class="world-eyebrow">UM NOVO OLHAR</p><p>${esc(scene.outro)}</p>${api.readingLink()}</div><p class="world-muted scene-art-note">${scene.imageKey||scene.imageUrl?'Imagem escolhida pelo autor.':'Interpretação visual ilustrativa, editável pelo autor; não representa um mapa canônico.'} Som opcional. Os movimentos respeitam as preferências do dispositivo.</p></section>`;
    function update(){const count=scene.hotspots.filter(p=>seen.has(p.id)).length;$('#sceneExplored').textContent=count+' / '+scene.hotspots.length+' detalhes explorados';$('#sceneOutro').hidden=scene.hotspots.length===0||count!==scene.hotspots.length;}
    document.querySelectorAll('[data-scene-point]').forEach(button=>button.onclick=()=>{
      const point=scene.hotspots.find(p=>p.id===button.dataset.scenePoint);seen.add(point.id);
      if(!api.storage.set(key,[...seen]))toast('Exploração disponível apenas nesta sessão.');
      if(point.entityId)api.visitEntity(point.entityId);
      $('#sceneStory').innerHTML=`<p class="world-eyebrow">UM DETALHE DO MUNDO</p><h2>${esc(point.title)}</h2><p>${esc(point.body)}</p>${point.entityId?'<button class="world-button ghost" id="sceneOpenEntity">Abrir ficha relacionada</button>':''}`;
      if($('#sceneOpenEntity'))$('#sceneOpenEntity').onclick=()=>api.openEntity(point.entityId);
      document.querySelectorAll('[data-scene-point]').forEach(b=>b.classList.toggle('selected',b===button));update();
    });
    $('#sceneMotion').onclick=()=>{const enabled=$('.scene-canvas').classList.toggle('motion');$('#sceneMotion').setAttribute('aria-pressed',String(enabled));$('#sceneMotion').textContent=enabled?'Pausar movimento':'Ativar movimento';};
    $('#sceneSound').onclick=async()=>{
      if(audio||synth){stop();return;}
      const epoch=mediaEpoch;
      const src=api.getAsset(scene.audioKey)?.url||scene.audioUrl;
      try{
        if(src){audio=new Audio(src);audio.loop=true;audio.volume=.35;await audio.play();if(epoch!==mediaEpoch)return;}
        else if(scene.sound==='none'){toast('O autor ainda não escolheu um som para este lugar.');return;}
        else{
          synth=new(window.AudioContext||window.webkitAudioContext)();await synth.resume();if(epoch!==mediaEpoch)return;
          const buffer=synth.createBuffer(1,synth.sampleRate*3,synth.sampleRate),data=buffer.getChannelData(0);
          for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.12;
          const source=synth.createBufferSource(),filter=synth.createBiquadFilter(),gain=synth.createGain();
          source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=350;gain.gain.value=.3;
          source.connect(filter);filter.connect(gain);gain.connect(synth.destination);source.start();
          toast('Vento sintetizado de demonstração.');
        }
        if($('#sceneSound')){$('#sceneSound').textContent='Desativar som';$('#sceneSound').setAttribute('aria-pressed','true');}
      }catch{if(epoch===mediaEpoch){stop();toast('Não foi possível reproduzir o som escolhido.');}}
    };update();
  }
  function stageOptions(value){return `<option value="0" ${value===0?'selected':''}>Desde a entrada</option>`+api.getDraft().chapters.map((c,i)=>`<option value="${i+1}" ${value===i+1?'selected':''}>Após ${esc(c.title)}</option>`).join('');}
  function editor(id){
    stop();const world=api.getDraft();current=JSON.parse(JSON.stringify(world.scenes?.find(s=>s.id===id)||(id!=='new'&&world.scenes?.[0])||S.blankScene('scene-'+crypto.randomUUID())));selected=0;dirty=false;
    $('#content').innerHTML=`<section class="world-section scene-editor"><header class="world-heading"><p class="world-eyebrow">ESTÚDIO VISUAL / FERRAMENTAS DO AUTOR</p><h1>Crie um lugar que conta histórias.</h1><p>Escolha a atmosfera, escreva o convite e posicione os detalhes exploráveis. Sua cena funciona com os capítulos e as fichas do seu mundo.</p></header><p class="world-editor-notice">Salve a cena no rascunho. Depois publique a experiência no Estúdio de mundos. Nesta versão, dados e arquivos ficam neste navegador.</p><div class="scene-select-row"><label>Cena em edição<select id="sceneSelect"><option value="">Nova cena</option>${(world.scenes||[]).map(s=>`<option value="${s.id}" ${s.id===current.id?'selected':''}>${esc(s.title)}</option>`).join('')}</select></label><button class="world-button ghost" id="newScene">Criar outra cena</button><a class="world-text-link" href="#world-studio">Publicar a experiência ↗</a></div><form id="sceneForm"><div class="scene-editor-layout"><aside class="world-editor-panel"><h2>A atmosfera</h2><label>Nome da cena<input name="title" value="${esc(current.title)}" required maxlength="160"></label><label>Convite de entrada<textarea name="intro" rows="3" maxlength="4000">${esc(current.intro)}</textarea></label><label>Convite após explorar<textarea name="outro" rows="3" maxlength="4000">${esc(current.outro)}</textarea></label><label>Disponível<select name="unlockChapter">${stageOptions(current.unlockChapter)}</select></label><label>Cenário base<select name="setting"><option value="forest-city">Cidade entre árvores · ilustrativo</option><option value="night-sky">Céu noturno · abstrato</option><option value="mist">Névoa · abstrato</option></select></label><div class="world-form-grid"><label>Cor de destaque<input name="accent" type="color" value="${current.accent}"></label><label>Cor do ambiente<input name="sky" type="color" value="${current.sky}"></label></div><label class="scene-check"><input name="motion" type="checkbox" ${current.motion?'checked':''}> Movimento ambiental</label><label class="scene-check"><input name="fog" type="checkbox" ${current.fog?'checked':''}> Névoa</label><details><summary>Sua imagem e seu som</summary><label>Imagem por HTTPS<input name="imageUrl" type="url" value="${esc(current.imageUrl)}"></label><label>Ou enviar imagem · até 25 MB<input id="sceneImageUpload" type="file" accept="image/*"></label><p id="sceneImageStatus" class="world-muted">${esc(api.getAsset(current.imageKey)?.name||'Sem arquivo próprio')}</p><button type="button" id="clearSceneImage">Usar cenário base</button><label>Som por HTTPS<input name="audioUrl" type="url" value="${esc(current.audioUrl)}"></label><label>Ou enviar áudio · até 25 MB<input id="sceneAudioUpload" type="file" accept="audio/*"></label><p id="sceneAudioStatus" class="world-muted">${esc(api.getAsset(current.audioKey)?.name||'Sem arquivo próprio')}</p><button type="button" id="clearSceneAudio">Remover arquivo de som</button><label>Som sem arquivo<select name="sound"><option value="wind">Vento sintetizado · demonstração</option><option value="none">Silêncio</option></select></label></details><div class="world-actions"><button type="submit" class="world-button gold">Salvar cena no rascunho</button></div></aside><div><div class="scene-editor-preview" id="sceneEditorPreview"></div><p class="world-muted">Selecione um ponto e clique na imagem para reposicioná-lo. Os números são percentuais; a prévia mantém a proporção da cena.</p><div class="scene-select-row"><button type="button" id="addScenePoint">Adicionar ponto de exploração</button><button type="button" id="removeScenePoint">Remover ponto selecionado</button></div><div id="scenePointInspector" class="world-editor-panel"></div></div></div></form></section>`;
    const form=$('#sceneForm');form.elements.setting.value=current.setting;form.elements.sound.value=current.sound||'wind';
    function collect(){
      const previousImage=current.imageUrl,previousAudio=current.audioUrl;
      const f=new FormData(form);for(const key of ['title','intro','outro','setting','accent','sky','imageUrl','audioUrl','sound'])current[key]=String(f.get(key)||'');
      if(current.imageUrl!==previousImage)current.imageKey='';if(current.audioUrl!==previousAudio)current.audioKey='';
      current.unlockChapter=Number(f.get('unlockChapter'));current.motion=f.has('motion');current.fog=f.has('fog');
      const point=current.hotspots[selected];if(point&&form.elements.pointTitle){point.title=String(f.get('pointTitle'));point.body=String(f.get('pointBody'));point.x=Number(f.get('pointX'));point.y=Number(f.get('pointY'));point.unlockChapter=Number(f.get('pointStage'));point.entityId=String(f.get('pointEntity')||'');}
    }
    function preview(){
      $('#sceneEditorPreview').innerHTML=visual(current,current.hotspots,true);
      const canvas=$('#sceneEditorPreview .scene-canvas');
      canvas.onclick=e=>{
        const marker=e.target.closest('[data-scene-point]');if(marker){selected=current.hotspots.findIndex(p=>p.id===marker.dataset.scenePoint);inspector();preview();return;}
        const point=current.hotspots[selected];if(!point)return;
        const rect=canvas.getBoundingClientRect();point.x=Math.round(Math.max(5,Math.min(95,(e.clientX-rect.left)/rect.width*100)));point.y=Math.round(Math.max(5,Math.min(95,(e.clientY-rect.top)/rect.height*100)));dirty=true;inspector();preview();
      };
    }
    function inspector(){
      const p=current.hotspots[selected];$('#removeScenePoint').disabled=!p;
      $('#scenePointInspector').innerHTML=p?`<p class="world-eyebrow">PONTO ${selected+1} / NARRATIVA E DESCOBERTA</p><label>Nome do ponto<input name="pointTitle" maxlength="120" required value="${esc(p.title)}"></label><label>O que acontece ao explorar<textarea name="pointBody" required maxlength="4000" rows="4">${esc(p.body)}</textarea></label><div class="world-form-grid"><label>Posição horizontal (%)<input name="pointX" type="number" min="5" max="95" value="${p.x}" required></label><label>Posição vertical (%)<input name="pointY" type="number" min="5" max="95" value="${p.y}" required></label></div><label>Revelar o ponto<select name="pointStage">${stageOptions(p.unlockChapter)}</select></label><label>Ficha relacionada<select name="pointEntity"><option value="">Sem ficha</option>${world.entities.map(e=>`<option value="${e.id}" ${e.id===p.entityId?'selected':''}>${esc(e.title)}</option>`).join('')}</select></label>`:'<h2>Por onde o leitor vai explorar?</h2><p class="world-muted">Adicione um ponto para conectar o cenário a uma pequena descoberta.</p>';
    }
    form.addEventListener('input',()=>{collect();dirty=true;preview();});
    $('#addScenePoint').onclick=()=>{collect();current.hotspots.push({id:'point-'+crypto.randomUUID(),title:'Novo ponto',body:'Escreva o detalhe que o leitor encontra aqui.',x:50,y:50,unlockChapter:current.unlockChapter,entityId:''});selected=current.hotspots.length-1;dirty=true;inspector();preview();};
    $('#removeScenePoint').onclick=()=>{collect();current.hotspots.splice(selected,1);selected=Math.max(0,selected-1);dirty=true;inspector();preview();};
    $('#sceneSelect').onchange=e=>{if(dirty&&!confirm('Descartar as alterações não salvas desta cena?')){e.target.value=current.id;return;}editor(e.target.value||'new');};
    $('#newScene').onclick=()=>{if(!dirty||confirm('Descartar as alterações não salvas desta cena?'))editor('new');};
    form.onsubmit=e=>{e.preventDefault();collect();if(api.saveScene(current)){dirty=false;$('#sceneSelect').innerHTML='<option value="">Nova cena</option>'+(api.getDraft().scenes||[]).map(s=>`<option value="${s.id}" ${s.id===current.id?'selected':''}>${esc(s.title)}</option>`).join('');toast('Cena salva no rascunho. Publique no Estúdio de mundos para atualizar a experiência.');}};
    for(const [kind,field] of [['image','Image'],['audio','Audio']]){
      $('#scene'+field+'Upload').onchange=async e=>{
        const file=e.target.files[0];if(!file)return;
        pending=true;form.querySelectorAll('button,input[type="file"]').forEach(el=>el.disabled=true);
        try{const key='world-'+crypto.randomUUID()+'-'+kind;await api.putAsset(key,file);current[kind+'Key']=key;dirty=true;$('#scene'+field+'Status').textContent=file.name;preview();toast('Arquivo guardado neste navegador. Salve a cena para manter o vínculo.');}
        catch{toast('Não foi possível guardar o arquivo. A mídia anterior foi mantida.');}
        finally{pending=false;form.querySelectorAll('button,input[type="file"]').forEach(el=>el.disabled=false);$('#removeScenePoint').disabled=!current.hotspots[selected];e.target.value='';}
      };
      $('#clearScene'+field).onclick=()=>{current[kind+'Key']='';current[kind+'Url']='';form.elements[kind+'Url'].value='';$('#scene'+field+'Status').textContent='Sem arquivo próprio';dirty=true;preview();};
    }
    inspector();preview();
  }
  return{list,enter,editor,stop,hasUnsaved:()=>Boolean($('#sceneForm'))&&(dirty||pending),isBusy:()=>pending};
};
