export function hitFeedback(event,selfId){
 if((event.id!==selfId&&event.attacker!==selfId)||event.damage<=0)return null;
 const incoming=event.id===selfId,damage=Math.max(0,Math.round(event.damage));
 return {incoming,damage,headshot:!!event.head,text:`−${damage} ${event.head?'HEAD':'BODY'}${incoming?' · TAKEN':''}`};
}
