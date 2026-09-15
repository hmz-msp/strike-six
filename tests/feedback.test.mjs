import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {hitFeedback} from '../dist/shared/feedback.js';
import {World} from '../dist/shared/engine.js';
import {normalizeBindings,DEFAULT_BINDINGS} from '../dist/shared/controls.js';
import {normalizeCrosshair,DEFAULT_CROSSHAIR} from '../dist/shared/crosshair.js';
test('headshots reach shooter and victim, but not unrelated players',()=>{
 const e={id:'victim',attacker:'shooter',head:true,damage:80};
 assert.deepEqual(hitFeedback(e,'shooter'),{incoming:false,damage:80,headshot:true,text:'−80 HEAD'});
 assert.deepEqual(hitFeedback(e,'victim'),{incoming:true,damage:80,headshot:true,text:'−80 HEAD · TAKEN'});
 assert.equal(hitFeedback(e,'spectator'),null);
 assert.equal(hitFeedback({...e,head:false},'shooter').text,'−80 BODY');
});
test('hit display uses post-armor damage and caps overkill at remaining health',()=>{
 const w=new World({spawnProtection:0}),a=w.addPlayer('a','A'),b=w.addPlayer('b','B');
 w.damage(b,40,a,'ak47');assert.equal(w.drain().find(e=>e.type==='hit').damage,26);
 w.damage(b,1000,a,'awp',true);const hit=w.drain().find(e=>e.type==='hit');assert.equal(hit.damage,74);assert.equal(hit.head,true);assert.equal(hit.hp,0);
});
test('actual application storage functions restore crosshair and keys in a fresh page context',()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const startup=source.slice(source.indexOf('const $='),source.indexOf('let selectedMap='));
 const data=new Map(),localStorage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null};
 const makePage=()=>{const c=vm.createContext({document:{},localStorage,normalizeBindings,DEFAULT_BINDINGS,normalizeCrosshair,DEFAULT_CROSSHAIR});vm.runInContext(startup,c);return c;};
 const page=makePage();vm.runInContext("bindings.forward='ArrowUp';crosshair.color='#ff0000';crosshair.gap=12;save('ss-bindings',bindings);save('ss-crosshair',crosshair)",page);
 const reloaded=makePage();assert.equal(vm.runInContext('bindings.forward',reloaded),'ArrowUp');assert.equal(vm.runInContext('crosshair.color',reloaded),'#ff0000');assert.equal(vm.runInContext('crosshair.gap',reloaded),12);
});
