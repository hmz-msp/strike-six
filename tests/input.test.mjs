import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../dist/shared/engine.js';
test('a fast click between simulation ticks still fires once',()=>{const w=new World({spawnProtection:0});const p=w.addPlayer('p','Player');w.time=2;w.setInput('p',{fire:true});w.setInput('p',{fire:false});w.step();assert.equal(p.inventory.ak47.ammo,29);w.step();assert.equal(p.inventory.ak47.ammo,29);});
test('non-finite input cannot corrupt world position or aim',()=>{const w=new World();const p=w.addPlayer('p','Player');w.setInput('p',{forward:Infinity,side:NaN,pitch:Infinity,yaw:NaN});w.step();for(const v of [p.x,p.y,p.z,p.yaw,p.pitch])assert.ok(Number.isFinite(v));});
