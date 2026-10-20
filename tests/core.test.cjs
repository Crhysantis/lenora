'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/core.js');
(function defineCoreTests(test,assert,C){
  test('default chapter is valid and has seven passages',()=>{
    assert.equal(C.validateDraft(C.DEFAULT_DRAFT).error,undefined);
    assert.equal(C.blocks(C.DEFAULT_DRAFT.text).length,7);
  });
  test('reject missing anchor and out-of-range passage',()=>{
    assert.ok(C.validateDraft({...C.DEFAULT_DRAFT,phrase:'absent anchor'}).error);
    assert.ok(C.validateDraft({...C.DEFAULT_DRAFT,sceneBlock:8}).error);
    assert.ok(C.validateDraft({...C.DEFAULT_DRAFT,trackBlock:1.5}).error);
    assert.ok(C.validateDraft(null).error);
  });
  test('escape author input and preserve literal text in segments',()=>{
    const raw='<img src=x onerror=alert(1)> & "quote"';
    assert.equal(C.escapeHTML(raw),'&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quote&quot;');
    const segments=C.interactionSegments('Lia ouviu três badaladas.',C.DEFAULT_DRAFT);
    assert.equal(segments.map(s=>s.text).join(''),'Lia ouviu três badaladas.');
    assert.equal(segments.filter(s=>s.type).length,2);
    assert.equal(C.interactionSegments('Lia',C.DEFAULT_DRAFT,true)[0].type,null);
  });
  test('overlapping and identical anchors do not duplicate or lose text',()=>{
    const d={...C.DEFAULT_DRAFT,phrase:'Lia chegou',lore:'Lia'};
    const result=C.interactionSegments('Lia chegou. Lia voltou.',d);
    assert.equal(result.map(s=>s.text).join(''),'Lia chegou. Lia voltou.');
    assert.equal(result[0].type,'effect');
  });
  test('preferences reject invalid enum and clamp font size',()=>{
    const p=C.normalizePrefs({size:100,mode:'invalid',effects:'invalid',sceneAuto:'yes'});
    assert.equal(p.size,30);assert.equal(p.mode,'scroll');assert.equal(p.effects,'click');assert.equal(p.sceneAuto,false);
  });
  test('storage reads legacy values without changing original keys',()=>{
    const map=new Map([['lumera-draft',JSON.stringify(C.DEFAULT_DRAFT)],['lumera-library','1']]);
    const storage=C.createStorage({getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v)});
    assert.equal(storage.get('draft',null).title,C.DEFAULT_DRAFT.title);
    assert.equal(storage.get('library',false),1);
    storage.set('library',false);
    assert.equal(storage.get('library',true),false);
    assert.equal(map.get('lumera-library'),'1');
    assert.equal(map.get('lenora-library'),'false');
  });
  test('blocked and corrupt storage falls back safely',()=>{
    const blocked=C.createStorage({getItem(){throw Error('blocked');},setItem(){throw Error('quota');}});
    assert.equal(blocked.get('progress',0),0);
    assert.equal(blocked.set('progress',3),false);
    assert.equal(blocked.get('progress',0),3);
    const corrupt=C.createStorage({getItem(){return '{bad json';},setItem(){}});
    assert.equal(corrupt.get('draft','fallback'),'fallback');
  });
})(test,assert,C);
