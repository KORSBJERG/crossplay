import test from 'node:test';
import assert from 'node:assert/strict';
import {isolateGlyph} from '../src/glyph.js';
function tile(n){const a=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){a[i*4]=70;a[i*4+1]=110;a[i*4+2]=180;a[i*4+3]=255;}return a;}
function rectangle(a,n,x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=(yy*n+xx)*4;a[i]=a[i+1]=a[i+2]=255;}}
test('keeps a full-height letter and removes its separate score digit',()=>{const a=tile(50);rectangle(a,50,17,8,7,34);rectangle(a,50,39,2,4,8);const g=isolateGlyph(a,50,50);assert.equal(g.width,7);assert.equal(g.height,34);assert.equal(g.fill,1);});
test('isolates a letter located higher in the tile without clipping its top',()=>{const a=tile(32);rectangle(a,32,6,4,3,20);rectangle(a,32,6,4,15,3);rectangle(a,32,6,13,12,3);rectangle(a,32,25,1,3,5);const g=isolateGlyph(a,32,32);assert.equal(g.height,20);assert.equal(g.width,15);});
test('does not invent a letter from a corner score on a blank tile',()=>{const a=tile(50);rectangle(a,50,40,2,4,8);assert.equal(isolateGlyph(a,50,50),null);});
test('keeps a hollow round letter as one connected glyph',()=>{const a=tile(40);rectangle(a,40,8,5,3,28);rectangle(a,40,25,5,3,28);rectangle(a,40,8,5,20,3);rectangle(a,40,8,30,20,3);const g=isolateGlyph(a,40,40);assert.equal(g.width,20);assert.equal(g.height,28);assert.equal(g.mask[14*20+10],0);});
