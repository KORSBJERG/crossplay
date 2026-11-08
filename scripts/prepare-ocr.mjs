import {mkdir,copyFile,readdir,readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url);const target='public/ocr';await mkdir(target,{recursive:true});
const js=path.dirname(require.resolve('tesseract.js/package.json'));const core=path.dirname(require.resolve('tesseract.js-core/package.json'));const data=path.dirname(require.resolve('@tesseract.js-data/eng/package.json'));
await copyFile(path.join(js,'dist/worker.min.js'),target+'/worker.min.js');
for(const name of await readdir(core))if(name.includes('lstm')&&(name.endsWith('.wasm.js')||name.endsWith('.wasm')))await copyFile(path.join(core,name),target+'/'+name);
await copyFile(path.join(data,'4.0.0_best_int/eng.traineddata.gz'),target+'/eng.traineddata.gz');
const dictionaryURL='https://raw.githubusercontent.com/dolph/dictionary/233d25a56b9ac8bef906916ccf091a976995cce0/enable1.txt';
const expected='3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89';
const hash=b=>createHash('sha256').update(b).digest('hex');
let words;try{words=await readFile('public/words.txt');}catch{}
if(!words||hash(words)!==expected){const response=await fetch(dictionaryURL,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Dictionary download failed: '+response.status);words=Buffer.from(await response.arrayBuffer());if(hash(words)!==expected)throw Error('Dictionary checksum mismatch');await writeFile('public/words.txt',words);}
console.log('Local OCR runtime and verified ENABLE dictionary ready.');
