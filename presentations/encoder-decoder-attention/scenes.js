/* Original SVG storyboards. Each displayed value comes from model.js. */
(function(root){
 const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.AttentionModel;
 const f=x=>Number(x).toFixed(2),vec=a=>'['+a.map(f).join(', ')+']';
 const text=(x,y,t,size=18,color='#183c35',anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${t}</text>`;
 const box=(x,y,w,h,title,sub,fill='#e4eee1')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="#92ac99"/>${text(x+w/2,y+29,title,18,'#183c35','middle')}${text(x+w/2,y+56,sub,16,'#34594d','middle')}`;
 const arrow=(x,y,a,b,active=true,p=1)=>`<path d="M${x},${y} L${a},${b}" stroke="${active?'#12655b':'#cbd7ca'}" stroke-width="${active?3:2}" fill="none" marker-end="url(#tip)"/>${active&&p<1?`<circle cx="${x+(a-x)*p}" cy="${y+(b-y)*p}" r="7" fill="#b24a30"/>`:''}`;
 function result(key,o={}){return M.attend([o.qx??1,o.qy??0],M.H,key==='additive'?'additive':key==='multiplicative'?(o.method||'dot'):'dot',o.mask?[true,true,false]:null,o.temperature||1);}
 function encoder(beat,p,o){
  const states=M.encode([1,.5,-.5]);let s=text(24,32,'SOURCE / three input positions',14);
  ['I','love','you'].forEach((w,i)=>{const x=30+i*245;s+=box(x,65,195,75,`x${i+1}: ${w}`,`h${i+1} = ${f(states[i])}`,beat>=1?'#dceadd':'#fffefa');if(i<2)s+=arrow(x+195,102,x+245,102,true,p);});
  s+=arrow(618,140,618,200,beat>=1,p)+box(500,205,235,75,'Fixed context c',f(states[2]),'#f4e5d0');
  s+=text(24,202,'TARGET / start only after reading the source',14);
  const feeds=M.decoderInputs(['je','t’aime','EOS'],o.teacher!==false,['tu','aimes','EOS']);
  [o.teacher===false?'tu':'je',o.teacher===false?'aimes':'t’aime','EOS'].forEach((w,i)=>{const visible=beat>=i+3;s+=box(30+i*245,330,195,75,visible?w:'?',`input: ${beat>=3?feeds[i]:'?'}`,visible?'#dceadd':'#fffefa');if(i<2)s+=arrow(225+i*245,365,275+i*245,365,beat>=4,p);});
  s+=box(30,220,235,75,'s₀ = bridge(c)','Initialize before BOS','#f4e5d0')+arrow(500,242,265,257,beat>=1,p)+arrow(127,295,127,321,beat>=3,p)+text(24,461,beat===2?'PREDICT: what input starts the decoder?':o.teacher===false?'Inference: scripted wrong first prediction tu changes the next input.':'Teacher forcing: previous correct target becomes the next input.',17);
  return s;
 }
 function bottleneck(beat,p,o){
  const n=o.length||8,r=o.retention??.5,a=M.encode([1,...Array(n-1).fill(0)],r),b=M.encode([-1,...Array(n-1).fill(0)],r);let s=text(25,30,`SAME WIDTH: 1 coordinate · length ${n} · retention ${f(r)}`,16);
  s+=box(25,65,180,75,'First input +1',`h₁ = ${f(a[0])}`)+box(25,225,180,75,'First input −1',`h₁ = ${f(b[0])}`,'#f4e5d0');
  s+=arrow(210,105,525,105,true,p)+arrow(210,265,525,265,true,p)+text(305,80,`${n-1} more updates`,16)+text(305,240,`${n-1} more updates`,16);
  s+=box(535,65,210,75,'Final summary +',beat>=3?vec([a[n-1]]):'[ ? ]')+box(535,225,210,75,'Final summary −',beat>=3?vec([b[n-1]]):'[ ? ]','#f4e5d0');
  s+=text(25,348,beat>=3?`Final separation Δ = ${Math.abs(a[n-1]-b[n-1]).toFixed(6)}`:'PREDICT: can the final summary distinguish the first input?',20);
  if(beat>=4){for(let i=0;i<Math.min(n,8);i++)s+=box(25+i*92,380,84,70,`h${i+1}`,f(a[i]),'#e4eee1');s+=text(25,480,beat>=5?'Attention offers a fresh route to these notes at each target step.':'Keep the intermediate notes instead of exposing only the final one.',16);}
  else s+=text(25,420,'No literal “word slots”: this isolates repeated scalar updates.',16);
  return s;
 }
 function attention(key,beat,p,o){
  const q=[o.qx??1,o.qy??0],r=result(key,o),scoreAt=key==='additive'?3:1,weightAt=3,contextAt=4;let s=text(24,28,`${key==='additive'?'ADDITIVE':key==='multiplicative'?(o.method||'dot').toUpperCase():'DOT'} SCORING · hand-chosen numbers`,15);
  s+=box(24,53,198,75,key==='additive'?'Previous state q':'Decoder query q',vec(q),'#f4e5d0');
  ['I','love','you'].forEach((w,i)=>{const x=262+i*167;s+=box(x,53,155,75,`h${i+1} · ${w}`,vec(M.H[i]),o.mask&&i===2?'#eee':'#e4eee1');
   s+=arrow(222,92,x,143,beat>=1,p);
   if(beat>=scoreAt)s+=text(x+77,177,`e = ${f(r.scores[i])}`,18,'#183c35','middle');
   if(beat>=weightAt){s+=`<rect x="${x}" y="200" width="155" height="68" rx="8" fill="#12655b" fill-opacity="${.12+.75*r.weights[i]}"/>`+text(x+77,241,`α = ${f(r.weights[i])}`,20,r.weights[i]>.55?'#fffefa':'#183c35','middle');}
   if(beat>=contextAt)s+=arrow(x+77,273,505,320,true,p);
  });
  if(key==='additive'&&beat>=1&&beat<4){const u=q.map((v,i)=>v+M.H[0][i]);s+=text(25,311,`For h₁: Wq q + Wh h₁ = ${vec(u)}`,18)+text(25,348,`tanh → ${vec(u.map(Math.tanh))}`,18)+text(25,385,beat>=3?`v = [1, −1]; e₁ = ${f(r.scores[0])}`:'PREDICT: is this already a probability?',18);}
  if(beat>=contextAt)s+=box(350,323,310,77,'Retrieved context c',vec(r.context),'#f4e5d0');
  else if(!(key==='additive'&&beat>=1))s+=text(24,335,beat===2?'PREDICT: where will the source weights concentrate?':'Scores are comparisons. Weights are normalized across source positions.',17);
  s+=text(24,450,beat>=5?(key==='multiplicative'?'[c ; s] → attentional state → vocabulary softmax':key==='additive'?'c → decoder update → vocabulary softmax':'Select another target step; watch a different heatmap row.'):'Read left to right; identical colors do not imply identical word meanings.',16);
  s+=text(24,485,'Attention weights ≠ next-word probabilities. Values are teaching examples.',14,'#586c62');return s;
 }
 function render(key,beat=0,p=1,o={}){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 515" role="img"><title>${key} walkthrough, beat ${beat+1}</title><desc>Numbered source states and decoder query. See the caption and numerical table below for a text equivalent.</desc><defs><marker id="tip" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#12655b"/></marker></defs><rect width="780" height="515" rx="12" fill="#fffefa"/><g font-family="system-ui, sans-serif">${key==='encoder'?encoder(beat,p,o):key==='bottleneck'?bottleneck(beat,p,o):attention(key,beat,p,o)}</g></svg>`;}
 const api={render,result,vec};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AttentionScenes=api;
})(typeof window!=='undefined'?window:this);
