'use strict';
(function(){
  const ID=/^[a-z0-9-]{1,80}$/;
  const ASSET=/^world-[a-z0-9-]{1,80}-(image|audio)$/;
  function url(value){if(!value)return '';try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
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
      scene.setting=['forest-city','night-sky','mist'].includes(item.setting)?item.setting:'mist';
      scene.motion=item.motion!==false;scene.fog=item.fog!==false;
      scene.sound=item.sound==='none'?'none':'wind';
      if(!Array.isArray(item.hotspots)||item.hotspots.length>16)return{error:'Use até 16 pontos de exploração por cena.'};
      scene.hotspots=[];const points=new Set();
      for(const point of item.hotspots){
        if(!point||typeof point.id!=='string')return{error:'Ponto de exploração inválido.'};
        const entity=point.entityId?world.entities.find(e=>e.id===point.entityId):null;
        if(!ID.test(point.id)||points.has(point.id)||typeof point.title!=='string'||!point.title.trim()||point.title.length>120||typeof point.body!=='string'||!point.body.trim()||point.body.length>4000||!stage(point.unlockChapter)||point.unlockChapter<scene.unlockChapter||![point.x,point.y].every(n=>Number.isFinite(n)&&n>=5&&n<=95)||(point.entityId&&!entity)||(entity&&point.unlockChapter<entity.unlockChapter))return{error:'Revise os pontos: posição entre 5 e 95%, texto e etapa compatível com a ficha vinculada.'};
        points.add(point.id);scene.hotspots.push({id:point.id,title:point.title.trim(),body:point.body.trim(),x:point.x,y:point.y,unlockChapter:point.unlockChapter,entityId:point.entityId||''});
      }
      scenes.push(scene);
    }
    return{scenes};
  }
  function project(scene,completed){
    if(!scene)return null;
    if(scene.unlockChapter>completed)return{id:scene.id,locked:true,unlockChapter:scene.unlockChapter};
    return{...scene,locked:false,hotspots:scene.hotspots.filter(p=>p.unlockChapter<=completed)};
  }
  function blankScene(id='scene-'+Date.now().toString(36)){return{id,title:'Nova cena',intro:'Escreva o convite para entrar neste lugar.',outro:'O que essa descoberta desperta? Convide o leitor a continuar a história.',unlockChapter:0,setting:'mist',accent:'#cdb681',sky:'#11232c',fog:true,motion:true,imageUrl:'',audioUrl:'',imageKey:'',audioKey:'',hotspots:[]};}
  const api={validateScenes,project,blankScene,ASSET};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.LenoraScenes=api;
})();
