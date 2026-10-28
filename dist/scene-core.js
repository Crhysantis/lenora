'use strict';
(function(){
  const ID=/^[a-z0-9-]{1,80}$/;
  const ASSET=/^world-[a-z0-9-]{1,80}-(image|audio|video)$/;
  function url(value){if(!value)return '';try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
  const TRANSITIONS={cut:'Corte seco · stop motion',dissolve:'Dissolver',black:'Passagem pelo escuro',slide:'Deslizar',zoom:'Aproximar'};
  function validateTimeline(input=[]){
    if(!Array.isArray(input)||input.length>60)return{error:'Use até 60 planos por cena.'};
    const clips=[],ids=new Set();
    for(const c of input){
      if(!c||typeof c.id!=='string'||!ID.test(c.id)||ids.has(c.id)||!['image','video'].includes(c.type)||typeof c.name!=='string'||c.name.length>200||!((ASSET.test(c.key||'')&&c.key.endsWith('-'+c.type))||(!c.key&&c.type==='image'&&/^assets\/[a-z0-9-]+\.svg$/.test(c.src||'')))||!Number.isFinite(c.duration)||c.duration<.08||c.duration>120||!Number.isFinite(c.start)||c.start<0||c.start>86400||!Object.hasOwn(TRANSITIONS,c.transition)||!['still','in','out','left','right'].includes(c.movement))return{error:'Revise os planos: mídia válida, duração entre 0,08 e 120 segundos e transição da biblioteca.'};
      ids.add(c.id);clips.push({id:c.id,type:c.type,name:c.name,key:c.key||'',src:c.key?'':c.src,duration:c.duration,start:c.start,transition:c.transition,movement:c.movement});
    }
    if(clips.reduce((n,c)=>n+c.duration,0)>600)return{error:'A sequência pode ter até 10 minutos.'};
    return{clips};
  }
  function frameAt(clips,time){
    let offset=0;for(let i=0;i<clips.length;i++){const c=clips[i];if(time<offset+c.duration||i===clips.length-1)return{index:i,local:Math.max(0,Math.min(c.duration,time-offset)),offset};offset+=c.duration;}return null;
  }
  function validateScenes(input=[],world){
    if(!Array.isArray(input)||input.length>40)return{error:'Use até 40 cenas neste protótipo.'};
    const ids=new Set(),scenes=[];
    const stage=n=>Number.isInteger(n)&&n>=0&&n<=world.chapters.length;
    for(const item of input){
      if(!item||typeof item.id!=='string'||!ID.test(item.id)||ids.has(item.id)||typeof item.title!=='string'||!item.title.trim()||item.title.length>160||!stage(item.unlockChapter))return{error:'Revise o nome e a etapa de abertura da cena.'};
      ids.add(item.id);
      const scene={id:item.id,title:item.title.trim(),unlockChapter:item.unlockChapter};
      for(const key of ['intro','outro']){if(typeof item[key]!=='string'||item[key].length>4000)return{error:'Use até 4 mil caracteres por texto de cena.'};scene[key]=item[key].trim();}
      for(const key of ['imageUrl','audioUrl']){scene[key]=url(item[key]);if(scene[key]===null)return{error:'Use um endereço HTTPS válido para a mídia.'};}
      for(const [key,type] of [['imageKey','image'],['audioKey','audio']]){scene[key]=item[key]||'';if(scene[key]&&(!ASSET.test(scene[key])||!scene[key].endsWith('-'+type)))return{error:'Referência de arquivo inválida.'};}
      for(const key of ['accent','sky']){if(!/^#[0-9a-f]{6}$/i.test(item[key]))return{error:'Escolha cores válidas para o ambiente.'};scene[key]=item[key];}
      scene.mode=item.mode==='map'?'map':'scene';
      scene.setting=['forest-city','night-sky','mist'].includes(item.setting)?item.setting:'mist';
      scene.motion=item.motion!==false;scene.fog=item.fog!==false;
      scene.sound=item.sound==='none'?'none':'wind';
      if(!Array.isArray(item.hotspots)||item.hotspots.length>16)return{error:'Use até 16 pontos de exploração por cena.'};
      scene.hotspots=[];const points=new Set();
      for(const point of item.hotspots){
        if(!point||typeof point.id!=='string')return{error:'Ponto de exploração inválido.'};
        const destination=point.sceneId?input.find(s=>s?.id===point.sceneId):null;
        const entity=point.entityId?world.entities.find(e=>e.id===point.entityId):null;
        if(!ID.test(point.id)||points.has(point.id)||typeof point.title!=='string'||!point.title.trim()||point.title.length>120||typeof point.body!=='string'||!point.body.trim()||point.body.length>4000||!stage(point.unlockChapter)||point.unlockChapter<scene.unlockChapter||![point.x,point.y].every(n=>Number.isFinite(n)&&n>=5&&n<=95)||(point.entityId&&!entity)||(entity&&point.unlockChapter<entity.unlockChapter)||(point.sceneId&&(!destination||destination.id===scene.id||point.unlockChapter<destination.unlockChapter)))return{error:'Revise os pontos: posição entre 5 e 95%, texto e etapa compatível com a ficha vinculada.'};
        points.add(point.id);scene.hotspots.push({id:point.id,title:point.title.trim(),body:point.body.trim(),x:point.x,y:point.y,unlockChapter:point.unlockChapter,entityId:point.entityId||'',sceneId:point.sceneId||''});
      }
      const timeline=validateTimeline(item.timeline);if(timeline.error)return timeline;scene.timeline=timeline.clips;
      if(item.placements!==undefined&&!Array.isArray(item.placements))return{error:'Posições de cena inválidas.'};
      scene.placements=[];const targets=new Set();
      for(const p of item.placements||[]){
        const chapter=world.chapters.find(c=>'chapter:'+c.id===p?.target),entity=world.entities.find(e=>'entity:'+e.id===p?.target);
        if(scene.placements.length>=30||!p||targets.has(p.target)||!(p.target==='home'||chapter||entity)||!Number.isInteger(p.after)||p.after<0||p.after>10000||(!chapter&&p.after!==0)||(chapter&&p.after>(chapter.text||'').split(/\n\s*\n/).filter(Boolean).length))return{error:'Escolha uma posição existente para a cena e um parágrafo válido.'};
        targets.add(p.target);scene.placements.push({target:p.target,after:p.after});
      }
      scenes.push(scene);
    }
    const done=new Set(),visiting=new Set();
    function cycle(id){if(visiting.has(id))return true;if(done.has(id))return false;visiting.add(id);const s=scenes.find(s=>s.id===id);for(const p of s.hotspots)if(p.sceneId&&cycle(p.sceneId))return true;visiting.delete(id);done.add(id);return false;}
    if(scenes.some(s=>cycle(s.id)))return{error:'Os mapas devem avançar entre camadas sem formar ciclos. Use o caminho de volta para subir um nível.'};
    return{scenes};
  }
  function project(scene,completed){
    if(!scene)return null;
    if(scene.unlockChapter>completed)return{id:scene.id,locked:true,unlockChapter:scene.unlockChapter};
    return{...scene,locked:false,hotspots:scene.hotspots.filter(p=>p.unlockChapter<=completed)};
  }
  function blankScene(id='scene-'+Date.now().toString(36)){return{id,title:'Nova cena',intro:'Escreva o convite para entrar neste lugar.',outro:'O que essa descoberta desperta? Convide o leitor a continuar a história.',unlockChapter:0,setting:'mist',accent:'#cdb681',sky:'#11232c',fog:true,motion:true,imageUrl:'',audioUrl:'',imageKey:'',audioKey:'',hotspots:[]};}
  const api={validateScenes,validateTimeline,frameAt,TRANSITIONS,project,blankScene,ASSET};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.LenoraScenes=api;
})();
