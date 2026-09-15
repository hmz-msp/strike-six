import {mkdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('../dist/vendor/',import.meta.url),{recursive:true});
for(const f of ['three.module.js','three.core.js'])await copyFile(new URL('../node_modules/three/build/'+f,import.meta.url),new URL('../dist/vendor/'+f,import.meta.url));
console.log('Game assets ready.');
