/* Shared exact teaching models. No downloaded or pretrained vectors. */
(function(root){
'use strict';
const corpus=['the cat likes milk','the dog likes walks','the cat likes walks'];
const vocab=['the','cat','dog','likes','milk','walks'];
const vectors={cat:[1,.2],dog:[.9,.3],milk:[.2,1],walks:[.3,.9],kitten:[.95,.15]};
const applicationVectors={...vectors,good:[1,0],not:[0,.1],bad:[-1,0]};
const tokens=s=>(s.toLowerCase().match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu)||[]);
const bow=(s,v=vocab)=>{const t=tokens(s);return v.map(w=>t.filter(x=>x===w).length);};
function tfidf(docs,v=vocab){const counts=docs.map(d=>bow(d,v)),df=v.map((_,j)=>counts.filter(r=>r[j]>0).length),idf=df.map(n=>Math.log((docs.length+1)/(n+1))+1);return {counts,df,idf,values:counts.map(r=>r.map((x,j)=>x*idf[j]))};}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cosine=(a,b)=>{const n=Math.sqrt(dot(a,a)*dot(b,b));return n?dot(a,b)/n:null;};
const softmax=z=>{const m=Math.max(...z),e=z.map(x=>Math.exp(x-m)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s);};
function bpe(input,n=3){let words=input.map(w=>Array.from(w).concat('▁')),steps=[];for(let k=0;k<n;k++){const counts=new Map();for(const w of words)for(let i=0;i<w.length-1;i++){const key=JSON.stringify([w[i],w[i+1]]);counts.set(key,(counts.get(key)||0)+1);}const sorted=[...counts].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0));if(!sorted.length)break;const [key,count]=sorted[0],pair=JSON.parse(key);words=words.map(w=>{const out=[];for(let i=0;i<w.length;i++){if(w[i]===pair[0]&&w[i+1]===pair[1]){out.push(w[i]+w[i+1]);i++;}else out.push(w[i]);}return out;});steps.push({pair,count,words:words.map(w=>w.slice())});}return {words,steps};}
function cooccur(docs,v=vocab){const X=v.map(()=>v.map(()=>0));for(const d of docs){const t=tokens(d);for(let i=0;i<t.length;i++)for(const j of [i-1,i+1])if(j>=0&&j<t.length){const a=v.indexOf(t[i]),b=v.indexOf(t[j]);if(a>=0&&b>=0)X[a][b]++;}}return X;}
const initialCBOW=()=>({E:[[1,0],[0,1],[.2,.4]],U:[[.2,-.1],[-.3,.4],[.1,.2]],b:[0,0,0]});
function cbow(s,context=[0,1],target=2){const h=s.E[0].map((_,j)=>context.reduce((a,id)=>a+s.E[id][j],0)/context.length),z=s.U.map((r,i)=>dot(r,h)+s.b[i]),p=softmax(z);return {h,z,p,loss:-Math.log(p[target])};}
function trainCBOW(s,context=[0,1],target=2,rate=.2){const f=cbow(s,context,target),g=f.p.map((x,i)=>x-(i===target?1:0)),dh=f.h.map((_,j)=>s.U.reduce((a,r,i)=>a+g[i]*r[j],0)),next=JSON.parse(JSON.stringify(s));next.U=s.U.map((r,i)=>r.map((x,j)=>x-rate*g[i]*f.h[j]));next.b=s.b.map((x,i)=>x-rate*g[i]);for(const id of context)next.E[id]=next.E[id].map((x,j)=>x-rate*dh[j]/context.length);return next;}
function gloveTerm(x,w,c,b=0,bc=0,xmax=4,alpha=.75){if(!x)return {weight:0,residual:0,loss:0};const weight=Math.min(1,(x/xmax)**alpha),residual=dot(w,c)+b+bc-Math.log(x);return {weight,residual,loss:weight*residual**2};}
const M={corpus,vocab,vectors,applicationVectors,tokens,bow,tfidf,dot,cosine,softmax,bpe,cooccur,initialCBOW,cbow,trainCBOW,gloveTerm};if(typeof module!=='undefined')module.exports=M;root.TextModels=M;
})(typeof globalThis!=='undefined'?globalThis:this);
