'use strict';
(function(){
const api=(function createLenoraCore(){
  'use strict';
  const DEFAULT_DRAFT={
    title:'O jardim das horas esquecidas',chapter:'A porta que lembrava',
    text:[
      'Naquela tarde, a cidade se esqueceu do próprio nome. As placas continuavam nas esquinas, os mapas continuavam nas gavetas, mas ninguém conseguia ler as letras sem sentir que havia perdido alguma coisa.',
      'Lia chegou à estação carregando uma pequena mala e uma chave que não abria nenhuma porta. Sua avó a deixara junto de uma instrução: quando os relógios pararem, procure o jardim. Ela nunca perguntara qual jardim. Agora já não havia a quem perguntar.',
      'Sob a cobertura de vidro, ouviu três badaladas. O relógio da estação permanecia imóvel. O som vinha de algum lugar abaixo dos trilhos, profundo e paciente, como se esperasse por ela havia muitos anos.',
      'Lia desceu os degraus. Nas paredes, raízes atravessavam nomes de viajantes escritos a lápis. Ela reconheceu a letra da avó em uma única palavra: volte. Continuou, embora já não tivesse certeza de que a mensagem fosse um convite.',
      'No fim da escada, uma porta de pedra se abriu para o céu. Do outro lado havia árvores luminosas, água suspensa e uma lua tão próxima que parecia possível alcançá-la com a mão. A chave ficou quente em seu bolso.',
      'Ela atravessou. A cidade não reapareceu quando olhou para trás. Em seu lugar, a porta mostrava a cozinha da infância: duas xícaras sobre a mesa, uma cadeira vazia e a avó, ainda jovem, esperando que alguém batesse.',
      'Pela primeira vez naquele dia, Lia não procurou uma resposta. Deixou a mala no chão e bateu três vezes. Do outro lado, uma voz perguntou por que ela havia demorado tanto.'
    ].join('\n\n'),
    phrase:'três badaladas',lore:'Lia',loreText:'Uma viajante que herdou uma chave e uma pergunta. Sua ligação com o jardim ainda está sendo descoberta.',
    trackBlock:4,sceneBlock:5,sceneMode:'hover'
  };
  const DEFAULT_PREFS={size:21,night:false,mode:'scroll',effects:'click',track:true,scene:true,sceneAuto:false,sceneAutoplay:false,plain:false};
  const blocks=text=>String(text).split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function validateDraft(input){
    const draft={};
    for(const key of ['title','chapter','text','phrase','lore','loreText'])draft[key]=typeof input?.[key]==='string'?input[key].trim():'';
    draft.trackBlock=Number(input?.trackBlock);draft.sceneBlock=Number(input?.sceneBlock);
    draft.sceneMode=input?.sceneMode==='auto'?'auto':'hover';
    if(!draft.title||!draft.chapter||!draft.text)return{error:'Preencha nome da obra, título do capítulo e texto.'};
    if(draft.text.length>200000)return{error:'Use até 200 mil caracteres neste protótipo.'};
    const count=blocks(draft.text).length;
    for(const key of ['trackBlock','sceneBlock'])if(!Number.isInteger(draft[key])||draft[key]<1||draft[key]>count)return{error:'Escolha um trecho entre 1 e '+count+'.'};
    if(draft.phrase&&!draft.text.includes(draft.phrase))return{error:'A frase do efeito não foi encontrada no texto.'};
    if(draft.lore&&!draft.text.includes(draft.lore))return{error:'O nome da ficha de lore não foi encontrado no texto.'};
    return{draft};
  }
  function normalizePrefs(input={}){
    const p={...DEFAULT_PREFS};
    for(const key of ['night','track','scene','sceneAuto','sceneAutoplay','plain'])if(typeof input?.[key]==='boolean')p[key]=input[key];
    const size=Number(input?.size);if(Number.isFinite(size))p.size=Math.min(30,Math.max(16,size));
    if(['scroll','pages'].includes(input?.mode))p.mode=input.mode;
    if(['click','auto','off'].includes(input?.effects))p.effects=input.effects;
    return p;
  }
  function createStorage(storage){
    const memory=new Map();let failed=false;
    function get(key,fallback){
      if(memory.has(key))return memory.get(key);
      try{
        let raw=storage.getItem('lenora-'+key);
        if(raw===null)raw=storage.getItem('lumera-'+key);
        if(raw!==null){const data=JSON.parse(raw);if(data!==null)return data;}
      }catch{failed=true;}
      return fallback;
    }
    function set(key,value){
      memory.set(key,value);
      try{storage.setItem('lenora-'+key,JSON.stringify(value));return true;}catch{failed=true;return false;}
    }
    return{get,set,hasFailure:()=>failed};
  }
  function interactionSegments(text,draft,plain=false){
    if(plain)return[{text,type:null}];
    const patterns=[{text:draft.phrase,type:'effect'},{text:draft.lore,type:'lore'}].filter(x=>x.text);
    const out=[];let cursor=0;
    while(cursor<text.length){
      const candidates=patterns.map(p=>({...p,index:text.indexOf(p.text,cursor)})).filter(p=>p.index>=0).sort((a,b)=>a.index-b.index||b.text.length-a.text.length);
      const next=candidates[0];
      if(!next){out.push({text:text.slice(cursor),type:null});break;}
      if(next.index>cursor)out.push({text:text.slice(cursor,next.index),type:null});
      out.push({text:next.text,type:next.type});cursor=next.index+next.text.length;
    }
    return out;
  }
  return{DEFAULT_DRAFT,DEFAULT_PREFS,blocks,escapeHTML,validateDraft,normalizePrefs,createStorage,interactionSegments};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else globalThis.LenoraCore=api;
})();
