'use strict';
(function(){
  const SLOTS=['track','effect','scene'];
  const MAX_SIZE=25*1024*1024;
  const worldSlot=slot=>/^world-[a-z0-9-]{1,80}-(image|audio)$/.exec(slot);
  function validFile(slot,file){
    const world=worldSlot(slot),valid=SLOTS.includes(slot)||world;
    const type=world?world[1]==='image'?/^image\//:/^audio\//:slot==='scene'?/^(video|image)\//:/^audio\//;
    return Boolean(valid&&file instanceof Blob&&file.size>0&&file.size<=MAX_SIZE&&type.test(file.type));
  }
  function createMediaStore(indexedDB){
    let opening;
    function open(){
      if(opening)return opening;
      opening=new Promise((resolve,reject)=>{
        if(!indexedDB){reject(Error('Armazenamento de mídia indisponível.'));return;}
        let request,expired=false;
        const timer=setTimeout(()=>{expired=true;reject(Error('Armazenamento de mídia bloqueado.'));},3000);
        try{request=indexedDB.open('lenora-media',1);}catch(error){clearTimeout(timer);reject(error);return;}
        request.onupgradeneeded=()=>{
          if(!request.result.objectStoreNames.contains('files'))request.result.createObjectStore('files',{keyPath:'slot'});
        };
        request.onerror=()=>{clearTimeout(timer);reject(request.error);};
        request.onsuccess=()=>{
          clearTimeout(timer);
          const db=request.result;
          if(expired){db.close();return;}
          db.onversionchange=()=>{db.close();opening=null;};
          resolve(db);
        };
      }).catch(error=>{opening=null;throw error;});
      return opening;
    }
    async function transaction(mode,operation){
      const db=await open();
      return new Promise((resolve,reject)=>{
        const tx=db.transaction('files',mode),request=operation(tx.objectStore('files'));
        // A request success can precede a failed commit (for example, quota exhaustion).
        tx.oncomplete=()=>resolve(request.result);
        tx.onabort=()=>reject(tx.error||Error('Não foi possível salvar a mídia.'));
        tx.onerror=()=>{};
      });
    }
    return{
      async load(){
        const records=await transaction('readonly',store=>store.getAll());
        return records.filter(record=>validFile(record.slot,record.blob)&&typeof record.name==='string');
      },
      async put(slot,file){
        if(!validFile(slot,file))throw Error('Escolha um formato compatível de até 25 MB.');
        await transaction('readwrite',store=>store.put({slot,blob:file,name:file.name||'Arquivo do autor'}));
      },
      async remove(slot){
        if(!SLOTS.includes(slot)&&!worldSlot(slot))throw Error('Tipo de mídia inválido.');
        await transaction('readwrite',store=>store.delete(slot));
      }
    };
  }
  const api={createMediaStore,validFile};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else globalThis.LenoraMedia=api;
})();
