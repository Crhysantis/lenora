'use strict';
globalThis.createTimelineEditor=function(host,scene,api){
  const {esc,toast}=api,S=LenoraScenes;let selected=0;
  scene.timeline=scene.timeline||[];scene.placements=scene.placements||[];
  const world=api.getDraft(),targets=[['home','Home'],...world.chapters.map(c=>['chapter:'+c.id,'Livro · '+c.title]),...world.entities.map(e=>['entity:'+e.id,(e.kind==='character'?'Personagem':'Descoberta')+' · '+e.title])];
  host.innerHTML=`<div class="world-section-top"><div><p class="world-eyebrow">DIREÇÃO DA CENA</p><h2>Da imagem ao movimento.</h2></div><span class="timeline-total"></span></div><p>Monte uma sequência de imagens e vídeos. Cada plano tem seu tempo, movimento e transição de entrada.</p><label>Importar imagens e vídeos · até 25 MB por arquivo<input type="file" multiple accept="image/*,video/*" data-import></label><div class="world-actions"><button type="button" data-stopmotion>Aplicar stop motion · 8 quadros/s</button><button type="button" data-preview>Prévia e exportação</button></div><div class="timeline-strip" role="group" aria-label="Planos da sequência"></div><div class="timeline-inspector"></div><div class="timeline-preview"></div><hr><h2>Onde essa cena aparece?</h2><p>Você pode usar a mesma cena em mais de um lugar. A etapa de abertura da cena continua sendo respeitada.</p><div class="world-form-grid"><label>Local<select data-target>${targets.map(([id,title])=>`<option value="${esc(id)}">${esc(title)}</option>`).join('')}</select></label><label>Após o parágrafo · 0 para início<input data-after type="number" min="0" max="10000" value="0"></label></div><button type="button" data-place>Adicionar posição</button><ul class="timeline-placements"></ul><p class="world-muted">Sequências são silenciosas; a trilha do lugar continua opcional no botão de som. A exportação WebM é feita em tempo real e depende do suporte do navegador. Arquivos e montagem ficam neste navegador.</p>`;
  const $=s=>host.querySelector(s);
  function changed(){api.changed();render();}
  function render(){
    $('.timeline-total').textContent=scene.timeline.length+' planos · '+scene.timeline.reduce((n,c)=>n+c.duration,0).toFixed(2)+' s';
    $('.timeline-strip').innerHTML=scene.timeline.map((c,i)=>`<button type="button" data-clip="${i}" aria-pressed="${selected===i}"><b>${String(i+1).padStart(2,'0')} ${c.type==='video'?'▶':'▧'}</b><span>${esc(c.name)}</span><small>${c.duration.toFixed(2)} s · ${esc(S.TRANSITIONS[c.transition])}</small></button>`).join('')||'<p class="world-muted">Importe seus arquivos para montar o primeiro plano.</p>';
    host.querySelectorAll('[data-clip]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.clip);render();});
    const c=scene.timeline[selected];
    $('.timeline-inspector').innerHTML=c?`<div class="world-form-grid"><label>Duração do plano (segundos)<input data-duration type="number" min="0.08" max="120" step="0.01" value="${c.duration}"></label><label>Transição de entrada<select data-transition>${Object.entries(S.TRANSITIONS).map(([id,title])=>`<option value="${id}" ${c.transition===id?'selected':''}>${title}</option>`).join('')}</select></label><label>Movimento da imagem<select data-movement>${[['still','Sem movimento'],['in','Aproximar devagar'],['out','Afastar devagar'],['left','Deslocar à esquerda'],['right','Deslocar à direita']].map(([id,title])=>`<option value="${id}" ${c.movement===id?'selected':''}>${title}</option>`).join('')}</select></label>${c.type==='video'?`<label>Início do trecho (segundos)<input data-start type="number" min="0" step="0.01" value="${c.start}"></label>`:''}</div><div class="world-actions"><button type="button" data-before ${selected===0?'disabled':''}>Mover antes</button><button type="button" data-next ${selected===scene.timeline.length-1?'disabled':''}>Mover depois</button><button type="button" data-delete>Remover plano</button></div>`:'';
    for(const key of ['duration','transition','movement','start'])if($('[data-'+key+']'))$('[data-'+key+']').onchange=e=>{c[key]=['duration','start'].includes(key)?Number(e.target.value):e.target.value;api.changed();$('.timeline-total').textContent=scene.timeline.length+' planos · '+scene.timeline.reduce((n,c)=>n+c.duration,0).toFixed(2)+' s';};
    function move(to){[scene.timeline[selected],scene.timeline[to]]=[scene.timeline[to],scene.timeline[selected]];selected=to;changed();}
    if(c){$('[data-before]').onclick=()=>move(selected-1);$('[data-next]').onclick=()=>move(selected+1);$('[data-delete]').onclick=()=>{scene.timeline.splice(selected,1);selected=Math.max(0,selected-1);changed();};}
    $('.timeline-placements').innerHTML=scene.placements.map((p,i)=>`<li>${esc(targets.find(t=>t[0]===p.target)?.[1]||p.target)}${p.target.startsWith('chapter:')?' · após parágrafo '+p.after:''} <button type="button" data-unplace="${i}">Remover posição</button></li>`).join('');
    host.querySelectorAll('[data-unplace]').forEach(b=>b.onclick=()=>{scene.placements.splice(Number(b.dataset.unplace),1);changed();});
  }
  $('[data-target]').onchange=()=>{$('[data-after]').disabled=!$('[data-target]').value.startsWith('chapter:');};$('[data-target]').onchange();
  $('[data-place]').onclick=()=>{const target=$('[data-target]').value,after=target.startsWith('chapter:')?Number($('[data-after]').value):0;if(scene.placements.some(p=>p.target===target))return toast('Esta cena já tem uma posição nesse local. Remova a posição para alterá-la.');const candidate={...scene,placements:[...scene.placements,{target,after}]},result=S.validateScenes([...(world.scenes||[]).filter(s=>s.id!==scene.id),candidate],world);if(result.error)return toast(result.error);scene.placements=candidate.placements;changed();};
  $('[data-stopmotion]').onclick=()=>{scene.timeline.forEach(c=>{if(c.type==='image'){c.duration=.125;c.transition='cut';c.movement='still';}});changed();toast('Imagens ajustadas para 8 quadros por segundo. Você pode editar cada duração.');};
  $('[data-preview]').onclick=()=>{const r=S.validateTimeline(scene.timeline);if(r.error)return toast(r.error);if(!r.clips.length)return toast('Importe pelo menos um plano.');api.preview($('.timeline-preview'),structuredClone(r.clips));};
  $('[data-import]').onchange=async e=>{
    if(api.isBusy())return;const files=[...e.target.files];if(!files.length)return;
    if(files.length+scene.timeline.length>60){toast('Use até 60 planos por cena.');e.target.value='';return;}
    api.busy(true);host.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
    let count=0;
    try{
      for(const file of files){
        const type=file.type.startsWith('video/')?'video':file.type.startsWith('image/')?'image':null;
        if(!type)throw Error('Escolha somente imagens ou vídeos.');
        let duration=3;
        if(type==='video'){
          const v=document.createElement('video'),url=URL.createObjectURL(file);
          try{const d=await LenoraCinema.loadVideo(v,url);if(d<.08)throw Error('Vídeo muito curto: '+file.name);duration=Math.min(3,d);}
          finally{v.removeAttribute('src');v.load();URL.revokeObjectURL(url);}
        }
        const c={id:'clip-'+crypto.randomUUID(),key:'world-'+crypto.randomUUID()+'-'+type,type,name:file.name.slice(0,200),duration,start:0,transition:'cut',movement:'still'};
        const valid=S.validateTimeline([...scene.timeline,c]);if(valid.error)throw Error(valid.error);
        await api.putAsset(c.key,file);scene.timeline.push(c);count++;api.changed();
      }
      toast(count+' arquivo(s) importado(s). Salve a cena para guardar a montagem.');
    }catch(error){toast(error.message+' '+count+' arquivo(s) importado(s) nesta operação.');}
    finally{api.busy(false);host.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);e.target.value='';$('[data-target]').onchange();render();}
  };render();
};
