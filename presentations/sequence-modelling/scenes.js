/* Original, portable SVG teaching diagrams. Every numerical cell is text. */
(function(root){
 'use strict';
 const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.SequenceModel;
 const C={ink:'#183c35',teal:'#12655b',mint:'#dceadd',paper:'#fffefa',line:'#cbd7ca',muted:'#586c62',coral:'#b24a30',sand:'#f4e5d0',gold:'#e2b457'};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const f=n=>(Math.abs(n)<.001&&n!==0)||Math.abs(n)>=10000?n.toExponential(2):Number(n.toFixed(3)).toString();
 const text=(x,y,s,size=19,fill=C.ink,anchor='start',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
 const box=(x,y,w,h,fill=C.paper,stroke=C.line,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" ${extra}/>`;
 function arrow(x1,y1,x2,y2,color=C.teal,p=1){return `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2.5" marker-end="url(#${color===C.coral?'a-coral':'a-teal'})"/>`+(p>0&&p<1?`<circle cx="${x1+(x2-x1)*p}" cy="${y1+(y2-y1)*p}" r="7" fill="${C.gold}" stroke="${C.ink}"/>`:'');}
 function wrap(title,body){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 440" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><marker id="a-teal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${C.teal}"/></marker><marker id="a-coral" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${C.coral}"/></marker></defs><style>text{font-family:system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums}.number{font-family:ui-monospace,monospace}</style><rect width="920" height="440" rx="14" fill="${C.paper}"/>${text(30,36,title,17,C.muted)}${body}</svg>`;}
 function matrix(x,y,values,cell=40){let out='';values.forEach((row,r)=>row.forEach((value,c)=>{const on=value!==0;out+=`<rect x="${x+c*cell}" y="${y+r*cell}" width="${cell}" height="${cell}" rx="3" fill="${on?C.teal:'#f0f1e8'}" stroke="${C.paper}" stroke-width="2"/>`+text(x+(c+.5)*cell,y+(r+.5)*cell+7,value,21,on?'#fffefa':C.muted,'middle','class="number"');}));return out;}
 function order(beat,p,o){let out='';const reversed=!!o.reverse;
  for(let t=0;t<3;t++){
   const x=78+t*278,pos=reversed?2-t:t,active=beat>=4||t<=Math.max(0,beat-1);
   out+=box(x-18,78,196,231,active?C.mint:'#f5f3ec')+text(x,110,`t = ${t+1}`,18,C.teal)+matrix(x+14,127,[[0,0,0],Array.from({length:3},(_,i)=>i===pos?1:0),[0,0,0]],44)+text(x+80,286,`column ${pos+1}`,16,C.muted,'middle');
   if(t<2)out+=arrow(x+182,194,x+250,194,C.teal,beat===t+2?p:1);
  }
  out+=box(30,334,860,78,beat>=4?C.mint:C.sand)+text(50,365,beat>=4?`Journey: ${reversed?'RIGHT → LEFT':'LEFT → RIGHT'}`:'Predict: what changes when time runs backward?',22,C.teal);
  out+=text(50,394,beat>=5?'Time-averaged centre row: [0.333, 0.333, 0.333] · identical after reversal':'Three frames · same pixels · one ordered sequence',17,C.muted);
  return wrap('ORDER / time runs from left to right',out);
 }
 function tasks(beat,p,o){const mode=o.task||'classification',words=['not','very','good'];let out='';
  const target=mode==='next'?['very','good','EOS']:mode==='tagging'?['ADV','ADV','ADJ']:['','','negative'];
  for(let t=0;t<3;t++){
   const x=83+t*282,read=beat>=4||t<Math.min(2,Math.max(1,beat)),fill=read?C.mint:'#eeeee8';
   out+=box(x,76,184,75,fill)+text(x+92,105,words[t],25,read?C.ink:C.muted,'middle')+text(x+92,135,`x${t+1} = [${[0,1,2].map(j=>j===t?1:0).join(', ')}]`,16,C.muted,'middle');
   out+=arrow(x+92,153,x+92,192)+box(x,201,184,64,fill)+text(x+92,240,`state h${t+1}`,22,C.teal,'middle');
   if(t<2)out+=arrow(x+189,233,x+268,233,C.teal,beat===2?p:1);
   if(target[t]&&beat>=4)out+=arrow(x+92,270,x+92,309)+box(x,318,184,52,C.sand)+text(x+92,350,target[t],22,C.coral,'middle');
   else if(beat<4)out+=text(x+92,348,read?'read so far':'future input',17,C.muted,'middle');
  }
  out+=text(460,412,mode==='classification'?'ONE target after the final input':mode==='next'?(beat<4?'Causal prefix: future inputs remain unavailable.':'NEXT-TOKEN targets: x₂, x₃, EOS · shifted relative to inputs'):'ALIGNED tags: one target for each input token',19,C.ink,'middle');
  return wrap('TARGETS / choose the question before choosing the output',out);
 }
 function state(beat,p,o){const w=Number(o.weight??.5),activation=o.activation||'tanh';const t=beat>=6?2:beat>=5?1:0;const trace=M.trace([1,0,1],w,activation),s=trace[t];let out='';
  out+=text(35,79,`Step ${t+1} of 3 · inputs [1, 0, 1] · h₀ = 0`,18,C.muted);
  out+=box(35,109,190,85,C.mint)+text(55,140,'NEW INPUT',14,C.teal)+text(130,175,`x${t+1} = ${s.x}`,27,C.ink,'middle');
  out+=box(35,231,190,91,C.sand)+text(55,261,'PREVIOUS STATE',14,C.coral)+text(130,302,`h${t} = ${f(s.previous)}`,24,C.ink,'middle');
  out+=arrow(233,151,340,182,C.teal,beat===1?p:1)+arrow(233,276,340,233,C.coral,beat===2?p:1)+text(263,293,`× ${f(w)}`,18,C.coral);
  out+=box(350,159,191,108,beat>=2?C.mint:C.paper)+text(445,193,'ADD',14,C.teal,'middle')+text(445,237,beat>=2?`z = ${f(s.z)}`:'x + wh',25,C.ink,'middle');
  out+=arrow(551,213,606,213,C.teal,beat===4?p:1)+box(618,165,113,96,C.sand)+text(674,220,activation==='tanh'?'tanh':'linear',23,C.ink,'middle')+arrow(741,213,787,213);
  out+=box(797,166,95,96,beat>=4?C.mint:C.paper)+text(844,197,`h${t+1}`,18,C.teal,'middle')+text(844,237,beat>=4?f(s.h):'?',22,C.ink,'middle');
  out+=box(35,351,857,65,C.mint)+text(55,392,beat>=4?`h${t+1} = ${activation==='tanh'?'tanh(':''}${s.x} + ${f(w)} × ${f(s.previous)}${activation==='tanh'?')':''} = ${f(s.h)}`:'Predict the next state before revealing it.',24,C.teal);
  return wrap('STATE / one update combines current evidence with carried context',out);
 }
 function unroll(beat,p,o){const T=Number(o.length??4),H=Number(o.hidden??2),count=M.parameters(3,H,2);let out='';
  if(beat===0){out+=box(343,152,234,121,C.mint)+text(460,205,'one RNN cell',27,C.teal,'middle')+text(460,244,'shared parameters θ',18,C.teal,'middle');out+=arrow(180,213,330,213)+text(203,193,'xₜ',23);out+=arrow(590,213,730,213)+text(685,193,'hₜ',23);out+=`<path d="M525 151V95H396V150" fill="none" stroke="${C.teal}" stroke-width="3" marker-end="url(#a-teal)"/>`+text(460,78,'previous state returns',18,C.muted,'middle')+text(460,354,'Unroll to reveal the time order →',24,C.ink,'middle');return wrap('UNROLLING / same function, different moments',out);}
  const shown=beat===1?2:T,step=820/T,width=Math.min(126,step-32);
  out+=box(36,60,848,51,C.sand)+text(460,93,`ONE shared parameter bank θ · ${count} parameters · H = ${H}`,21,C.teal,'middle');
  for(let i=0;i<shown;i++){
   const x=48+i*step,mid=x+width/2;
   out+=text(mid,151,`x${i+1}`,20,C.ink,'middle')+arrow(mid,161,mid,190)+box(x,198,width,70,C.mint)+text(mid,225,'same θ',16,C.teal,'middle')+text(mid,252,`h${i+1}`,23,C.ink,'middle');
   if(i<shown-1){out+=beat>=5?arrow(x+step-9,235,x+width+7,235,C.coral,p):arrow(x+width+7,235,x+step-9,235,C.teal,p);}
   out+=`<line x1="${x+width-10}" y1="113" x2="${x+width-10}" y2="196" stroke="${C.muted}" stroke-dasharray="3 4"/>`;
   if(i===shown-1&&beat>=4)out+=(beat>=5?arrow(mid,315,mid,276,C.coral,p):arrow(mid,276,mid,315))+text(mid,340,'readout',16,C.teal,'middle')+text(mid,369,'loss L',19,C.coral,'middle');
  }
  out+=text(40,402,beat>=6?'All time-step gradient contributions accumulate into θ.':beat>=5?'BACKWARD: training credit follows the recurrent connections.':`FORWARD: ${T} inputs → ${T} cell evaluations · ${count} parameters`,21,beat>=5?C.coral:C.teal);
  return wrap('TIME / horizontal position is a time step, not a new layer',out);
 }
 function memory(beat,p,o){const L=Number(o.gap??20),w=Number(o.weight??.8),activation=o.activation||'linear';const path=M.memoryChain(L,w,activation),shown=beat>4?L:beat===4?Math.min(L,Math.floor(Math.min(L,4)+(L-Math.min(L,4))*p)):beat===3?Math.min(L,4):beat===2?Math.min(L,3):beat===1?1:0;let out='';
  out+=box(33,88,153,129,C.mint)+text(108,118,'FIRST CLUE',15,C.teal,'middle')+text(108,163,'+1',37,C.teal,'middle')+text(108,197,'h₀',21,C.ink,'middle');
  const cols=Math.min(L,10),space=478/cols;
  for(let i=0;i<cols;i++){const x=235+i*space,active=(i+1)/cols<=shown/L;out+=box(x,128,Math.min(38,space-4),42,active?C.mint:'#f0f0e9')+text(x+Math.min(38,space-4)/2,156,'0',19,C.muted,'middle');}
  out+=arrow(193,155,222,155,C.teal,p)+arrow(731,155,770,155,C.teal,p)+text(476,109,`${L} zero-input update${L===1?'':'s'}`,19,C.muted,'middle')+text(476,205,L>10?'10 shown as a schematic; all L links are calculated':'Each 0 means no new external input.',16,C.muted,'middle');
  out+=box(783,89,107,129,C.sand)+text(836,118,beat>=4?`h${shown}`:'hL',21,C.coral,'middle')+text(836,169,beat>=4?f(path[shown].h):'?',22,C.coral,'middle');
  out+=text(35,274,`Trace: after ${shown} of ${L} links`,21,C.ink)+box(35,293,850,31,'#edf0e7');
  out+=`<rect x="35" y="293" width="${850*(shown/L)}" height="31" rx="10" fill="${C.teal}"/>`;
  out+=text(35,367,`Current state = ${f(path[shown].h)} · ${activation==='linear'?`hₖ = ${f(w)}ᵏ × h₀`:`hₖ = tanh(${f(w)}hₖ₋₁)`}`,25,C.teal)+text(35,407,'Forward magnitude measures the state, not prediction accuracy.',18,C.muted);
  return wrap('DISTANCE / no new evidence does not mean no computation',out);
 }
 function gradient(beat,p,o){const L=Number(o.gap??20),w=Number(o.weight??.8),activation=o.activation||'linear',path=M.memoryChain(L,w,activation);let g=1;const gs=[1,...path.slice(1).reverse().map(s=>(g*=s.derivative))];
  const shown=beat>4?L:beat===4?Math.min(L,Math.floor(Math.min(L,5)+(L-Math.min(L,5))*p)):beat===3?Math.min(L,5):beat===2?Math.min(L,4):beat===1?1:0;
  const logs=gs.map(v=>Math.log10(Math.max(1e-20,Math.abs(v)))),low=Math.min(-1,Math.floor(Math.min(...logs))),high=Math.max(1,Math.ceil(Math.max(...logs)));
  const x=k=>92+630*k/L,y=v=>299-195*(v-low)/(high-low);let out='';
  out+=text(37,75,`${activation==='linear'?'Linear':'Tanh'} cell · w = ${f(w)} · ${L} recurrent links`,19,C.ink);
  for(const v of [...new Set([low,0,high])]){out+=`<line x1="92" y1="${y(v)}" x2="725" y2="${y(v)}" stroke="${C.line}" ${v===0?'stroke-dasharray="5 5"':''}/>`+text(78,y(v)+6,`10^${v}`,15,C.muted,'end');}
  out+=`<path d="M92 92V308H729" stroke="${C.muted}" fill="none"/>`;
  const points=gs.slice(0,shown+1).map((v,k)=>`${x(k)},${y(logs[k])}`).join(' ');
  out+=`<polyline points="${points}" fill="none" stroke="${C.coral}" stroke-width="4"/><circle cx="${x(shown)}" cy="${y(logs[shown])}" r="6" fill="${C.coral}"/>`;
  out+=text(92,334,'0',15,C.muted,'middle')+text(722,334,L,15,C.muted,'middle')+text(409,364,'Backward links crossed (0 = final state)',18,C.muted,'middle');
  out+=box(750,104,141,145,C.sand)+text(820,135,'SENSITIVITY',13,C.coral,'middle')+text(820,177,f(gs[shown]),24,C.coral,'middle')+text(820,211,`after ${shown} links`,15,C.muted,'middle')+text(820,236,'seed = 1',15,C.muted,'middle');
  out+=text(35,411,beat<4?'Predict the product before revealing the full backward path.':beat>=6?'Separate parameter examples: clip(38, 5) = 5; clip(0.0115, 5) = 0.0115.':activation==='linear'?`Each local derivative is w. Full path: ${f(w)}^${L} = ${f(gs.at(-1))}`:'Each local derivative is w(1 − hₜ²); saturation can shrink the product.',18,C.ink);
  return wrap('BACKWARD SENSITIVITY / magnitude on a log₁₀ scale',out);
 }
 const renderers={order,tasks,state,unroll,memory,gradient};
 function render(key,beat=0,progress=1,options={}){return renderers[key](beat,progress,options).replaceAll('a-teal',`${key}-a-teal`).replaceAll('a-coral',`${key}-a-coral`);}
 const api={render,format:f};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SequenceScenes=api;
})(typeof window!=='undefined'?window:globalThis);
