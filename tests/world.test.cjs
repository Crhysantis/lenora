'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../dist/world-core.js');
function fixture(){return{...W.clone(W.DEFAULT_WORLD),chapters:[{id:'ch-1',title:'Capítulo de teste 1',url:'https://example.org/1'},{id:'ch-2',title:'Capítulo de teste 2',url:'https://example.org/2'}],entities:[{id:'secret',kind:'character',title:'Nome reservado',body:'Revelação inicial',unlockChapter:1,layers:[{chapter:2,body:'Revelação posterior'}]}]};}
test('approved scope contains only prologue and chapter 1 with one public introduction',()=>{
  assert.ok(W.validateWorld(W.DEFAULT_WORLD).world);
  assert.deepEqual(W.DEFAULT_WORLD.chapters.map(c=>c.id),['prologue','chapter-1']);
  assert.equal(W.DEFAULT_WORLD.entities.length,15);
  assert.equal(W.discoverable(W.DEFAULT_WORLD,{}).filter(e=>!e.locked).length,1);
  assert.ok(W.DEFAULT_WORLD.chapters.every(c=>c.text.length>4000));
});
test('locked projections omit names, bodies and later revelations',()=>{
  const world=fixture(),locked=W.discoverable(world,{});
  assert.deepEqual(locked,[{id:'secret',locked:true,unlockChapter:1}]);
  const first=W.completeChapter(world,{},'ch-1').progress;
  const projection=JSON.stringify(W.discoverable(world,first));
  assert.ok(projection.includes('Revelação inicial'));assert.ok(!projection.includes('Revelação posterior'));
  const second=W.completeChapter(world,first,'ch-2').progress;
  assert.ok(JSON.stringify(W.discoverable(world,second)).includes('Revelação posterior'));
});
test('reading progression is sequential, persistent-ID based and idempotent',()=>{
  const world=fixture();assert.ok(W.completeChapter(world,{},'ch-2').error);
  const once=W.completeChapter(world,{},'ch-1');
  const twice=W.completeChapter(world,once.progress,'ch-1');
  assert.equal(twice.alreadyCompleted,true);assert.deepEqual(twice.progress,once.progress);
  world.chapters[0].title='Título atualizado';assert.equal(W.normalizeProgress(world,once.progress).completed.length,1);
});
test('visits cannot unlock content or farm points',()=>{
  const world=fixture();assert.deepEqual(W.visit(world,{},'secret').visited,[]);
  let p=W.completeChapter(world,{},'ch-1').progress;p=W.visit(world,p,'secret');p=W.visit(world,p,'secret');
  assert.equal(W.rewards(world,p).points,60);assert.equal(p.visited.length,1);
  assert.equal(W.rewards(world,p).badges.find(b=>b.id==='reader').earned,true);
});
test('invalid progress cannot skip chapters and unknown visits are removed',()=>{
  const p=W.normalizeProgress(fixture(),{completed:['ch-2','unknown'],visited:['secret','unknown']});
  assert.deepEqual(p,{completed:[],visited:[]});
  assert.deepEqual(W.normalizeProgress(fixture(),null),{completed:[],visited:[]});
});
test('editor rejects unsafe links, missing chapters, duplicate IDs and invalid layers',()=>{
  for(const url of ['javascript:alert(1)','http://example.org','https://name:password@example.org','']){
    const world=fixture();world.chapters[0].url=url;assert.ok(W.validateWorld(world).error);
  }
  const missing=fixture();missing.entities[0].unlockChapter=3;assert.ok(W.validateWorld(missing).error);
  const overlap=fixture();overlap.entities[0].id='ch-1';assert.ok(W.validateWorld(overlap).error);
  const early=fixture();early.entities[0].layers[0].chapter=1;assert.ok(W.validateWorld(early).error);
});
test('multiple layers survive validation and are revealed in chapter order',()=>{
  const world=fixture();world.entities[0].unlockChapter=0;world.entities[0].layers.push({chapter:1,body:'Camada um'});
  const result=W.validateWorld(world).world;assert.deepEqual(result.entities[0].layers.map(l=>l.chapter),[1,2]);
});
test('author draft changes do not mutate the published snapshot',()=>{
  const published=fixture(),draft=W.clone(published);draft.entities[0].title='Nome editado';
  assert.equal(published.entities[0].title,'Nome reservado');
});
test('prologue reveals nine discoveries; chapter 1 reveals five and expands four profiles',()=>{
  const world=W.DEFAULT_WORLD,p=W.completeChapter(world,{},'prologue').progress;
  assert.equal(W.discoverable(world,p).filter(e=>!e.locked).length,10);
  const early=W.discoverable(world,p).find(e=>e.id==='gladish');assert.deepEqual(early.layers,[]);
  const done=W.completeChapter(world,p,'chapter-1').progress;
  assert.equal(W.discoverable(world,done).filter(e=>!e.locked).length,15);
  assert.equal(W.discoverable(world,done).filter(e=>e.layers.length).length,4);
});
test('historical uncertainty and reactor details remain scoped to their sources',()=>{
  const world=W.DEFAULT_WORLD,p=W.completeChapter(world,{},'prologue').progress;
  const early=W.discoverable(world,p);
  assert.match(early.find(e=>e.id==='gran-korr').body,/falsificação/);
  assert.match(early.find(e=>e.id==='eras').body,/relato ensinado/);
  assert.ok(!JSON.stringify(early).includes('um metro e meio'));
  const done=W.completeChapter(world,p,'chapter-1').progress;
  assert.match(JSON.stringify(W.discoverable(world,done)),/um metro e meio/);
});
test('old untouched seed upgrades, but customized drafts are preserved',()=>{
  const old={...W.clone(W.DEFAULT_WORLD),chapters:[],entities:[W.clone(W.DEFAULT_WORLD.entities[0])]};
  assert.equal(W.migrateInitialWorld(old).chapters.length,2);
  old.name='Meu rascunho';assert.equal(W.migrateInitialWorld(old).chapters.length,0);
  assert.equal(W.migrateInitialWorld(old).name,'Meu rascunho');
});
test('direct chapter routes cannot skip the prologue and local text needs no external URL',()=>{
  const world=W.DEFAULT_WORLD;
  assert.equal(W.readableChapter(world,{},'chapter-1'),null);
  assert.ok(W.readableChapter(world,{},'prologue').text);
  const p=W.completeChapter(world,{},'prologue').progress;
  assert.ok(W.readableChapter(world,p,'chapter-1').text);
  assert.equal(W.readableChapter(world,p,'missing'),null);
});
