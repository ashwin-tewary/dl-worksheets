/* Exact toy computations for teaching; no model training or measured accuracy. */
(function(root){
 'use strict';
 const counts=[157504,11019008,1539];
 function softmax(v){const m=Math.max(...v),e=v.map(x=>Math.exp(x-m)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s);}
 function pool(maps){return maps.map(a=>a.flat().reduce((s,x)=>s+x,0)/a.flat().length);}
 function classify(z){const logits=[z[0]-0.5*z[1]+1,-0.5*z[0]+z[1]+1];return {logits,probabilities:softmax(logits)};}
 function update(w,g,lr,trainable){return trainable?w-lr*g:w;}
 function trainableCount(flags){return flags.reduce((s,on,i)=>s+(on?counts[i]:0),0);}
 function transform(x,kind,brightness=0){const n=x.length;return x.map((row,r)=>row.map((_,c)=>{
 let v=kind==='flip'?x[r][n-1-c]:kind==='rotate'?x[n-1-c][r]:kind==='shift'?(c===0?0:x[r][c-1]):x[r][c];
 return Math.max(0,Math.min(9,v+brightness));
 }));}
 function receptiveField(layers){return 1+2*layers;}
 function patchStats(size,patch){const tokens=(size/patch)**2;return {tokens,pairs:tokens**2};}
 const api={counts,softmax,pool,classify,update,trainableCount,transform,receptiveField,patchStats};
 if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.TransferModel=api;
})(typeof window!=='undefined'?window:this);
