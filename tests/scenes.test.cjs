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
  assert.equal(W.migrateInitialWorld(old).scenes.length,1);
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
