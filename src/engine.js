export const VALUES={A:1,B:4,C:3,D:2,E:1,F:4,G:4,H:3,I:1,J:10,K:6,L:2,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:2,V:6,W:5,X:8,Y:4,Z:10};
export const BONUS=[
'3L . . 3W . . . 2L . . . 3W . . 3L',
'. 2W . . . . 3L . 3L . . . . . .',
'. . . . 2L . . . . . 2L . . . .',
'3W . . 2L . . . 2W . . . 2L . . 3W',
'. . 2L . . . . . . 3L . . . . .',
'. . . . 3L . . 2L . . . . . . .',
'. 3L . . . . . . . . . . . 3L .',
'2L . . . . . . . . 2L . . . . 2L',
'. . . . . . . . . . . . . . .',
'. . . . 3L . . . . . . . . . .',
'. . 2L . . . . . . 3L . . 2L . .',
'. . . 2L . . . . . . . 2L . . 3W',
'. . . . 2L . . . . . 2L . . . .',
'. . . . . . . . 3L . . . . 2W .',
'3L . . 3W . . . 2L . . . 3W . . 3L'].flatMap(x=>x.split(' '));
for(let i=0;i<225;i++)if(BONUS[i]==='.'&&BONUS[224-i]!=='.')BONUS[i]=BONUS[224-i];
export const emptyBoard=()=>Array(225).fill('');
export function makeLexicon(text){const words=new Set(text.toUpperCase().split(/\s+/).filter(x=>/^[A-Z]{2,15}$/.test(x)));const root={};for(const word of words){let n=root;for(const c of word)n=n[c]??={};n.$=true;}return {words,root};}
export function scoreTile(c,values=VALUES){return c===c.toLowerCase()?0:(values[c]??0);}
export function solve(board,rack,lex,bonuses=BONUS,values=VALUES,limit=100){
 if(board.length!==225)throw Error('Board must contain 225 squares');
 const counts={};for(const c of rack.toUpperCase())counts[c]=(counts[c]||0)+1;
 const hasBoard=board.some(Boolean), moves=[],seen=new Set();
 const inside=(r,c)=>r>=0&&r<15&&c>=0&&c<15;
 for(const [dr,dc,direction] of [[0,1,'across'],[1,0,'down']]){
  const cross=Array.from({length:225},(_,i)=>{const r=Math.floor(i/15),c=i%15;let before='',after='',sum=0;
   for(let rr=r-dc,cc=c-dr;inside(rr,cc)&&board[rr*15+cc];rr-=dc,cc-=dr){const ch=board[rr*15+cc];before=ch.toUpperCase()+before;sum+=scoreTile(ch,values);}
   for(let rr=r+dc,cc=c+dr;inside(rr,cc)&&board[rr*15+cc];rr+=dc,cc+=dr){const ch=board[rr*15+cc];after+=ch.toUpperCase();sum+=scoreTile(ch,values);}
   return {before,after,sum,active:!!(before||after)};
  });
  for(let r=0;r<15;r++)for(let c=0;c<15;c++){
   if(inside(r-dr,c-dc)&&board[(r-dr)*15+c-dc])continue;
   // Only starts that can reach an anchor with the available rack tiles.
   let anchor=false,holes=0;
   for(let rr=r,cc=c;inside(rr,cc);rr+=dr,cc+=dc){const i=rr*15+cc;if(!board[i])holes++;if(holes>rack.length)break;if(board[i]||cross[i].active||(!hasBoard&&i===112)){anchor=true;break;}}
   if(!anchor)continue;
   const placed=[];
   function walk(rr,cc,node,word,main,mult,extra,connected){
    if(node.$&&placed.length&&word.length>=2&&connected&&(!inside(rr,cc)||!board[rr*15+cc])){
     const key=placed.map(p=>p.i+':'+p.letter).join(',');
     if(!seen.has(key)){seen.add(key);moves.push({word,row:r,col:c,direction,score:main*mult+extra+(placed.length===7?40:0),placed:placed.map(p=>({...p})),used:placed.length});}
    }
    if(!inside(rr,cc))return;const i=rr*15+cc,ch=board[i];
    if(ch){const next=node[ch.toUpperCase()];if(next)walk(rr+dr,cc+dc,next,word+ch.toUpperCase(),main+scoreTile(ch,values),mult,extra,true);return;}
    if(placed.length>=rack.length)return;
    const b=bonuses[i],lm=b==='2L'?2:b==='3L'?3:1,wm=b==='2W'?2:b==='3W'?3:1,x=cross[i];
    for(const letter of Object.keys(node)){
     if(letter==='$'||(x.active&&!lex.words.has(x.before+letter+x.after)))continue;
     for(const blank of [false,true]){const tile=blank?'?':letter;if(!counts[tile])continue;
      counts[tile]--;const val=blank?0:values[letter]||0;placed.push({i,letter,blank});
      walk(rr+dr,cc+dc,node[letter],word+letter,main+val*lm,mult*wm,extra+(x.active?(x.sum+val*lm)*wm:0),connected||x.active||(!hasBoard&&i===112));
      placed.pop();counts[tile]++;
     }
    }
   }
   walk(r,c,lex.root,'',0,1,0,false);
  }
 }
 return moves.sort((a,b)=>b.score-a.score||b.used-a.used||a.word.localeCompare(b.word)).slice(0,limit);
}
export function boardWarnings(board,lex){const warnings=[];for(const [dr,dc] of [[0,1],[1,0]])for(let r=0;r<15;r++)for(let c=0;c<15;c++){if(!board[r*15+c]||(r-dr>=0&&c-dc>=0&&board[(r-dr)*15+c-dc]))continue;let w='';for(let rr=r,cc=c;rr<15&&cc<15&&board[rr*15+cc];rr+=dr,cc+=dc)w+=board[rr*15+cc].toUpperCase();if(w.length>1&&!lex.words.has(w))warnings.push(w);}return [...new Set(warnings)];}
