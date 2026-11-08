const cache=new Map();
export function baseForms(word){
 const forms=[];if(word.endsWith('ies'))forms.push(word.slice(0,-3)+'y');
 if(word.endsWith('es'))forms.push(word.slice(0,-2));
 if(word.endsWith('s')&&!word.endsWith('ss'))forms.push(word.slice(0,-1));
 for(const suffix of ['ing','ed'])if(word.endsWith(suffix)){
  const stem=word.slice(0,-suffix.length);forms.push(stem,stem+'e');
  if(stem.length>2&&stem.at(-1)===stem.at(-2))forms.push(stem.slice(0,-1));
  if(suffix==='ed'&&stem.endsWith('i'))forms.push(stem.slice(0,-1)+'y');
 }
 return [...new Set(forms)].filter(x=>x.length>1);
}
export async function lookupDefinition(input,{signal,fetcher=fetch}={}){
 const word=input.toLowerCase();if(!/^[a-z]{2,15}$/.test(word))throw Error('Choose a suggested word to look up.');
 const letter=word[0];let chunk=cache.get(letter);
 if(!chunk){
  // Only a bundled alphabetic chunk is loaded from this app's own hosting.
  // The selected word, screenshot, rack and board are never sent to a dictionary service.
  const response=await fetcher(`/dictionary/${letter}.json`,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('Could not load the bundled dictionary. Please try again.');
  chunk=await response.json();cache.set(letter,chunk);
 }
 let lemma=word,senses=Object.hasOwn(chunk,word)?chunk[word]:[];
 if(!senses.length)for(const base of baseForms(word)){if(Object.hasOwn(chunk,base)){lemma=base;senses=chunk[base];break;}}
 return {word,lemma,senses:senses.slice(0,4)};
}
