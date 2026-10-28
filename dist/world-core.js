'use strict';
(function(){
  const KINDS={world:'Mundo',place:'Lugar',character:'Personagem',people:'Povo',relic:'Vestígio'};
  const content=typeof module!=='undefined'&&module.exports?require('./ayiverni.js'):globalThis.AyiverniContent;
  const DEFAULT_WORLD=content.world;
  const S=typeof module!=='undefined'&&module.exports?require('./scene-core.js'):globalThis.LenoraScenes;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function httpsURL(value){
    if(!value)return '';
    try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
  }
  function validateWorld(input){
    if(!input||typeof input.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(input.id))return{error:'Use um identificador válido para o mundo.'};
    const world={id:input.id};
    for(const key of ['name','book','subtitle','intro']){
      if(typeof input[key]!=='string'||input[key].trim().length>500)return{error:'Revise a apresentação do mundo.'};
      world[key]=input[key].trim();
    }
    if(!world.name||!world.book||!world.intro)return{error:'Preencha nome, livro e apresentação.'};
    if(!Array.isArray(input.chapters)||input.chapters.length>100||!Array.isArray(input.entities)||input.entities.length>500)return{error:'Revise os capítulos e as descobertas.'};
    const ids=new Set();world.chapters=[];world.entities=[];
    function unique(id){if(typeof id!=='string'||!/^[a-z0-9-]{1,80}$/.test(id)||ids.has(id))return false;ids.add(id);return true;}
    for(const c of input.chapters){
      const url=httpsURL(c.url),text=typeof c.text==='string'?c.text:'';
      if(!unique(c.id)||typeof c.title!=='string'||!c.title.trim()||c.title.length>200||url===null||(!url&&!text.trim())||text.length>200000)return{error:'Cada etapa precisa de título e texto ou link HTTPS válido, sem duplicatas.'};
      world.chapters.push({id:c.id,title:c.title.trim(),url,text});
    }
    for(const e of input.entities){
      if(!unique(e.id)||!Object.hasOwn(KINDS,e.kind)||typeof e.title!=='string'||!e.title.trim()||e.title.length>200||typeof e.body!=='string'||!e.body.trim()||e.body.length>12000||!Number.isInteger(e.unlockChapter)||e.unlockChapter<0||e.unlockChapter>world.chapters.length||!Array.isArray(e.layers)||e.layers.length>100)return{error:'Revise título, descrição e capítulo de desbloqueio da descoberta.'};
      const layers=[];
      for(const layer of e.layers){
        if(!Number.isInteger(layer.chapter)||layer.chapter<=e.unlockChapter||layer.chapter>world.chapters.length||typeof layer.body!=='string'||!layer.body.trim()||layer.body.length>12000)return{error:'Uma nova camada deve pertencer a um capítulo posterior à descoberta inicial.'};
        layers.push({chapter:layer.chapter,body:layer.body.trim()});
      }
      world.entities.push({id:e.id,kind:e.kind,title:e.title.trim(),body:e.body.trim(),unlockChapter:e.unlockChapter,layers:layers.sort((a,b)=>a.chapter-b.chapter)});
    }
    const result=S.validateScenes(input.scenes||[],world);if(result.error)return result;
    world.scenes=result.scenes;
    return{world};
  }
  function normalizeProgress(world,input={}){
    const completed=[];
    for(const chapter of world.chapters){if(!Array.isArray(input?.completed)||!input.completed.includes(chapter.id))break;completed.push(chapter.id);}
    const visible=new Set(world.entities.filter(e=>e.unlockChapter<=completed.length).map(e=>e.id));
    const visited=Array.isArray(input?.visited)?[...new Set(input.visited.filter(id=>visible.has(id)))]:[];
    return{completed,visited};
  }
  function migrateInitialWorld(input){
    const world=validateWorld(input).world;
    if(!world)return clone(DEFAULT_WORLD);
    const initial=DEFAULT_WORLD.entities[0];
    if(!Object.hasOwn(input,'scenes')){
      const baseline=validateWorld(DEFAULT_WORLD).world;
      if(JSON.stringify({...world,scenes:[]})===JSON.stringify({...baseline,scenes:[]}))return baseline;
    }
    const untouched=world.chapters.length===0&&world.entities.length===1&&JSON.stringify(world.entities[0])===JSON.stringify(initial)&&['id','name','book','subtitle','intro'].every(key=>world[key]===DEFAULT_WORLD[key]);
    return untouched?clone(DEFAULT_WORLD):world;
  }
  function readableChapter(world,progress,id){
    const p=normalizeProgress(world,progress),index=world.chapters.findIndex(c=>c.id===id);
    return index>=0&&index<=p.completed.length?world.chapters[index]:null;
  }
  function discoverable(world,progress){
    const p=normalizeProgress(world,progress);
    return world.entities.map(e=>e.unlockChapter>p.completed.length?{id:e.id,locked:true,unlockChapter:e.unlockChapter}:{...e,locked:false,layers:e.layers.filter(layer=>layer.chapter<=p.completed.length)});
  }
  function completeChapter(world,progress,id){
    const p=normalizeProgress(world,progress),next=world.chapters[p.completed.length];
    if(p.completed.includes(id))return{progress:p,alreadyCompleted:true};
    if(!next||next.id!==id)return{error:'Conclua os capítulos na ordem da história.'};
    return{progress:{...p,completed:[...p.completed,id]}};
  }
  function visit(world,progress,id){
    const p=normalizeProgress(world,progress);
    if(!discoverable(world,p).some(e=>e.id===id&&!e.locked))return p;
    return{...p,visited:[...new Set([...p.visited,id])]};
  }
  function rewards(world,progress){
    const p=normalizeProgress(world,progress);
    return{points:p.completed.length*50+p.visited.length*10,badges:[
      {id:'arrival',name:'Primeiro contato',description:'Abra sua primeira descoberta.',earned:p.visited.length>=1},
      {id:'reader',name:'Primeiras páginas',description:'Conclua uma etapa da leitura.',earned:p.completed.length>=1},
      {id:'explorer',name:'Além das páginas',description:'Explore cinco descobertas.',earned:p.visited.length>=5}
    ]};
  }
  const api={KINDS,DEFAULT_WORLD,clone,httpsURL,validateWorld,migrateInitialWorld,readableChapter,normalizeProgress,discoverable,completeChapter,visit,rewards};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else globalThis.LenoraWorld=api;
})();
