'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {validFile,createMediaStore}=require('../dist/media.js');

test('media rejects wrong slot, incompatible type, empty files and oversized uploads',()=>{
  assert.equal(validFile('track',new Blob(['audio'],{type:'audio/wav'})),true);
  assert.equal(validFile('scene',new Blob(['image'],{type:'image/png'})),true);
  assert.equal(validFile('scene',new Blob(['video'],{type:'video/mp4'})),true);
  assert.equal(validFile('track',new Blob(['image'],{type:'image/png'})),false);
  assert.equal(validFile('unknown',new Blob(['a'],{type:'audio/wav'})),false);
  assert.equal(validFile('effect',new Blob([],{type:'audio/wav'})),false);
  assert.equal(validFile('scene',new Blob([new Uint8Array(25*1024*1024+1)],{type:'image/png'})),false);
});

test('unavailable or denied IndexedDB rejects without hanging',async()=>{
  await assert.rejects(createMediaStore().load());
  await assert.rejects(createMediaStore({open(){throw Error('denied');}}).load(),/denied/);
});
test('scene files have independent keys and retain type restrictions',()=>{
  assert.equal(validFile('world-123-image',new Blob(['art'],{type:'image/png'})),true);
  assert.equal(validFile('world-123-audio',new Blob(['sound'],{type:'audio/wav'})),true);
  assert.equal(validFile('world-123-audio',new Blob(['art'],{type:'image/png'})),false);
  assert.equal(validFile('world-../image',new Blob(['art'],{type:'image/png'})),false);
});

test('a successful write request followed by aborted transaction is reported as failure',async()=>{
  const indexedDB={open(){
    const request={};
    queueMicrotask(()=>{
      request.result={transaction(){
        const tx={error:Error('quota exceeded'),objectStore(){return{put(){
          queueMicrotask(()=>tx.onabort());
          return{result:'scene'};
        }}}};
        return tx;
      }};
      request.onsuccess();
    });
    return request;
  }};
  await assert.rejects(createMediaStore(indexedDB).put('scene',new Blob(['a'],{type:'image/png'})),/quota/);
});
