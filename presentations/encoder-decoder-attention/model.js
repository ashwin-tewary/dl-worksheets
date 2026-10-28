/* Exact arithmetic for explicitly hand-chosen teaching states; no trained model. */
(function(root){
 const dot=(a,b)=>{if(a.length!==b.length)throw Error('Vector widths must agree');return a.reduce((s,x,i)=>s+x*b[i],0);};
 const matvec=(W,x)=>W.map(row=>dot(row,x));
 function softmax(scores,mask=null,temperature=1){
  if(!(temperature>0)||!scores.length||scores.some(x=>!Number.isFinite(x)))throw Error('Finite scores and positive temperature required');
  const valid=mask||scores.map(()=>true);if(valid.length!==scores.length||!valid.some(Boolean))throw Error('At least one valid source required');
  const max=Math.max(...scores.filter((_,i)=>valid[i]));const ex=scores.map((s,i)=>valid[i]?Math.exp((s-max)/temperature):0),sum=ex.reduce((a,b)=>a+b,0);return ex.map(x=>x/sum);
 }
 function context(weights,states){if(weights.length!==states.length||!states.length)throw Error('One weight per state required');return states[0].map((_,j)=>states.reduce((s,h,i)=>s+weights[i]*h[j],0));}
 const general=(q,h,W)=>dot(q,matvec(W,h));
 function additive(q,h,Wq,Wh,v,b=v.map(()=>0)){const a=matvec(Wq,q),k=matvec(Wh,h);if(a.length!==k.length||a.length!==v.length||b.length!==v.length)throw Error('Attention widths must agree');return dot(v,a.map((x,i)=>Math.tanh(x+k[i]+b[i])));}
 const H=[[1,0],[0,1],[1,1]],W=[[1,0],[0,1]],V=[1,-1],G=[[1,0],[0,2]];
 function attend(q,states=H,method='dot',mask=null,temperature=1){const scores=states.map(h=>method==='additive'?additive(q,h,W,W,V):method==='general'?general(q,h,G):dot(q,h));const weights=softmax(scores,mask,temperature);return {scores,weights,context:context(weights,states)};}
 function encode(inputs,retention=.5){let h=0;return inputs.map(x=>(h=Math.tanh(x+retention*h)));}
 const decoderInputs=(targets,teacher=true,predictions=targets)=>['BOS',...(teacher?targets:predictions).slice(0,-1)];
 const api={dot,matvec,softmax,context,general,additive,attend,encode,decoderInputs,H,W,V,G};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AttentionModel=api;
})(typeof window!=='undefined'?window:this);
