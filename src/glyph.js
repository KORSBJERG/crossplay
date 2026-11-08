/** Isolate the main white tile letter, independently of its font or vertical alignment.
 * Connected components separate the letter from the small score in its upper corner.
 * Coordinates and pixels are local to the tile interior, never the whole screenshot.
 */
export function isolateGlyph(rgba,width,height){
 const mask=new Uint8Array(width*height),visited=new Uint8Array(width*height),components=[];
 for(let i=0;i<mask.length;i++){const j=i*4;mask[i]=rgba[j]>175&&rgba[j+1]>175&&rgba[j+2]>175?1:0;}
 for(let i=0;i<mask.length;i++){
  if(!mask[i]||visited[i])continue;
  const queue=[i],pixels=[];visited[i]=1;let left=width,right=0,top=height,bottom=0;
  for(let k=0;k<queue.length;k++){const p=queue[k],x=p%width,y=Math.floor(p/width);pixels.push(p);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const n=yy*width+xx;if(mask[n]&&!visited[n]){visited[n]=1;queue.push(n);}}
  }
  const w=right-left+1,h=bottom-top+1;
  // Ignore corner score digits and white fragments at the tile boundary.
  if(h>=height*.25&&pixels.length>=3&&!(left>width*.62&&bottom<height*.42)&&w<width*.97&&h<height*.97)components.push({left,top,width:w,height:h,pixels});
 }
 if(!components.length)return null;
 components.sort((a,b)=>b.height-a.height||b.pixels.length-a.pixels.length);
 const main=components[0],glyph=new Uint8Array(main.width*main.height);
 for(const p of main.pixels){const x=p%width-main.left,y=Math.floor(p/width)-main.top;glyph[y*main.width+x]=1;}
 return {width:main.width,height:main.height,mask:glyph,fill:main.pixels.length/glyph.length};
}

// A font-independent comparison of normalized silhouettes. Used only to cross-check
// low-confidence OCR; it never substitutes letters using the contents of the board.
export function glyphSignature(glyph){
 const width=32,height=40,raw=new Float32Array(width*height),out=new Float32Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const xx=Math.min(glyph.width-1,Math.floor((x+.5)*glyph.width/width)),yy=Math.min(glyph.height-1,Math.floor((y+.5)*glyph.height/height));raw[y*width+x]=glyph.mask[yy*glyph.width+xx];}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){let sum=0,count=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height){sum+=raw[yy*width+xx];count++;}}out[y*width+x]=sum/count;}
 return {pixels:out,aspect:glyph.width/glyph.height};
}
export function matchGlyph(glyph,templates){
 const input=glyphSignature(glyph),ranks=new Map();
 for(const t of templates){let intersection=0,total=0;for(let i=0;i<input.pixels.length;i++){intersection+=Math.min(input.pixels[i],t.signature.pixels[i]);total+=input.pixels[i]+t.signature.pixels[i];}const score=2*intersection/Math.max(1,total)-Math.min(.1,Math.abs(Math.log(input.aspect/t.signature.aspect))*.06);if(score>(ranks.get(t.letter)||0))ranks.set(t.letter,score);}
 const sorted=[...ranks].sort((a,b)=>b[1]-a[1]);return sorted.length?{letter:sorted[0][0],score:sorted[0][1],margin:sorted[0][1]-(sorted[1]?.[1]||0)}:null;
}
