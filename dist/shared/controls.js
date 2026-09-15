export const ACTIONS = [
  ['forward','Move forward','KeyW'], ['backward','Move backward','KeyS'],
  ['left','Strafe left','KeyA'], ['right','Strafe right','KeyD'],
  ['jump','Jump','Space'], ['walk','Walk','ShiftLeft'], ['crouch','Crouch','ControlLeft'],
  ['reload','Reload','KeyR'], ['inspect','Inspect weapon','KeyF'],
  ['primary','Primary weapon','Digit1'], ['secondary','Pistol','Digit2'],
  ['knife','Knife','Digit3'], ['utility','Utility','Digit4'],
  ['previous','Previous weapon','KeyQ'], ['drop','Drop weapon','KeyG'],
  ['use','Pick up weapon','KeyE'], ['arsenal','Open loadout','KeyB'],
  ['scoreboard','Hold scoreboard','Tab']
];
export const DEFAULT_BINDINGS = Object.fromEntries(ACTIONS.map(([id,,code])=>[id,code]));
export function bindable(code) {
  return /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Arrow(Up|Down|Left|Right)|Shift(Left|Right)|Control(Left|Right)|Space|Tab|Enter|Backspace|CapsLock|BracketLeft|BracketRight|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|Backquote|Home|End|PageUp|PageDown|Insert|Delete)$/.test(code);
}
export function normalizeBindings(saved={}) {
  const result={...DEFAULT_BINDINGS};
  if (!saved || typeof saved!=='object') return result;
  const used=new Set();
  for(const [id] of ACTIONS) {
    if (!bindable(saved[id]) || used.has(saved[id])) return result;
    used.add(saved[id]);
  }
  return Object.fromEntries(ACTIONS.map(([id])=>[id,saved[id]]));
}
export function rebind(bindings,action,code) {
  if (!(action in DEFAULT_BINDINGS) || !bindable(code)) return null;
  const conflict=Object.keys(bindings).find(id=>id!==action&&bindings[id]===code);
  const previous=bindings[action];bindings[action]=code;
  if(conflict)bindings[conflict]=previous;
  return conflict;
}
export function keyLabel(code) {
  const labels={Space:'Space',Tab:'Tab',ShiftLeft:'Left Shift',ShiftRight:'Right Shift',ControlLeft:'Left Ctrl',ControlRight:'Right Ctrl',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\',Minus:'−',Equal:'=',Backquote:'`',PageUp:'Page Up',PageDown:'Page Down',CapsLock:'Caps Lock'};
  return labels[code] || code.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'Numpad ');
}
export function movementInput(keys,bindings) {
  const held=id=>keys.has(bindings[id]);
  return {forward:+held('forward')-held('backward'),side:+held('right')-held('left'),jump:held('jump'),walk:held('walk'),crouch:held('crouch')};
}
// A shooting click must never request pointer lock again and reset held keys.
export function needsPointerLock(connected,locked,dialogOpen,ended=false) {
  return connected && !locked && !dialogOpen && !ended;
}
