import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {GameView} from '../dist/view.js';
import {WEAPONS} from '../dist/shared/catalog.js';
test('weapon and avatar models have finite geometry and retain their animation joints',()=>{
 const v=Object.create(GameView.prototype);v.scene=new T.Scene();
 for(const w of WEAPONS){const g=v.makeGun(w.id,true);const b=new T.Box3().setFromObject(g);assert.ok(Number.isFinite(b.min.x)&&Number.isFinite(b.max.z));if(!['Utility','Melee'].includes(w.category))assert.ok(g.userData.muzzle.z<b.max.z);v.disposeGroup(g);}
 const avatar=v.makePlayer({team:1,weapon:'ak47'});assert.equal(avatar.userData.legs.length,2);assert.equal(avatar.userData.arms.length,2);for(const j of avatar.userData.legs)j.rotation.x=.5;assert.ok(new T.Box3().setFromObject(avatar).max.y<2);v.disposeGroup(avatar);
});
test('chase camera frames the whole spy car on open ground and near boundary walls',()=>{
 const v=Object.create(GameView.prototype);v.camera=new T.PerspectiveCamera(65,16/9,.05,220);v.mapId='citadel';
 for(const yaw of [0,Math.PI/2,Math.PI]){const p={x:22,y:0,z:20,carYaw:yaw};v.wasDriving=false;v.updateCarCamera(p,1/60);v.camera.updateMatrixWorld();const car=v.makeCar();car.position.set(p.x,0,p.z);car.rotation.y=yaw;const b=new T.Box3().setFromObject(car);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const point=new T.Vector3(x,y,z).project(v.camera);assert.ok(Math.abs(point.x)<1&&Math.abs(point.y)<1&&point.z<1);}v.disposeGroup(car);}
});
