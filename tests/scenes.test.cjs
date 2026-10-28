'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../dist/world-core.js'),S=require('../dist/scene-core.js');
test('Sahkiz scene opens after prologue and the plaza after chapter 1',()=>{
  const world=W.validateWorld(W.DEFAULT_WORLD).world,scene=world.scenes[0];
  assert.deepEqual(S.project(scene,0),{id:scene.id,locked:true,unlockChapter:1});
  assert.equal(S.project(scene,1).hotspots.length,2);assert.equal(S.project(scene,2).hotspots.length,3);
  assert.ok(!JSON.stringify(S.project(scene,1)).includes('O lugar de uma escolha'));
});
test('closed scenes do not project their narrative or media',()=>{
  const scene=structuredClone(W.DEFAULT_WORLD.scenes[0]);scene.imageUrl='https://example.org/private.jpg';
  const text=JSON.stringify(S.project(scene,0));assert.ok(!text.includes('private.jpg'));assert.ok(!text.includes(scene.intro));
});
test('scene schema validates links, colors, positions and relationships',()=>{
  const world=W.DEFAULT_WORLD;
  for(const change of [s=>s.imageUrl='javascript:alert(1)',s=>s.accent='red;display:none',s=>s.hotspots[0].x=101,s=>s.hotspots[0].entityId='missing',s=>s.hotspots[0].unlockChapter=0]){
    const scene=structuredClone(world.scenes[0]);change(scene);assert.ok(S.validateScenes([scene],world).error);
  }
  const malformed=structuredClone(world.scenes[0]);malformed.hotspots=[null];assert.ok(S.validateScenes([malformed],world).error);
  delete malformed.id;assert.ok(S.validateScenes([malformed],world).error);
});
test('linking a later entity requires the corresponding reading stage',()=>{
  const scene=structuredClone(W.DEFAULT_WORLD.scenes[0]);scene.hotspots[0].entityId='gaari';
  assert.ok(S.validateScenes([scene],W.DEFAULT_WORLD).error);
  scene.hotspots[0].unlockChapter=2;assert.ok(S.validateScenes([scene],W.DEFAULT_WORLD).scenes);
});
test('the same scene model supports original places, text, palettes and assets',()=>{
  const scene=S.blankScene('my-place');scene.title='Um lugar do autor';scene.intro='Uma história própria';scene.imageUrl='https://example.org/my-art.png';scene.accent='#aabbcc';scene.setting='night-sky';scene.sound='none';
  const result=S.validateScenes([scene],{chapters:[],entities:[]}).scenes[0];
  assert.equal(result.title,scene.title);assert.equal(result.intro,scene.intro);assert.equal(result.imageUrl,scene.imageUrl);assert.equal(result.sound,'none');
});
test('published scene copies remain unchanged while editing a draft',()=>{
  const published=W.validateWorld(W.DEFAULT_WORLD).world,draft=W.clone(published);
  draft.scenes[0].hotspots[0].x=75;assert.equal(published.scenes[0].hotspots[0].x,31);
});
test('scene migration enriches an untouched canonical seed and preserves custom worlds',()=>{
  const old=W.clone(W.DEFAULT_WORLD);delete old.scenes;
  assert.equal(W.migrateInitialWorld(old).scenes.length,W.DEFAULT_WORLD.scenes.length);
  old.name='Nome escolhido pelo autor';assert.equal(W.migrateInitialWorld(old).scenes.length,0);
});
test('private media references require known types and safe keys',()=>{
  const scene=S.blankScene('custom');scene.imageKey='world-123-image';
  assert.ok(S.validateScenes([scene],W.DEFAULT_WORLD).scenes);
  scene.audioKey='world-123-image';assert.ok(S.validateScenes([scene],W.DEFAULT_WORLD).error);
});
test('world schema and scene renderer are reusable with another world identity',()=>{
  const world=W.clone(W.DEFAULT_WORLD);world.id='outro-universo';world.name='Um mundo do escritor';
  assert.equal(W.validateWorld(world).world.id,'outro-universo');
});
test('timeline keeps mixed media and rejects corrupt, unsafe and oversized sequences',()=>{
  const clip={id:'first',type:'video',key:'world-123-video',name:'Vídeo',duration:2,start:1,transition:'dissolve',movement:'still'};
  assert.equal(S.validateTimeline([clip]).clips[0].start,1);
  assert.equal(S.validateTimeline([{...clip,type:'image',key:'world-123-image',duration:.125}]).clips[0].duration,.125);
  for(const change of [c=>c.duration=0,c=>c.duration=Infinity,c=>c.start=-1,c=>c.key='world-123-audio',c=>c.transition='unknown',c=>c.movement='x']){const c={...clip};change(c);assert.ok(S.validateTimeline([c]).error);}
  assert.ok(S.validateTimeline([null]).error);assert.ok(S.validateTimeline([clip,clip]).error);
  assert.ok(S.validateTimeline(Array.from({length:61},(_,i)=>({...clip,id:'clip-'+i}))).error);
  assert.ok(S.validateTimeline(Array.from({length:6},(_,i)=>({...clip,id:'clip-'+i,duration:120}))).error);
  assert.ok(S.validateTimeline([{...clip,type:'image',key:'',src:'https://malicious.test/image.svg'}]).error);
});
test('camera timeline selects exact boundaries and holds its final frame',()=>{
  const clips=[{duration:.125},{duration:2},{duration:1}];
  assert.deepEqual(S.frameAt(clips,0),{index:0,local:0,offset:0});
  assert.equal(S.frameAt(clips,.125).index,1);assert.equal(S.frameAt(clips,2.125).index,2);
  assert.equal(S.frameAt(clips,100).local,1);assert.equal(S.frameAt([],0),null);
});
test('placements support home, exact book paragraphs and all kinds of entity',()=>{
  const world=W.DEFAULT_WORLD,scene=structuredClone(world.scenes[0]);
  scene.placements=[{target:'home',after:0},{target:'chapter:prologue',after:2},{target:'entity:gladish',after:0},{target:'entity:sahkiz',after:0}];
  assert.equal(S.validateScenes([scene],world).scenes[0].placements.length,4);
  for(const placement of [null,{target:'chapter:missing',after:0},{target:'entity:missing',after:0},{target:'home',after:1},{target:'chapter:prologue',after:10000},{target:'chapter:prologue',after:-1}]){scene.placements=[placement];assert.ok(S.validateScenes([scene],world).error);}
  scene.placements=[{target:'home',after:0},{target:'home',after:0}];assert.ok(S.validateScenes([scene],world).error);
});
test('closed scenes conceal timeline assets and placements',()=>{
  const scene=W.DEFAULT_WORLD.scenes[0];const result=JSON.stringify(S.project(scene,0));
  assert.ok(!result.includes('assets/'));assert.ok(!result.includes('placements'));
});
test('previous exact scene seed gains the camera study; custom drafts are preserved',()=>{
  const old=W.clone(W.DEFAULT_WORLD);old.scenes=old.scenes.slice(0,1);delete old.scenes[0].timeline;delete old.scenes[0].placements;
  assert.equal(W.migrateInitialWorld(old).scenes[0].timeline.length,3);
  old.scenes[0].intro='Minha própria narrativa';const upgraded=W.migrateInitialWorld(old);
  assert.equal(upgraded.scenes[0].intro,old.scenes[0].intro);assert.equal(upgraded.scenes[0].timeline.length,0);
});
test('nested maps link world, forest, city and scene without leaking locked labels',()=>{
  const world=W.validateWorld(W.DEFAULT_WORLD).world;
  const map=world.scenes.find(s=>s.id==='mapa-ayiverni');
  assert.equal(map.mode,'map');assert.equal(S.project(map,0).hotspots.length,0);
  assert.ok(!JSON.stringify(S.project(map,1)).includes('Floresta Pentateeri'));
  assert.equal(S.project(map,2).hotspots[0].sceneId,'mapa-pentateeri');
  const forest=world.scenes.find(s=>s.id==='mapa-pentateeri');assert.equal(forest.hotspots[0].sceneId,'mapa-sahkiz');
  assert.equal(world.scenes.find(s=>s.id==='mapa-sahkiz').hotspots[0].sceneId,'sahkiz-passarelas');
});
test('map destinations must exist, respect reading gates and form an acyclic graph',()=>{
  for(const change of [w=>w.scenes[1].hotspots[0].sceneId='missing',w=>w.scenes[1].hotspots[0].unlockChapter=0,w=>w.scenes[2].hotspots[0].sceneId='mapa-ayiverni',w=>w.scenes[1].hotspots[0].sceneId='mapa-ayiverni']){
    const world=W.clone(W.DEFAULT_WORLD);change(world);assert.ok(W.validateWorld(world).error);
  }
});
