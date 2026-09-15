import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../dist/shared/engine.js';
import {WEAPONS} from '../dist/shared/catalog.js';
import {PerspectiveCamera,Vector3} from '../dist/vendor/three.module.js';

const guns=WEAPONS.filter(w=>!['Utility','Melee'].includes(w.category));
test('all guns fire at the camera center while moving, airborne, crouched, scoped and spraying',()=>{
 for(const gun of guns)for(const stance of ['standing','running','jumping','crouching'])for(const scoped of [false,true]){
  const world=new World({spawnProtection:0}),p=world.addPlayer('p','Player');
  p.weapon=gun.id;p.inventory[gun.id]={ammo:100,reserve:100};
  Object.assign(p,{x:22,z:20,y:stance==='jumping'?2:0,vx:stance==='running'?5:0,vz:stance==='running'?3:0,crouch:stance==='crouching',scope:scoped});
  world.time=2;
  // Noncentral randomness would expose even very small remaining spread.
  world.random=()=>{throw Error('Gun accuracy must not use randomness');};
  for(let n=0;n<16;n++){
   p.yaw=-1.1+n*.14;p.pitch=-.6+n*.07;
   world.time+=gun.interval+.001;world.drain();world.shoot(p);
   const event=world.drain().find(e=>e.type==='shot');
   assert.ok(event,gun.id);assert.equal(event.ends.length,gun.pellets);
   // Match GameView's actual camera convention, including scope magnification.
   const camera=new PerspectiveCamera(scoped&&gun.scope?75/gun.scope:75,16/9,.05,220);
   camera.position.set(p.x,p.y+(p.crouch?1.03:1.62),p.z);
   camera.rotation.set(-p.pitch,p.yaw,0,'YXZ');camera.updateMatrixWorld();
   for(const end of event.ends){
    const screen=new Vector3(...end).project(camera);
    assert.ok(Math.abs(screen.x)<1e-10&&Math.abs(screen.y)<1e-10,`${gun.id} / ${stance} / scoped ${scoped} / shot ${n}: ${screen.x},${screen.y}`);
   }
  }
 }
});
test('off-center enemies are missed; crosshair-aligned enemies are hit at different distances',()=>{
 for(const distance of [3,15,40])for(const offset of [0,1]){
  const world=new World({spawnProtection:0},()=>.9),p=world.addPlayer('p','Player'),q=world.addPlayer('q','Target');
  Object.assign(p,{x:22,z:20,y:0,yaw:0,pitch:0,vx:5,vz:3});Object.assign(q,{x:22-offset,z:20-distance,y:0});
  world.time=2;world.shoot(p);
  assert.equal(q.hp<100,offset===0,`distance ${distance}, offset ${offset}`);
 }
});
