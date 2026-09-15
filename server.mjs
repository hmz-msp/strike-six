import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {WebSocketServer} from 'ws';
import {World,DT} from './dist/shared/engine.js';
import {MODES} from './dist/shared/catalog.js';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const PASSWORD=process.env.ADMIN_PASSWORD||'pakiboys';
const rooms=new Map(),sessions=new Map(),attempts=new Map();
const limit=Number(process.env.MAX_ROOMS)||20;
const safeEqual=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
async function body(req){let v='';for await(const chunk of req){v+=chunk;if(v.length>16000)throw Error('Request is too large');}return JSON.parse(v||'{}');}
const allowedOrigins=(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean);
const originAllowed=origin=>!origin||!allowedOrigins.length||allowedOrigins.includes(origin);
function admin(req){const token=(req.headers.authorization||'').replace(/^Bearer /,'');const expiry=sessions.get(token);return expiry&&expiry>Date.now();}
const server=http.createServer(async(req,res)=>{try{
 const origin=req.headers.origin;if(origin&&originAllowed(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}if(req.method==='OPTIONS'){res.writeHead(originAllowed(origin)?204:403);return res.end();}
 const url=new URL(req.url,'http://localhost');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 if(url.pathname==='/health')return json(res,200,{ok:true,rooms:rooms.size});
 if(url.pathname==='/api/admin/login'&&req.method==='POST'){if(!originAllowed(origin))return json(res,403,{error:'Origin not allowed'});const ip=req.socket.remoteAddress;let rate=attempts.get(ip);if(!rate||Date.now()-rate.start>60000){rate={start:Date.now(),count:0};attempts.set(ip,rate);}if(++rate.count>8)return json(res,429,{error:'Too many attempts. Try again in a minute.'});const d=await body(req);if(!safeEqual(d.password||'',PASSWORD))return json(res,401,{error:'Incorrect admin password'});const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+3600000);return json(res,200,{token});}
 if(url.pathname.startsWith('/api/admin')){if(!admin(req))return json(res,401,{error:'Sign in to the admin panel'});if(req.method==='GET')return json(res,200,{rooms:[...rooms.values()].map(r=>({code:r.code,settings:r.world.settings,ended:r.world.ended,players:r.world.snapshot().players.map(p=>({id:p.id,name:p.name,team:p.team,kills:p.kills}))}))});const d=await body(req),r=rooms.get(String(d.code).toUpperCase());if(!r)return json(res,404,{error:'Room not found'});if(d.action==='configure')r.world.configure(d.settings||{});else if(d.action==='restart')r.world.restart();else if(d.action==='kick'){const client=[...r.clients].find(c=>c.playerId===d.playerId);if(client)client.close(4001,'Removed by admin');}else return json(res,400,{error:'Unknown action'});return json(res,200,{ok:true});}
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
 const relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);const full=path.resolve(root,relative);if(!full.startsWith(root)||relative.split(/[\\/]/).some(p=>p.startsWith('.')))return json(res,403,{error:'Forbidden'});
 const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json','.md':'text/plain'};try{const bytes=await readFile(full);res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);}catch{return json(res,404,{error:'Not found'});}
 }catch(e){json(res,400,{error:e.message});}});
const wsServer=new WebSocketServer({server,path:'/play',maxPayload:8192,verifyClient:({origin})=>originAllowed(origin)});
function send(ws,data){if(ws.readyState===1&&ws.bufferedAmount<256000)ws.send(JSON.stringify(data));}
wsServer.on('connection',ws=>{ws.playerId=randomBytes(6).toString('hex');ws.alive=true;ws.lastInput=Date.now();ws.msgCount=0;ws.rateAt=Date.now();ws.on('pong',()=>ws.alive=true);const timer=setTimeout(()=>{if(!ws.room)ws.close(4000,'Join timeout');},15000);ws.on('message',raw=>{try{if(Date.now()-ws.rateAt>1000){ws.msgCount=0;ws.rateAt=Date.now();}if(++ws.msgCount>150)return ws.close(4008,'Too many messages');const m=JSON.parse(raw);if(m.type==='ping')return send(ws,{type:'pong',sent:m.sent});if(m.type==='join'&&!ws.room){let r;if(m.create){if(rooms.size>=limit)throw Error('The server is full. Try later.');let code;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));r={code,world:new World(m.settings),clients:new Set()};rooms.set(code,r);}else{r=rooms.get(String(m.code||'').trim().toUpperCase());if(!r)throw Error('Room not found. Check the code and server address.');}r.world.addPlayer(ws.playerId,m.name,false,m.team);r.world.loadout(ws.playerId,m.loadout||{});r.clients.add(ws);ws.room=r;clearTimeout(timer);send(ws,{type:'joined',id:ws.playerId,code:r.code});return;}
 const w=ws.room?.world;if(!w)return;if(m.type==='input'){w.setInput(ws.playerId,m);ws.lastInput=Date.now();}if(m.type==='action')w.action(ws.playerId,m.action||{});if(m.type==='loadout')w.loadout(ws.playerId,m.loadout||{});
 }catch(e){send(ws,{type:'error',message:e.message});}});ws.on('close',()=>{clearTimeout(timer);const r=ws.room;if(r){r.clients.delete(ws);r.world.removePlayer(ws.playerId);if(!r.clients.size)rooms.delete(r.code);}});ws.on('error',()=>{});});
let ticks=0,last=performance.now(),accumulator=0;
setInterval(()=>{const now=performance.now();accumulator+=Math.min(.1,(now-last)/1000);last=now;while(accumulator>=DT){for(const r of rooms.values())r.world.step(DT);accumulator-=DT;ticks++;if(ticks%3===0){for(const r of rooms.values()){const msg={type:'state',code:r.code,...r.world.snapshot(),events:r.world.drain()};for(const c of r.clients){if(Date.now()-c.lastInput>500)r.world.setInput(c.playerId,{});send(c,msg);}}}}},8);
setInterval(()=>{for(const c of wsServer.clients){if(!c.alive){c.terminate();continue;}c.alive=false;c.ping();}for(const [t,expiry] of sessions)if(expiry<Date.now())sessions.delete(t);for(const [ip,r]of attempts)if(Date.now()-r.start>120000)attempts.delete(ip);},15000).unref();
const port=Number(process.env.PORT)||3000;server.listen(port,'0.0.0.0',()=>console.log(`STRIKE / SIX ready at http://localhost:${port}`));
