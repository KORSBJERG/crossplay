import {makeLexicon,solve,boardWarnings} from './engine.js';
let lex;
onmessage=async({data})=>{try{if(data.type==='load'){lex=makeLexicon(data.text,data.alphabet);postMessage({type:'ready',count:lex.words.size});}else if(data.type==='solve'){if(!lex)throw Error('Dictionary is still loading.');postMessage({type:'results',id:data.id,moves:solve(data.board,data.rack,lex,data.bonuses,data.values),warnings:boardWarnings(data.board,lex)});}}catch(e){postMessage({type:'error',message:e.message});}};
