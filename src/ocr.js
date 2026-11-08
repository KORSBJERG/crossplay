import {createWorker,PSM} from 'tesseract.js';
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
function letterCrop(image,x,y,size){const c=canvas(112,128),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);
 // Crop out the small score in the upper right, keeping only the main letter.
 const temp=canvas(70,90),t=temp.getContext('2d');t.drawImage(image,x+size*.12,y+size*.31,size*.67,size*.60,0,0,70,90);const d=t.getImageData(0,0,70,90);for(let i=0;i<d.data.length;i+=4){const ink=d.data[i]>190&&d.data[i+1]>190&&d.data[i+2]>190;d.data[i]=d.data[i+1]=d.data[i+2]=ink?0:255;d.data[i+3]=255;}t.putImageData(d,0,0);ctx.drawImage(temp,21,19);return c;}
export async function readScreenshot(image,rect,onProgress){let worker;try{onProgress('Loading the on-device reader…',0);worker=await createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr',langPath:'/ocr',workerBlobURL:false,cacheMethod:'none'});await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_CHAR,tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',classify_bln_numeric_mode:'0'});
 const board=Array(225).fill(''),uncertain=[],jobs=[],step=rect.size/15;
 for(let r=0;r<15;r++)for(let c=0;c<15;c++){const x=rect.x+c*step,y=rect.y+r*step;if(hasTile(image,x+step*.2,y+step*.1,step*.6,step*.8))jobs.push({i:r*15+c,x,y,size:step});}
 // The rack is the wide blue row below the board. Find its largest contiguous band.
 const w=image.width,h=image.height,ctx=image.getContext('2d');const bands=[];
 for(let y=Math.min(h-1,Math.round(rect.y+rect.size+step));y<h;y+=3){const d=ctx.getImageData(0,y,w,1).data;let n=0;for(let x=0;x<w;x+=4)if(blue(d[x*4],d[x*4+1],d[x*4+2]))n++;if(n>w/4*.5){const last=bands.at(-1);if(last&&y-last.end<w*.025){last.end=y;last.h=y-last.y;}else bands.push({y,end:y,h:0});}}
 const band=bands.filter(b=>b.h>w*.06&&b.h<w*.2).sort((a,b)=>b.h-a.h)[0];
 const rackJobs=band?Array.from({length:7},(_,i)=>({rack:i,x:i*w/7,y:band.y,size:w/7})):[];
 let rack=Array(7).fill(''),n=0;
 for(const job of [...jobs,...rackJobs]){const crop=letterCrop(image,job.x,job.y,job.size);let {data}=await worker.recognize(crop);let letter=data.text.replace(/[^A-Z]/g,'');
 const pixels=crop.getContext('2d').getImageData(0,0,crop.width,crop.height).data;let minX=999,maxX=0,minY=999,maxY=0,ink=0;
 for(let y=0;y<crop.height;y++)for(let x=0;x<crop.width;x++){if(pixels[(y*crop.width+x)*4]<80){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);ink++;}}
 if(ink>20&&(maxX-minX+1)/(maxY-minY+1)<.28&&ink/((maxX-minX+1)*(maxY-minY+1))>.82){letter='I';data.confidence=85;}
 else if(letter.length!==1){await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_WORD});const retry=await worker.recognize(crop);await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_CHAR});data=retry.data;letter=data.text.replace(/[^A-Z]/g,'');}
 if(letter.length!==1)letter='';if(job.rack!==undefined)rack[job.rack]=letter||'?';else{board[job.i]=letter||'?';if(!letter||data.confidence<65)uncertain.push(job.i);}n++;onProgress(`Reading tiles · ${n} of ${jobs.length+rackJobs.length}`,n/(jobs.length+rackJobs.length));}
 return {board,rack:rack.join(''),uncertain};
 }finally{if(worker)await worker.terminate();}}
