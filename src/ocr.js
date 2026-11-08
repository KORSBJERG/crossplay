import {createWorker,PSM} from 'tesseract.js';
import {isolateGlyph,glyphSignature,matchGlyph} from './glyph.js';
const blue=(r,g,b)=>b>r+24&&b>g+8&&r<170&&g<180;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
export async function loadImage(file){if(file.size>20*1024*1024)throw Error('Choose a screenshot smaller than 20 MB.');const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(img.width*img.height>24000000)throw Error('This image is too large. Please use a normal iPhone screenshot.');const c=canvas(img.width,img.height);c.getContext('2d').drawImage(img,0,0);return c;}finally{URL.revokeObjectURL(url);}}
export function detectBoard(image){const {width:w,height:h}=image;const ctx=image.getContext('2d'),data=ctx.getImageData(0,0,w,h).data;
 const colored=(r,g,b)=>blue(r,g,b)||(Math.max(r,g,b)-Math.min(r,g,b)<24&&r>220&&r<249)||(r>175&&r<245&&g>175&&g<245&&b>155&&b<249);
 const hits=[];for(let y=0;y<h;y+=2){let n=0;for(let x=Math.floor(w*.02);x<w*.98;x+=3){const i=(y*w+x)*4;if(colored(data[i],data[i+1],data[i+2]))n++;}if(n>w/3*.67)hits.push(y);}
 const groups=[];for(const y of hits){const last=groups.at(-1);if(last&&y-last.end<w*.025)last.end=y;else groups.push({start:y,end:y});}
 const group=groups.filter(g=>g.end-g.start>w*.82&&g.end-g.start<w*1.08).sort((a,b)=>Math.abs((a.end-a.start)-w*.96)-Math.abs((b.end-b.start)-w*.96))[0];
 const size=Math.round(w*.96);return {x:Math.round((w-size)/2),y:group?group.start:Math.round(h*.3),size};
}
function hasTile(image,x,y,w,h){const d=image.getContext('2d').getImageData(Math.max(0,Math.round(x)),Math.max(0,Math.round(y)),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))).data;let n=0;for(let i=0;i<d.length;i+=4)if(blue(d[i],d[i+1],d[i+2]))n++;return n/(d.length/4)>.32;}
function letterCrop(image,x,y,size){
 // Keep the whole tile interior; a fixed lower crop cut letters on smaller screenshots.
 const edge=Math.max(1,Math.round(size*.085)),length=Math.max(4,Math.round(size)-edge*2);
 const sx=Math.max(0,Math.min(image.width-length,Math.round(x)+edge));
 const sy=Math.max(0,Math.min(image.height-length,Math.round(y)+edge));
 const raw=image.getContext('2d').getImageData(sx,sy,length,length);
 const glyph=isolateGlyph(raw.data,length,length);
 if(!glyph)return null;
 const c=canvas(128,128),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,128,128);
 const small=canvas(glyph.width,glyph.height),t=small.getContext('2d'),d=t.createImageData(glyph.width,glyph.height);
 for(let i=0;i<glyph.mask.length;i++){d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=glyph.mask[i]?0:255;d.data[i*4+3]=255;}t.putImageData(d,0,0);
 // Preserve the letter's aspect ratio instead of stretching every letter into one box.
 const scale=80/Math.max(glyph.width,glyph.height),w=glyph.width*scale,h=glyph.height*scale;
 ctx.imageSmoothingEnabled=false;ctx.drawImage(small,(128-w)/2,(128-h)/2,w,h);
 return {canvas:c,raw:glyph,isI:glyph.width/glyph.height<.28&&glyph.fill>.82};
}
function fontTemplates(){
 const templates=[];
 for(const font of ['Arial','Verdana','Tahoma','Trebuchet MS','sans-serif'])for(const weight of [600,700])for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
  const c=canvas(128,128),ctx=c.getContext('2d');ctx.fillStyle='#4670b4';ctx.fillRect(0,0,128,128);ctx.fillStyle='white';ctx.font=`${weight} 80px "${font}"`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(letter,64,64);
  const glyph=isolateGlyph(ctx.getImageData(0,0,128,128).data,128,128);if(glyph)templates.push({letter,signature:glyphSignature(glyph)});
 }
 return templates;
}
export async function readScreenshot(image,rect,onProgress){let worker;try{onProgress('Loading the on-device reader…',0);worker=await createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr',langPath:'/ocr',workerBlobURL:false,cacheMethod:'none'});await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_CHAR,tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0',classify_bln_numeric_mode:'0'});
 const board=Array(225).fill(''),uncertain=[],jobs=[],step=rect.size/15;
 for(let r=0;r<15;r++)for(let c=0;c<15;c++){const x=rect.x+c*step,y=rect.y+r*step;if(hasTile(image,x+step*.2,y+step*.1,step*.6,step*.8))jobs.push({i:r*15+c,x,y,size:step});}
 // The rack is the wide blue row below the board. Find its largest contiguous band.
 const w=image.width,h=image.height,ctx=image.getContext('2d');const bands=[];
 for(let y=Math.min(h-1,Math.round(rect.y+rect.size+step));y<h;y+=3){const d=ctx.getImageData(0,y,w,1).data;let n=0;for(let x=0;x<w;x+=4)if(blue(d[x*4],d[x*4+1],d[x*4+2]))n++;if(n>w/4*.5){const last=bands.at(-1);if(last&&y-last.end<w*.025){last.end=y;last.h=y-last.y;}else bands.push({y,end:y,h:0});}}
 const band=bands.filter(b=>b.h>w*.06&&b.h<w*.2).sort((a,b)=>b.h-a.h)[0];
 const rackJobs=band?Array.from({length:7},(_,i)=>({rack:i,x:i*w/7,y:band.y,size:w/7})):[];
 const templates=fontTemplates();let rack=Array(7).fill(''),n=0;
 for(const job of [...jobs,...rackJobs]){
  const glyph=letterCrop(image,job.x,job.y,job.size);let letter='',confidence=0;
  if(glyph?.isI){letter='I';confidence=85;}
  else if(glyph){
   let result=await worker.recognize(glyph.canvas);let data=result.data;
   letter=data.text.replace(/0/g,'O').replace(/[^A-Z]/g,'');confidence=data.confidence;
   if(letter.length!==1||confidence<45){
    await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_WORD});const retry=await worker.recognize(glyph.canvas);
    await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_CHAR});const alternative=retry.data.text.replace(/0/g,'O').replace(/[^A-Z]/g,'');
    if(alternative.length===1&&(letter.length!==1||retry.data.confidence>confidence)){letter=alternative;confidence=retry.data.confidence;}
   }
  }
  if(glyph&&!glyph.isI&&(letter.length!==1||confidence<45)){
   const narrow=canvas(128,128),ctx=narrow.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,128,128);ctx.drawImage(glyph.canvas,16,0,96,128);
   const retry=await worker.recognize(narrow);const alternative=retry.data.text.replace(/0/g,'O').replace(/[^A-Z]/g,'');
   if(alternative.length===1&&(letter.length!==1||retry.data.confidence>confidence)){letter=alternative;confidence=retry.data.confidence;}
  }
  if(glyph&&confidence<65){
   const match=matchGlyph(glyph.raw,templates);
   if(match&&match.score>.73&&match.margin>.025){letter=match.letter;confidence=Math.min(85,Math.round(match.score*100));}
   else if(letter.length!==1&&match&&match.score>.8){letter=match.letter;confidence=55;}
  }
  if(letter.length!==1)letter='';
  if(job.rack!==undefined)rack[job.rack]=letter||'?';
  else{board[job.i]=letter||'?';if(!letter||confidence<65)uncertain.push(job.i);}
  n++;onProgress(`Reading tiles · ${n} of ${jobs.length+rackJobs.length}`,n/(jobs.length+rackJobs.length));
 }

 return {board,rack:rack.join(''),uncertain};
 }finally{if(worker)await worker.terminate();}}
