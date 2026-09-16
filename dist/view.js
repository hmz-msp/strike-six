import * as T from './vendor/three.module.js';
import {MAPS,W} from './shared/catalog.js';
import {rayBox} from './shared/engine.js';
const material=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
export class GameView{
 constructor(canvas){this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(75,innerWidth/innerHeight,.05,220);this.camera.rotation.order='YXZ';this.scene.add(this.camera);this.mapGroup=new T.Group();this.scene.add(this.mapGroup);this.players=new Map();this.effectMeshes=new Map();this.dropMeshes=new Map();this.transients=[];this.weaponGroup=new T.Group();this.camera.add(this.weaponGroup);this.light=new T.HemisphereLight(0xd6edff,0x52472f,2.1);this.scene.add(this.light);this.sun=new T.DirectionalLight(0xffe8bd,3.1);this.sun.position.set(-18,36,20);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:100});this.sun.shadow.bias=-.0007;this.scene.add(this.sun);this.resize();addEventListener('resize',()=>this.resize());this.setMap('citadel');this.weaponId='';this.kick=0;this.inspect=0;this.walkPhase=0;}
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
 quality(v){this.renderer.setPixelRatio(v==='low'?1:Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=v!=='low';this.resize();}
 box(group,x,y,z,w,h,d,mat,shadow=true,radius=0){
  if(!radius&&group===this.mapGroup&&Math.min(w,h,d)>.08)radius=Math.min(.12,Math.min(w,h,d)*.18);
  if(!radius&&group.userData.weapon)radius=Math.min(.012,Math.min(w,h,d)*.18);
  let geometry=new T.BoxGeometry(w,h,d);
  if(radius){
   geometry.dispose();geometry=new T.BoxGeometry(1,1,1,4,4,4);
   const pos=geometry.attributes.position,norm=geometry.attributes.normal,half=[w/2,h/2,d/2],r=Math.min(radius,...half.map(v=>v*.9));
   const v=new T.Vector3(),inner=new T.Vector3(),n=new T.Vector3();
   for(let i=0;i<pos.count;i++){
    v.fromBufferAttribute(pos,i);
    for(let j=0;j<3;j++){const t=v.getComponent(j),h=half[j];v.setComponent(j,Math.abs(t)===.5?Math.sign(t)*h:Math.sign(t)*(h-r)*Math.abs(t)*4);inner.setComponent(j,T.MathUtils.clamp(v.getComponent(j),-h+r,h-r));}
    n.copy(v).sub(inner).normalize();v.copy(inner).addScaledVector(n,r);pos.setXYZ(i,v.x,v.y,v.z);norm.setXYZ(i,n.x,n.y,n.z);
   }
  }
  const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;group.add(m);return m;
 }
 cylinder(group,x,y,z,radius,length,mat,rotate=false){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,length,10),mat);m.position.set(x,y,z);if(rotate)m.rotation.x=Math.PI/2;m.castShadow=true;group.add(m);return m;}
 wallTexture(color){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,256,256);for(let y=0;y<256;y+=32){ctx.fillStyle='#00000018';ctx.fillRect(0,y,256,2);for(let x=(y%64?32:0);x<256;x+=64)ctx.fillRect(x,y,1,32);}for(let i=0;i<4000;i++){const v=Math.random()>.5?'#ffffff0c':'#0000000a';ctx.fillStyle=v;ctx.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*3,1+Math.random()*3);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);return t;}
 label(group,text,x,y,z,color='#f0e9d4',ry=0,size=1){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='bold 84px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const texture=new T.CanvasTexture(c);const m=new T.Mesh(new T.PlaneGeometry(4*size,size),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry;group.add(m);return m;}
 disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});group.clear();}
 setMap(id){if(id===this.mapId)return;this.mapId=id;this.disposeGroup(this.mapGroup);const m=MAPS[id];this.scene.background=new T.Color(m.sky);this.scene.fog=new T.Fog(m.sky,38,m.fog);this.sun.color.set(id==='citadel'?0xffe4af:0xe2f2ff);this.light.groundColor.set(m.ground);const wall=new T.MeshStandardMaterial({map:this.wallTexture(m.color),roughness:.94});const stone=material('#c2b693'),crate=material('#826949'),metal=material('#435b64',.56,.45),container=material(id==='harbor'?'#357b85':'#58656a',.65,.3);const mats={wall,stone,crate,metal,container};this.box(this.mapGroup,0,-.2,0,56,.4,56,material(m.ground));
 const floorLine=material(id==='citadel'?'#aa9575':'#adb3a5');for(let n=-24;n<=24;n+=4){this.box(this.mapGroup,n,.005,0,.018,.008,48,floorLine,false);this.box(this.mapGroup,0,.005,n,48,.008,.018,floorLine,false);}
 for(const [i,b]of m.boxes.entries()){const mat=mats[b.kind]||wall;this.box(this.mapGroup,b.x,b.h/2,b.z,b.w,b.h,b.d,mat);if(b.kind==='wall'||b.kind==='stone'){this.box(this.mapGroup,b.x,b.h-.1,b.z,b.w+.15,.22,b.d+.15,material(id==='citadel'?'#ede0bd':'#9cabaa'));if(i>=4&&b.h>=4){const trim=material(id==='citadel'?'#8a7150':'#445b65');for(let x=b.x-b.w/2+.7;x<b.x+b.w/2;x+=2.6){this.box(this.mapGroup,x,b.h*.65,b.z-b.d/2-.025,1.05,1.1,.06,trim);this.box(this.mapGroup,x,b.h*.65,b.z+b.d/2+.025,1.05,1.1,.06,trim);}}}if(b.kind==='crate'){const brace=material('#b09970');for(const zz of [-1,1]){for(const yy of [.15,b.h-.15])this.box(this.mapGroup,b.x,yy,b.z+zz*(b.d/2+.018),b.w,.1,.055,brace);for(const xx of [-1,1])this.box(this.mapGroup,b.x+xx*(b.w/2-.15),b.h/2,b.z+zz*(b.d/2+.04),.12,b.h,.04,brace);}this.label(this.mapGroup,'S / 6',b.x,b.h*.6,b.z+b.d/2+.08,'#ded3ac',0,.3);}if(b.kind==='container'){const rib=material('#286270',.6,.4);for(let z=b.z-b.d/2+.35;z<b.z+b.d/2;z+=.5)for(const sign of [-1,1])this.box(this.mapGroup,b.x+sign*(b.w/2+.03),b.h/2,z,.08,b.h-.15,.07,rib);this.label(this.mapGroup,'STRIKE FREIGHT',b.x,b.h*.6,b.z+b.d/2+.02,'#b2cbcd',0,.7);}if(b.kind==='metal'){const dark=material('#283b43',.5,.6);for(let x=b.x-b.w/2+.2;x<b.x+b.w/2;x+=1)this.box(this.mapGroup,x,b.h/2,b.z+b.d/2+.025,.08,b.h,.045,dark);}}
 const zone=new T.Mesh(new T.RingGeometry(3.8,3.84,64),new T.MeshBasicMaterial({color:id==='citadel'?0xebd293:0xe4ba55,side:T.DoubleSide}));zone.rotation.x=-Math.PI/2;zone.position.set(0,.016,id==='foundry'?10:9);this.mapGroup.add(zone);
 this.label(this.mapGroup,'A',-24+1.05,2.7,-8,'#e1a56b',Math.PI/2,1.25);this.label(this.mapGroup,'B',24-1.05,2.7,8,'#a8c4ce',-Math.PI/2,1.25);
 if(id==='citadel'){const sand=material('#bda17b'),dark=material('#776046');for(let x=-20;x<25;x+=6){this.box(this.mapGroup,x,3.8,-25,1,7.6,2.5,sand);this.box(this.mapGroup,x,7.6,-25,1.25,.3,2.7,sand);}for(const x of [-16,16]){this.cylinder(this.mapGroup,x,7,30,1.2,14,sand);this.cylinder(this.mapGroup,x,14.2,30,1.5,.7,dark);}this.label(this.mapGroup,'CITADEL',0,4.2,-23.96,'#887253',0,1.5);}else if(id==='foundry'){const steel=material('#344a54',.5,.5);for(const x of [-24,24])for(let z=-20;z<=20;z+=10){this.box(this.mapGroup,x,5,z,.7,10,.7,steel);this.box(this.mapGroup,0,10,z,49,.45,.5,steel);}for(const x of [-23,23])this.box(this.mapGroup,x,8.7,0,.4,.4,48,steel);this.label(this.mapGroup,'SECTOR 06',0,4.2,-23.96,'#d5b85c',0,1.5);}else{const steel=material('#cc9248',.6,.4);for(const x of [-18,18]){this.box(this.mapGroup,x,9,-30,1,18,1,steel);this.box(this.mapGroup,0,18,-30,40,1,1,steel);}for(let z=-45;z<40;z+=10)this.box(this.mapGroup,-35,Math.abs(z%7)+3,z,10,6,6,container);this.label(this.mapGroup,'PORT 06',0,4.1,-23.96,'#d7e3df',0,1.5);}
 // Skyline stays outside the collision boundary.
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=40+(i%3)*3,h=5+(i*7%12);this.box(this.mapGroup,Math.cos(a)*r,h/2,Math.sin(a)*r,6,h,7,material(id==='citadel'?'#a89983':'#71888d'));}
 }
 makeGun(id,firstPerson=false){const w=W[id]||W.ak47,g=new T.Group();const black=material('#20292e',.35,.7),metal=material('#46535b',.28,.8),wood=material(id==='ak47'?'#865332':'#303c3c',.65,.1),grip=material('#1b2225');g.userData.weapon=true;if(w.category==='Melee'){const blade=new T.Mesh(new T.ConeGeometry(.04,.42,3),material('#a9bfc5',.2,.9));blade.rotation.x=-Math.PI/2;blade.position.z=-.22;g.add(blade);this.box(g,0,0,.06,.065,.06,.22,grip);this.box(g,0,0,-.05,.16,.035,.025,metal);}else if(w.category==='Utility'){this.cylinder(g,0,0,0,.075,.16,material(id==='molotov'?'#5f673a':'#53633a',.5,.3));this.box(g,0,.09,0,.045,.035,.045,metal);}else{const pistol=w.category==='Pistols',heavy=w.category==='Heavy',sniper=w.category==='Snipers';const length=pistol?.28:sniper?.8:heavy?.68:.58;this.box(g,0,0,-.05,.105,.13,length,black);this.box(g,0,.075,-.04,.08,.028,length*.82,metal);this.cylinder(g,0,.02,-length*.5-.15,pistol?.026:.023,pistol?.16:sniper?.44:.32,metal,true);if(id==='usp'||id==='m4a1s'||id==='mp5')this.cylinder(g,0,.02,-length*.5-.36,.035,.22,black,true);const handle=this.box(g,0,-.13,pistol?.025:.15,.07,.21,.1,grip);handle.rotation.x=-.2;if(!pistol){this.box(g,0,-.02,length*.5+.09,.085,.15,.25,wood);this.box(g,0,0,-length*.32,.13,.15,length*.35,wood);if(id==='ak47'){const shape=new T.Shape();shape.moveTo(-.11,-.06);shape.lineTo(.025,-.06);shape.quadraticCurveTo(.015,-.23,-.095,-.35);shape.lineTo(-.19,-.30);shape.quadraticCurveTo(-.105,-.20,-.11,-.06);const mag=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.074,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,steps:1,curveSegments:8}),black);mag.rotation.y=-Math.PI/2;mag.position.x=.037;g.add(mag);for(let i=0;i<3;i++){const rib=this.box(g,.042,-.15-i*.055,-.04-i*.021,.008,.044,.07,metal);rib.rotation.x=.2+i*.12;}}else this.box(g,0,-.16,-.06,.08,heavy?.22:.26,heavy?.22:.13,metal);}this.box(g,0,.1,-length*.38,.016,.055,.025,black);if(w.scope){this.cylinder(g,0,.16,-.08,.041,.3,black,true);this.cylinder(g,0,.16,-.237,.035,.012,material('#244e61',.1,.8),true);}this.box(g,.065,0,.03,.015,.032,.085,metal);g.userData.muzzle=new T.Vector3(0,.02,-length*.5-(['usp','m4a1s','mp5'].includes(id)?.47:.15+(pistol?.08:sniper?.22:.16)));}
 if(firstPerson&&!['Utility','Melee'].includes(w.category)){
  // Surface details stay in the view model to keep remote avatars inexpensive.
  const steel=material('#72808a',.32,.8),rubber=material('#151c20');
  for(const z of [-.12,.035,.17])this.box(g,.055,.024,z,.006,.012,.014,steel);
  this.box(g,.057,.015,-.035,.008,.045,.105,rubber);this.box(g,.072,.026,.005,.035,.018,.025,metal);
  const guard=new T.Mesh(new T.TorusGeometry(.046,.006,6,12,Math.PI*1.65),black);guard.rotation.y=Math.PI/2;guard.position.set(0,-.12,.11);g.add(guard);
  if(id==='ak47'){
   this.cylinder(g,0,.072,-.34,.027,.21,black,true);
   this.box(g,0,.115,-.485,.066,.045,.034,black);this.box(g,0,.148,-.485,.01,.027,.012,metal);
   this.box(g,0,.094,.105,.074,.026,.033,black);
   for(const z of [-.24,-.205,-.17])for(const x of [-.067,.067])this.box(g,x,.025,z,.005,.018,.021,rubber);
   for(const z of [-.245,-.14])this.box(g,0,0,z,.136,.156,.017,black);
   this.box(g,0,-.02,.50,.091,.158,.024,rubber);
   // Subtle wood grain on the exposed side of the handguard and stock.
   const grain=material('#b17848',.7);for(let i=0;i<3;i++){this.box(g,.066,-.042+i*.026,-.185,.003,.003,.09,grain);this.box(g,.044,-.062+i*.035,.38,.003,.003,.16,grain);}
  }else if(w.category!=='Pistols'){for(let i=0;i<6;i++)this.box(g,0,.096,-.2+i*.043,.085,.012,.015,black);}
  else for(let i=0;i<5;i++)this.box(g,.055,.025,.027+i*.018,.004,.047,.005,steel);
 }
 if(firstPerson){const sleeve=material('#384a42'),glove=material('#635c48');this.box(g,.018,-.23,.16,.105,.19,.14,glove,true,.035);const arm=this.box(g,.12,-.29,.38,.17,.19,.43,sleeve);arm.rotation.y=-.25;if(!['Pistols','Melee','Utility'].includes(w.category)){this.box(g,-.015,-.13,-.18,.13,.09,.13,glove,true,.03);const left=this.box(g,-.22,-.23,.02,.16,.15,.42,sleeve);left.rotation.y=.7;}}
 return g;}
 setWeapon(id){if(this.weaponId===id)return;this.weaponId=id;this.disposeGroup(this.weaponGroup);this.weaponGroup.add(this.makeGun(id,true));this.weaponGroup.position.set(.29,-.26,-.48);this.weaponGroup.scale.setScalar(.58);this.kick=0;}
 damageNumber(p,damage,head){
  if(!p)return;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const c=canvas.getContext('2d');c.textAlign='center';c.font='bold 42px Arial';c.lineWidth=6;c.strokeStyle='#10171b';c.strokeText('-'+damage,128,43);c.fillStyle=head?'#ffb063':'#ffffff';c.fillText('-'+damage,128,43);c.font='bold 24px Arial';c.strokeText(head?'HEAD':'BODY',128,78);c.fillText(head?'HEAD':'BODY',128,78);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false}));sprite.position.set(p.x,p.y+(p.crouch?1.7:2.6),p.z);sprite.scale.set(1.1,.42,1);this.scene.add(sprite);this.transients.push({object:sprite,life:.85,damage:true});
 }
 makeCar(){
  const g=new T.Group(),paint=material('#aebbc5',.26,.75),dark=material('#15232d',.2,.55),rubber=material('#172126'),chrome=material('#73838f',.23,.85);
  this.box(g,0,.38,0,1.08,.30,1.65,paint,true,.13);
  this.box(g,0,.55,-.35,.97,.14,.78,paint,true,.07);
  const cab=this.box(g,0,.69,.22,.84,.30,.74,dark,true,.13);cab.rotation.x=.08;
  this.box(g,0,.84,.27,.70,.06,.43,paint,true,.03);
  this.box(g,0,.35,-.826,.65,.14,.025,dark,true,.035);
  for(let i=0;i<5;i++)this.box(g,0,.30+i*.024,-.844,.57,.006,.01,chrome,false);
  const wheels=[];for(const x of [-.53,.53])for(const z of [-.52,.53]){const wheel=new T.Group();wheel.position.set(x,.23,z);const tire=this.cylinder(wheel,0,0,0,.22,.13,rubber);tire.rotation.z=Math.PI/2;const hub=this.cylinder(wheel,Math.sign(x)*.07,0,0,.15,.015,chrome);hub.rotation.z=Math.PI/2;for(let i=0;i<5;i++){const spoke=this.box(wheel,Math.sign(x)*.083,0,0,.012,.26,.022,dark);spoke.rotation.x=i*Math.PI/5;}g.add(wheel);wheels.push(wheel);}
  for(const x of [-.39,.39]){this.box(g,x,.53,-.78,.23,.04,.07,material('#ecf6ff'),false,.017);this.box(g,x,.49,.81,.23,.033,.025,material('#cd3d49'),false,.01);this.box(g,x*1.36,.69,.03,.12,.055,.10,paint,true,.02);}
  for(const x of [-.23,.23])this.cylinder(g,x,.52,-.76,.025,.19,dark,true);
  g.userData.muzzle=new T.Vector3(-.23,.52,-.86);g.userData.wheels=wheels;return g;
 }
 updateCars(state,dt,local,selfId){
  this.cars??=new Map();const ids=new Set();for(const remote of state.players){const p=remote.id===selfId&&local?local:remote;if(!p.driving||p.hp<=0)continue;ids.add(p.id);let car=this.cars.get(p.id);if(!car){car=this.makeCar();this.cars.set(p.id,car);this.scene.add(car);}car.position.set(p.x,p.y,p.z);car.rotation.y=p.carYaw??p.yaw;for(const wheel of car.userData.wheels)wheel.rotation.x+=dt*(p.carSpeed||0)/.24;}
  for(const [id,car]of this.cars)if(!ids.has(id)){car.removeFromParent();this.disposeGroup(car);this.cars.delete(id);}
 }
 makePlayer(p){const g=new T.Group(),bodyMat=material(p.team===2?'#b69059':'#566d75'),armor=material('#263942'),skin=material('#c8a18c'),hair=material('#33262c'),boots=material('#202a2e');const round=(...args)=>this.box(g,...args,true,.09);round(0,.98,0,.32,.25,.25,skin);round(0,1.20,0,.43,.29,.29,bodyMat);round(0,.81,0,.43,.23,.31,bodyMat);round(0,.88,-.015,.44,.045,.32,armor);round(0,1.24,-.15,.24,.14,.035,armor);for(const x of [-.15,.15])round(x,1.33,0,.065,.10,.27,armor);for(const [y,w,h,d,mat]of [[1.62,.34,.38,.32,skin],[1.77,.38,.17,.36,hair]]){const head=new T.Mesh(new T.SphereGeometry(1,12,8),mat);head.position.set(0,y,0);head.scale.set(w/2,h/2,d/2);head.castShadow=true;head.receiveShadow=true;g.add(head);}const feature=(x,y,z,w,h,d,mat)=>{const m=new T.Mesh(new T.SphereGeometry(1,10,6),mat);m.position.set(x,y,z);m.scale.set(w/2,h/2,d/2);m.castShadow=true;g.add(m);};feature(0,1.57,.19,.17,.4,.18,hair);feature(0,1.62,-.17,.045,.065,.05,skin);for(const x of [-.065,.065]){feature(x,1.675,-.147,.065,.035,.024,material('#ece5de'));feature(x,1.675,-.166,.026,.026,.015,boots);}feature(0,1.565,-.151,.07,.022,.016,material('#a36568'));const legs=[];for(const x of [-.15,.15]){const leg=round(x,.43,0,.19,.76,.21,skin);const shorts=this.box(leg,0,.29,0,.22,.24,.25,bodyMat,true,.05);legs.push(leg);round(x,.13,-.04,.22,.26,.30,boots);}const arms=[];for(const x of [-.36,.36]){const a=round(x,1.03,-.12,.155,.5,.18,skin);a.rotation.x=-.35;arms.push(a);}const gun=this.makeGun(p.weapon);gun.position.set(.19,1.05,-.43);g.add(gun);const pivot=(mesh,y)=>{const joint=new T.Group();joint.position.set(mesh.position.x,y,mesh.position.z);mesh.position.sub(joint.position);g.remove(mesh);joint.add(mesh);g.add(joint);return joint;};
 const legJoints=legs.map(leg=>{const joint=pivot(leg,.85);const boot=g.children.find(m=>m.isMesh&&m.material===boots&&Math.abs(m.position.x-joint.position.x)<.01&&m.position.y<.2);if(boot){boot.position.sub(joint.position);g.remove(boot);joint.add(boot);}return joint;});
 const armJoints=arms.map(arm=>pivot(arm,1.28));
 g.userData={legs:legJoints,arms:armJoints,gun,weapon:p.weapon,phase:0,kick:0};this.scene.add(g);return g;}
 updatePlayers(state,selfId,dt){const ids=new Set;for(const p of state.players){if(p.id===selfId)continue;ids.add(p.id);let g=this.players.get(p.id);if(!g){g=this.makePlayer(p);g.position.set(p.x,p.y,p.z);this.players.set(p.id,g);}g.visible=p.hp>0&&!p.driving;g.position.lerp(new T.Vector3(p.x,p.y,p.z),Math.min(1,dt*18));g.rotation.y+=Math.atan2(Math.sin(p.yaw-g.rotation.y),Math.cos(p.yaw-g.rotation.y))*Math.min(1,dt*18);g.scale.y+=( (p.crouch?.7:1)-g.scale.y)*Math.min(1,dt*15);const speed=Math.hypot(p.vx,p.vz),u=g.userData;u.phase+=dt*speed*2.3;u.kick*=Math.exp(-dt*16);
 const stride=Math.min(.55,speed*.11);u.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(u.phase+i*Math.PI)*stride;leg.rotation.z=Math.sin(u.phase)*Math.min(.07,speed*.015);});
 u.arms.forEach((arm,i)=>{arm.rotation.x=-.18-p.pitch*.65+Math.sin(u.phase+i*Math.PI)*stride*.18-u.kick;});
 u.gun.rotation.x=-p.pitch+u.kick;u.gun.position.y=1.05+Math.sin(state.time*2.5)*.006+Math.sin(u.phase*2)*stride*.025;u.gun.position.z=-.43+u.kick*.25;
 g.rotation.z=Math.sin(u.phase)*stride*.035;if(g.userData.weapon!==p.weapon){g.remove(g.userData.gun);this.disposeGroup(g.userData.gun);const gun=this.makeGun(p.weapon);gun.position.set(.19,1.05,-.43);g.add(gun);g.userData.gun=gun;g.userData.weapon=p.weapon;}}
 for(const [id,g]of this.players)if(!ids.has(id)){this.scene.remove(g);this.disposeGroup(g);this.players.delete(id);}}
 updateEffects(state){const ids=new Set;for(const e of state.effects){ids.add(e.id);let mesh=this.effectMeshes.get(e.id);if(mesh&&mesh.userData.active!==e.active){this.scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();this.effectMeshes.delete(e.id);mesh=null;}if(!mesh){if(!e.active)mesh=new T.Mesh(new T.SphereGeometry(.11,8,8),material('#586c45'));else if(e.type==='smoke')mesh=new T.Mesh(new T.SphereGeometry(4.3,20,14),new T.MeshBasicMaterial({color:'#99a19f',transparent:true,opacity:.93,side:T.DoubleSide,depthWrite:false}));else if(e.type==='molotov'){mesh=new T.Mesh(new T.CylinderGeometry(3.4,3.4,.3,28),new T.MeshBasicMaterial({color:'#ff802a',transparent:true,opacity:.7}));}else mesh=new T.Mesh(new T.SphereGeometry(e.type==='he'?2:.3,12,8),new T.MeshBasicMaterial({color:'#ffc46c',transparent:true,opacity:.7}));mesh.userData.active=e.active;this.effectMeshes.set(e.id,mesh);this.scene.add(mesh);}mesh.position.set(e.x,e.type==='smoke'&&e.active?2:e.y,e.z);if(e.active&&e.type==='molotov')mesh.scale.y=1+Math.sin(state.time*18)*.4;}
 for(const [id,m]of this.effectMeshes)if(!ids.has(id)){this.scene.remove(m);m.geometry.dispose();m.material.dispose();this.effectMeshes.delete(id);}const drops=new Set;for(const d of state.drops){drops.add(d.id);let g=this.dropMeshes.get(d.id);if(!g){g=this.makeGun(d.weapon);this.scene.add(g);this.dropMeshes.set(d.id,g);}g.position.set(d.x,.23,d.z);g.rotation.z=Math.PI/2;}for(const[id,g]of this.dropMeshes)if(!drops.has(id)){this.scene.remove(g);this.disposeGroup(g);this.dropMeshes.delete(id);}}
 shot(e,selfId){
  if(['Utility','Melee'].includes(W[e.weapon]?.category))return;
  const own=e.id===selfId,car=e.weapon==='car-gun',gun=car?this.cars?.get(e.id):own?this.weaponGroup.children[0]:this.players.get(e.id)?.userData.gun;
  const visible=gun&&gun.userData.muzzle&&(car||!own||this.weaponGroup.visible);
  if(own&&!car)this.kick=W[e.weapon]?.category==='Snipers'?.095:W[e.weapon]?.category==='Pistols'?.06:.045;else if(this.players.has(e.id))this.players.get(e.id).userData.kick=.12;
  let origin=new T.Vector3(...e.origin);
  if(visible){gun.updateWorldMatrix(true,false);origin=gun.localToWorld(gun.userData.muzzle.clone());
   const flash=new T.Mesh(new T.SphereGeometry(.045,8,6),new T.MeshBasicMaterial({color:0xffdf93,transparent:true,opacity:.9,depthWrite:false}));
   flash.scale.set(.7,.7,2.8);flash.position.copy(gun.userData.muzzle);gun.add(flash);this.transients.push({object:flash,life:.045,flash:true});
  }
  for(const end of e.ends.slice(0,4)){
   const geo=new T.BufferGeometry().setFromPoints([origin,new T.Vector3(...end)]);
   const line=new T.Line(geo,new T.LineBasicMaterial({color:0xffde93,transparent:true,opacity:.65}));this.scene.add(line);this.transients.push({object:line,life:.055,muzzle:visible?gun:null});
   const impact=new T.Mesh(new T.SphereGeometry(.045,5,4),new T.MeshBasicMaterial({color:0xffdd8b}));impact.position.set(...end);this.scene.add(impact);this.transients.push({object:impact,life:.12});
  }
 }
 clear(){this.wasDriving=false;for(const car of this.cars?.values()||[]){car.removeFromParent();this.disposeGroup(car);}this.cars?.clear();for(const t of this.transients){t.object.removeFromParent();t.object.geometry?.dispose();t.object.material.map?.dispose();t.object.material.dispose();}this.transients=[];for(const g of this.players.values()){this.scene.remove(g);this.disposeGroup(g);}this.players.clear();for(const m of this.effectMeshes.values()){this.scene.remove(m);m.geometry.dispose();m.material.dispose();}this.effectMeshes.clear();for(const g of this.dropMeshes.values()){this.scene.remove(g);this.disposeGroup(g);}this.dropMeshes.clear();}
 updateCarCamera(local,dt){
  const yaw=local.carYaw??local.yaw,target=new T.Vector3(local.x,local.y+.55,local.z),desired=new T.Vector3(local.x+Math.sin(yaw)*4.2,local.y+3.1,local.z+Math.cos(yaw)*4.2);
  if(!this.wasDriving)this.camera.position.copy(desired);else this.camera.position.lerp(desired,1-Math.exp(-dt*10));
  const offset=this.camera.position.clone().sub(target),length=offset.length(),direction=offset.clone().normalize();
  const obstruction=MAPS[this.mapId].boxes.some(b=>rayBox(target.toArray(),direction.toArray(),[b.x-b.w/2-.2,-.2,b.z-b.d/2-.2],[b.x+b.w/2+.2,b.h+.2,b.z+b.d/2+.2])<length);
  if(obstruction)this.camera.position.set(local.x,local.y+4.5,local.z+.01);
  this.camera.lookAt(target);this.wasDriving=true;
 }
 render(dt,time,local,state,selfId,aim,reloading){if(!local){this.weaponGroup.visible=false;const a=.7+Math.sin(time*.04)*.13;this.camera.position.set(Math.sin(a)*21,13,Math.cos(a)*21);this.camera.lookAt(-2,1,-3);this.camera.fov=62;this.camera.updateProjectionMatrix();}else{this.setWeapon(local.weapon);this.weaponGroup.visible=local.hp>0&&!local.scope&&!local.driving;if(local.driving){this.updateCarCamera(local,dt);}else{this.wasDriving=false;this.camera.position.set(local.x,local.y+(local.crouch?1.03:1.62),local.z);this.camera.rotation.set(-aim.pitch,aim.yaw,0,'YXZ');}const target=local.driving?65:local.scope&&W[local.weapon].scope?75/W[local.weapon].scope:75;this.camera.fov+=(target-this.camera.fov)*Math.min(1,dt*18);this.camera.updateProjectionMatrix();this.kick*=Math.exp(-dt*18);this.walkPhase+=dt*Math.hypot(local.vx||0,local.vz||0)*2.7;this.inspect=Math.max(0,this.inspect-dt);const bob=Math.min(.01,Math.hypot(local.vx||0,local.vz||0)*.003);this.weaponGroup.position.set(.28+Math.cos(this.walkPhase*.5)*bob,-.25+Math.sin(this.walkPhase)*bob-(reloading?.10:0),-.62+this.kick);this.weaponGroup.rotation.set(this.kick*1.2+(reloading?-.3:0),this.inspect>0?.6*Math.sin(this.inspect*Math.PI/2):0,reloading?-.4:this.inspect>0?-.35:0);if(state){this.updateCars(state,dt,local,selfId);this.updatePlayers(state,selfId,dt);this.updateEffects(state);}}
 for(const t of this.transients){if(t.flash){t.object.scale.multiplyScalar(Math.exp(-dt*22));t.object.material.opacity=Math.max(0,t.life/.045);}if(t.damage){t.object.position.y+=dt*.7;t.object.material.opacity=Math.min(1,t.life/.3);}if(t.muzzle?.parent){t.muzzle.updateWorldMatrix(true,false);const p=t.muzzle.localToWorld(t.muzzle.userData.muzzle.clone());t.object.geometry.attributes.position.setXYZ(0,p.x,p.y,p.z);t.object.geometry.attributes.position.needsUpdate=true;}t.life-=dt;if(t.life<=0){t.object.removeFromParent();t.object.geometry?.dispose();t.object.material.map?.dispose();t.object.material.dispose();}}this.transients=this.transients.filter(t=>t.life>0);this.renderer.render(this.scene,this.camera);}
}

