import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {World,DT} from '../dist/shared/engine.js';
import {W} from '../dist/shared/catalog.js';
import * as controls from '../dist/shared/controls.js';
import {DEFAULT_CROSSHAIR,normalizeCrosshair,applyCrosshair} from '../dist/shared/crosshair.js';

function snipe(weapon,height=1.15,armor=100,distance=12,settings={}){
 const world=new World({spawnProtection:0,armor,...settings},()=>.5);
 const shooter=world.addPlayer('a','A'),target=world.addPlayer('b','B');
 world.loadout('a',{primary:weapon});world.time=2;
 // Clear sightline down the outer lane, using the real ray/armor calculation.
 Object.assign(shooter,{x:22,y:0,z:20,yaw:0,pitch:Math.atan2(1.62-height,distance),scope:true});
 Object.assign(target,{x:22,y:0,z:20-distance});
 world.shoot(shooter);return {world,shooter,target};
}
test('AWP kills with one armored torso hit at near and far arena distances',()=>{
 for(const armor of [0,100])for(const distance of [5,20,40]){
  const {target,shooter}=snipe('awp',1.15,armor,distance);
  assert.equal(target.hp,0);assert.equal(shooter.inventory.awp.ammo,4);
 }
});
test('AWP leg shots are not lethal; armor remains intact on leg hits',()=>{
 const {target}=snipe('awp',.35);assert.ok(target.hp>0&&target.hp<100);assert.equal(target.armor,100);
});
test('other snipers retain nonlethal torso hits and lethal headshots',()=>{
 for(const weapon of ['ssg08','scar20','g3sg1']){
  assert.ok(snipe(weapon).target.hp>0);assert.equal(snipe(weapon,1.68).target.hp,0);
 }
});
test('AWP still respects spawn protection and custom health',()=>{
 assert.equal(snipe('awp',1.15,100,12,{maxHP:200}).target.hp>0,true);
 const world=new World(),a=world.addPlayer('a','A'),b=world.addPlayer('b','B');
 world.damage(b,W.awp.damage,a,'awp');assert.equal(b.hp,100);
});
test('firing and reloading do not interrupt simulated movement',()=>{
 const positions=[];
 for(const fire of [false,true]){
  const w=new World({spawnProtection:0},()=>.5),p=w.addPlayer('p','P');w.time=2;
  Object.assign(p,{x:22,z:20,yaw:0});w.setInput('p',{forward:1,yaw:0,fire});
  for(let i=0;i<100;i++)w.step(DT);
  positions.push(p.z);if(fire){assert.ok(p.inventory.ak47.ammo<30);w.action('p',{type:'reload'});const z=p.z;for(let i=0;i<10;i++)w.step(DT);assert.ok(p.z<z);}
 }
 assert.equal(positions[0],positions[1]);
});
test('actual click and pointer-lock handlers preserve held movement while shooting',async()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const listeners={},elements={scene:{},resume:{},pause:{},scoreboard:{}};
 let requests=0;elements.scene.requestPointerLock=async()=>{requests++;};
 const document={pointerLockElement:elements.scene,querySelector:()=>null,addEventListener:(name,fn)=>listeners[name]=fn};
 const sent=[],context=vm.createContext({...controls,W,document,$:id=>elements[id],
  addEventListener:(name,fn)=>listeners[name]=fn,message:m=>sent.push(m),audioStart(){},toast(){},renderScoreboard(){},
  pref:{sensitivity:2,scoped:1},view:{},arsenal(){},save(){},renderBindings(){},
  connected:true,mouseEnabled:true,state:{ended:false},keys:new Set(),bindings:{...controls.DEFAULT_BINDINGS},
  firing:false,scope:false,aim:{yaw:0,pitch:0},captureAction:null,local:{weapon:'ak47',inventory:{ak47:{}}},loadout:{primary:'ak47'},lastWeapon:'knife'});
 vm.runInContext(source.slice(source.indexOf('async function lock()'),source.indexOf('function receive(m)')),context);
 vm.runInContext(source.slice(source.indexOf('function input()'),source.indexOf('async function copyRoom()')),context);
 const key=code=>({code,repeat:false,preventDefault(){}});
 listeners.keydown(key('KeyW'));listeners.mousedown({button:0,preventDefault(){}});
 elements.scene.onclick();listeners.pointerlockchange();
 assert.equal(requests,0);assert.equal(context.keys.has('KeyW'),true);assert.equal(context.firing,true);
 assert.equal(sent.at(-1).forward,1);assert.equal(sent.at(-1).fire,true);
 listeners.mouseup({button:0});assert.equal(sent.at(-1).forward,1);assert.equal(sent.at(-1).fire,false);
 listeners.keyup(key('KeyW'));assert.equal(context.keys.size,0);
 // The same handlers use customized controls, including arrows and hold actions.
 controls.rebind(context.bindings,'forward','ArrowUp');controls.rebind(context.bindings,'walk','KeyZ');
 listeners.keydown(key('ArrowUp'));listeners.keydown(key('KeyZ'));listeners.mousedown({button:0,preventDefault(){}});
 assert.equal(sent.at(-1).forward,1);assert.equal(sent.at(-1).walk,true);
 listeners.blur();assert.equal(sent.at(-1).forward,0);assert.equal(sent.at(-1).fire,false);
});
test('conflicting bindings swap and survive save/reload',()=>{
 const b={...controls.DEFAULT_BINDINGS};assert.equal(controls.rebind(b,'forward','KeyS'),'backward');
 const restored=controls.normalizeBindings(JSON.parse(JSON.stringify(b)));
 assert.equal(restored.forward,'KeyS');assert.equal(restored.backward,'KeyW');
 assert.equal(new Set(Object.values(restored)).size,controls.ACTIONS.length);
 assert.equal(controls.bindable('Escape'),false);
});
test('crosshair settings survive reload and apply to preview and gameplay',()=>{
 const custom={...DEFAULT_CROSSHAIR,style:'t',color:'#ffffff',length:18,thickness:4,gap:3,opacity:.6,dot:true,outline:false,dynamic:true};
 const saved=normalizeCrosshair(JSON.parse(JSON.stringify(custom)));assert.deepEqual(saved,custom);
 const props={},element={dataset:{},style:{setProperty:(k,v)=>props[k]=v}};
 applyCrosshair(element,saved,5);assert.equal(props['--ch-gap'],'8px');assert.equal(props['--ch-length'],'18px');assert.equal(element.dataset.dot,'true');assert.equal(element.style.opacity,.6);
});
