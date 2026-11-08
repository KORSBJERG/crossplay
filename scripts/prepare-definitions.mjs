import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),db=require('wordnet-db');
const chunks=Object.fromEntries([...'abcdefghijklmnopqrstuvwxyz'].map(c=>[c,Object.create(null)]));
let licence='';
for(const type of ['noun','verb','adj','adv']){
 const text=await readFile(`${db.path}/data.${type}`,'utf8');
 if(!licence)licence=text.split('\n').filter(line=>/^\s+\d+ /.test(line)).map(line=>line.replace(/^\s+\d+ /,'')).join('\n');
 for(const line of text.split('\n')){
  if(!/^\d{8} /.test(line))continue;
  const bar=line.indexOf('|');if(bar<0)continue;const parts=line.slice(0,bar).trim().split(/\s+/),count=parseInt(parts[3],16),gloss=line.slice(bar+1).trim();
  const example=gloss.match(/;\s*"([^"]+)"/)?.[1]||'';
  const definition=gloss.replace(/;\s*"[^\"]*"/g,'').trim();
  const sense={partOfSpeech:{noun:'noun',verb:'verb',adj:'adjective',adv:'adverb'}[type],definition,example};
  for(let i=0;i<count;i++){
   const word=parts[4+i*2].replace(/\([a-z]+\)$/,'');
   if(!/^[a-z]{2,15}$/.test(word))continue;
   const entries=chunks[word[0]][word]??=[];
   if(entries.length<4&&!entries.some(x=>x.definition===definition))entries.push(sense);
  }
 }
}
await mkdir('public/dictionary',{recursive:true});
for(const [letter,words] of Object.entries(chunks))await writeFile(`public/dictionary/${letter}.json`,JSON.stringify(words));
await writeFile('public/dictionary/LICENSE.txt',licence+'\n');
console.log(`Bundled WordNet definitions ready: ${Object.values(chunks).reduce((n,chunk)=>n+Object.keys(chunk).length,0).toLocaleString()} words.`);