const sketchCache=new Map();
export function weaponSketch(id){
 if(sketchCache.has(id))return sketchCache.get(id);
 const gun=id==='car'?GameView.prototype.makeCar.call(GameView.prototype):GameView.prototype.makeGun.call(GameView.prototype,id,false);
 gun.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(gun),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
 const canvas=document.createElement('canvas');canvas.width=360;canvas.height=204;
 const c=canvas.getContext('2d'),scale=Math.min(320/Math.max(size.z,.1),164/Math.max(size.y,.1));
 c.strokeStyle='#cbd9ce';c.lineWidth=2.2;c.lineJoin='round';c.lineCap='round';
 gun.traverse(mesh=>{if(!mesh.isMesh)return;const edges=new T.EdgesGeometry(mesh.geometry,25),points=edges.attributes.position;
  c.beginPath();for(let i=0;i<points.count;i+=2){for(let j=0;j<2;j++){const p=new T.Vector3().fromBufferAttribute(points,i+j).applyMatrix4(mesh.matrixWorld);const x=180-(p.z-center.z)*scale,y=102-(p.y-center.y)*scale;if(j)c.lineTo(x,y);else c.moveTo(x,y);}}c.stroke();edges.dispose();
 });
 GameView.prototype.disposeGroup(gun);
 const url=canvas.toDataURL('image/png');sketchCache.set(id,url);return url;
}
