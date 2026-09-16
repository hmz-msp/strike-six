import test from 'node:test';
import assert from 'node:assert/strict';
import {World,movePlayer,DT} from '../dist/shared/engine.js';
test('equipped car drives, steers, exits and survives respawn loadout',()=>{
 const w=new World({spawnProtection:0}),p=w.addPlayer('p','P');Object.assign(p,{x:22,z:20,yaw:0});w.loadout('p',{vehicle:'car'});w.action('p',{type:'vehicle'});assert.equal(p.driving,true);
 for(let i=0;i<60;i++)movePlayer(p,{forward:1,side:0},w.settings,DT);assert.ok(p.z<15);assert.ok(p.carSpeed<=9);const yaw=p.carYaw;movePlayer(p,{forward:1,side:1},w.settings,DT);assert.notEqual(p.carYaw,yaw);
 const ammo=p.inventory.ak47.ammo;w.time=3;w.shoot(p);assert.equal(p.inventory.ak47.ammo,ammo);
 w.action('p',{type:'vehicle'});assert.equal(p.driving,false);w.spawn(p);assert.equal(p.loadout.vehicle,'car');assert.equal(p.driving,false);
});
test('two separate car impacts kill through armor; continuous overlap is one hit',()=>{
 const w=new World({spawnProtection:0}),p=w.addPlayer('p','Driver'),q=w.addPlayer('q','Target');Object.assign(p,{x:22,z:10,driving:true,vx:0,vz:-8});Object.assign(q,{x:22,z:9.4});w.carImpacts();assert.equal(q.hp,50);assert.equal(q.armor,100);
 for(let i=0;i<100;i++)w.carImpacts();assert.equal(q.hp,50);
 p.z=12;w.carImpacts();p.z=10;w.carImpacts();assert.equal(q.hp,0);assert.equal(p.kills,1);
});
test('car respects equipment, wall clearance, spawn protection and team rules',()=>{
 const w=new World({mode:'doubles'}),p=w.addPlayer('p','P',false,1),q=w.addPlayer('q','Q',false,1);w.action('p',{type:'vehicle'});assert.equal(p.driving,false);w.loadout('p',{vehicle:'car'});Object.assign(p,{x:0,z:0});w.action('p',{type:'vehicle'});assert.equal(p.driving,false);
 Object.assign(p,{x:22,z:10,driving:true,vz:-8});Object.assign(q,{x:22,z:9.4});w.carImpacts();assert.equal(q.hp,100);p.carContacts.clear();w.time=4;w.carImpacts();assert.equal(q.hp,100);
});

test('car health persists on exit, absorbs bullets without armor and needs four impacts',()=>{
 const w=new World({spawnProtection:0}),p=w.addPlayer('p','P'),q=w.addPlayer('q','Q');
 Object.assign(p,{x:22,z:10,driving:true,vz:-8});Object.assign(q,{x:22,z:9.4,driving:true});
 for(let i=0;i<4;i++){p.carContacts=new Set();w.carImpacts();assert.equal(q.carHP,200-(i+1)*50);assert.equal(q.hp,i===3?0:100);}assert.equal(p.kills,1);
 w.spawn(q);Object.assign(q,{x:22,z:15,driving:true});w.damage(q,20,p,'car-gun');assert.equal(q.carHP,180);assert.equal(q.armor,100);w.action(q.id,{type:'vehicle'});assert.equal(q.hp,100);w.loadout(q.id,{vehicle:'car'});w.action(q.id,{type:'vehicle'});assert.equal(q.carHP,180);assert.equal(w.snapshot().players.find(v=>v.id==='q').carHP,180);
});
test('mounted gun hits forward, respects cooldown and cover, and preserves ammunition',()=>{
 const w=new World({spawnProtection:0}),p=w.addPlayer('p','P'),q=w.addPlayer('q','Q');Object.assign(p,{x:22,z:20,driving:true,carYaw:0});Object.assign(q,{x:22,z:16,driving:true});
 const ammo=p.inventory[p.weapon].ammo;w.shoot(p);assert.equal(q.carHP,180);w.shoot(p);assert.equal(q.carHP,180);w.time+=.13;w.shoot(p);assert.equal(q.carHP,160);assert.equal(p.inventory[p.weapon].ammo,ammo);
 Object.assign(p,{x:0,z:20});Object.assign(q,{x:0,z:-20});w.time+=.13;w.shoot(p);assert.equal(q.carHP,160);
});
test('car cannot rotate in place; steering reverses in reverse and brakes stop it',()=>{
 const w=new World(),p=w.addPlayer('p','P');Object.assign(p,{x:22,z:20,driving:true,carYaw:0,carSpeed:0});movePlayer(p,{side:1},w.settings,DT);assert.equal(p.carYaw,0);
 movePlayer(p,{forward:1,side:1},w.settings,DT);assert.ok(p.carYaw<0);p.carSpeed=-3;p.carYaw=0;movePlayer(p,{forward:-1,side:1},w.settings,DT);assert.ok(p.carYaw>0);
 p.carSpeed=9;for(let i=0;i<30;i++)movePlayer(p,{walk:true,forward:1},w.settings,DT);assert.equal(p.carSpeed,0);
});
