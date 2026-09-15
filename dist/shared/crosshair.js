export const DEFAULT_CROSSHAIR={style:'cross',color:'#b6ef53',length:9,thickness:2,gap:6,opacity:1,dot:false,outline:true,dynamic:false};
export function normalizeCrosshair(value={}) {
  const result={...DEFAULT_CROSSHAIR};
  if(!value || typeof value!=='object')return result;
  for(const [key,min,max] of [['length',2,24],['thickness',1,6],['gap',0,20],['opacity',.2,1]])
    if(Number.isFinite(value[key]))result[key]=Math.max(min,Math.min(max,value[key]));
  if(['cross','t','dot'].includes(value.style))result.style=value.style;
  if(/^#[0-9a-f]{6}$/i.test(value.color))result.color=value.color;
  for(const key of ['dot','outline','dynamic'])if(typeof value[key]==='boolean')result[key]=value[key];
  return result;
}
export function applyCrosshair(element,settings,spread=0) {
  element.dataset.style=settings.style;
  element.dataset.dot=String(settings.dot||settings.style==='dot');
  element.style.setProperty('--crosshair',settings.color);
  element.style.setProperty('--ch-length',settings.length+'px');
  element.style.setProperty('--ch-thickness',settings.thickness+'px');
  element.style.setProperty('--ch-gap',(settings.gap+(settings.dynamic?spread:0))+'px');
  element.style.setProperty('--ch-outline',settings.outline?'0 0 1px 1px #000':'none');
  element.style.opacity=settings.opacity;
}
