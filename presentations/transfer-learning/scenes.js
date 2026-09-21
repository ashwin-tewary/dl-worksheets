/* Numerical scene renderers. Every frame is a deterministic function of beat + progress. */
(function(root){
 const M=typeof module!=='undefined'&&module.exports?require('./model'):root.TransferModel;
 const C={ink:'#173d36',muted:'#5b7166',teal:'#17685d',mint:'#d9e8d7',paper:'#f7f6ee',white:'#fffefa',line:'#c9d5c6',gold:'#f0ce81',orange:'#b95632',pale:'#f9e7d6'};
 const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t);},mix=(a,b,t)=>a+(b-a)*t;
 const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const txt=(x,y,s,size=20,color=C.ink,weight=500,anchor='start',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}" ${extra}>${escape(s)}</text>`;
 const rect=(x,y,w,h,fill=C.white,stroke=C.line,r=12,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${extra}/>`;
 const group=(s,opacity=1,tx=0,ty=0)=>opacity<=0?'':`<g opacity="${clamp(opacity)}" transform="translate(${tx} ${ty})">${s}</g>`;
 function arrow(x1,y1,x2,y2,color=C.teal,width=3,opacity=1,dash=''){
  const a=Math.atan2(y2-y1,x2-x1),r=9,px=x2-r*Math.cos(a),py=y2-r*Math.sin(a),dx=5*Math.sin(a),dy=5*Math.cos(a);
  return `<g opacity="${opacity}"><path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/><path d="M${x2},${y2} L${px+dx},${py-dy} L${px-dx},${py+dy}Z" fill="${color}"/></g>`;
 }
 const dot=(x,y,r=8,color=C.teal)=>`<circle cx="${x}" cy="${y}" r="${r+6}" fill="${color}" opacity=".14"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
 function cell(x,y,v,size=44,{highlight=false,muted=false,marked=false}={}){
  const fill=highlight?C.gold:muted?C.paper:`hsl(105 22% ${96-Math.min(9,Math.abs(Number(v)||0))*2.7}%)`;
  return rect(x,y,size-3,size-3,fill,marked?C.orange:highlight?C.orange:C.line,4,marked?'stroke-width="3"':'')+txt(x+(size-3)/2,y+(size-3)/2+7,v,22,C.ink,600,'middle');
 }
 function grid(values,x,y,size=44,highlight=()=>false){return values.map((r,i)=>r.map((v,j)=>cell(x+j*size,y+i*size,v,size,{highlight:highlight(i,j)})).join('')).join('');}
 const tag=(x,y,w,label,fill=C.mint,color=C.teal)=>rect(x,y,w,32,fill,'none',16)+txt(x+w/2,y+22,label,16,color,600,'middle');
 const leaf=(x,y,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 65 Q-15 12 62 0 Q79 66 0 65Z" fill="#86a987" stroke="${C.teal}" stroke-width="3"/><path d="M-8 80L54 12M12 54L3 30M25 39L53 38" fill="none" stroke="${C.teal}" stroke-width="3"/></g>`;
 const label=(x,y,title,sub)=>txt(x,y,title,20,C.ink,700)+txt(x,y+27,sub,16,C.muted);
 function pretrained(s,p){
  const t=ease(p),target=s>=2,swap=s===2?t:target?1:0;
  let a=label(55,40,target?'TARGET TASK':'SOURCE TASK',target?'120 leaf images · 3 species':'Learned on an earlier dataset');
  a+=rect(45,95,175,245)+group(txt(132,135,'SOURCE',16,C.muted,600,'middle')+rect(75,155,57,70,C.mint)+rect(140,155,57,70,C.pale)+txt(135,272,'many labels',18,C.muted,500,'middle'),1-swap);
  a+=group(leaf(90,155,1.2)+txt(132,285,'new leaf image',18,C.ink,600,'middle'),swap);
  a+=rect(285,95,365,245,C.mint,C.teal)+txt(467,128,'REUSED BACKBONE',17,C.teal,700,'middle');
  const kernel=[[-1,0,1],[-1,0,1],[-1,0,1]];
  a+=grid(kernel,310,155,43,()=>s===1)+txt(515,190,'edges',20)+txt(515,224,'textures',20)+txt(515,258,'parts',20)+txt(467,320,'learned θ* stays in place',18,C.teal,600,'middle');
  a+=arrow(227,215,277,215)+arrow(660,215,730,215);
  a+=rect(745,95,205,245,'none',C.line,12,'stroke-dasharray="7 7"');
  if(s<=3){const q=s===3?t:0;a+=group(rect(745,95,205,245,s===2?C.pale:C.white)+txt(847,132,'OLD HEAD',17,C.orange,700,'middle')+txt(847,190,'1,000',42,C.ink,600,'middle')+txt(847,223,'source scores',19,C.muted,500,'middle')+(s===2?txt(847,287,'No leaf labels',18,C.orange,700,'middle'):txt(847,287,'source labels',18,C.muted,500,'middle')),1-q,0,-q*90);}
  if(s>=4){const q=s===4?t:1;a+=group(rect(745,95,205,245,C.pale,C.orange)+txt(847,132,'NEW HEAD',17,C.orange,700,'middle')+[0,1,2].map(i=>rect(783,160+i*43,130,30,C.white,C.orange,7)+txt(848,181+i*43,`species ${'ABC'[i]}`,18,C.ink,600,'middle')).join('')+txt(847,320,'1,539 parameters',18,C.orange,600,'middle'),q,(1-q)*85,0);}
  if(s===5)a+=dot(mix(210,930,t),355,9);
  a+=arrow(205,355,935,355,C.teal,2,s>=5?.55:.13);
  if(s>=4)a+=tag(310,374,280,'512 features → 3 scores');
  if(s>=6)a+=tag(758,374,180,'TRAIN THIS HEAD',C.pale,C.orange)+arrow(849,370,849,341,C.orange);
  if(s===3)a+=group(txt(847,220,'empty socket',20,C.muted,500,'middle'),t);
  a+=txt(55,450,s>=6?'Reuse learned values; train the new mapping; validate.':'Watch the filter numbers: changing the task does not reset them.',19,C.muted);
  return a;
 }
 const maps=[[[1,3],[2,2]],[[0,2],[4,2]]],prefix=[[0,1,4,6,8],[0,0,2,6,8]];
 function features(s,p){
  const t=ease(p),k=Math.min(4,s),active=s>=1&&s<=4?s-1:-1;
  let a=label(48,35,'TWO FEATURE CHANNELS','Spatial values are pooled within each channel.');
  maps.forEach((m,c)=>{const y=108+c*172;a+=txt(48,y-14,`Channel ${c+1}`,18,C.teal,700)+grid(m,48,y,54,(r,col)=>r*2+col===active);
   a+=arrow(185,y+51,342,y+51,C.teal,2,.4);
   if(s<=4){const n=active>=0&&t<.98?k-1:k,acc=prefix[c][Math.max(0,n)];a+=rect(355,y-3,238,112,C.white)+txt(473,y+28,'ACCUMULATOR',16,C.muted,600,'middle')+txt(473,y+74,`${acc}`,35,C.teal,700,'middle');
    if(active>=0){const sx=48+(active%2)*54+25,sy=y+Math.floor(active/2)*54+28,tx=473,ty=y+69;
     a+=group(rect(mix(sx,tx,t)-22,mix(sy,ty,t)-27,44,44,C.gold,C.orange,8)+txt(mix(sx,tx,t),mix(sy,ty,t)+3,m.flat()[active],25,C.ink,700,'middle'),t<.98?1:0);}
   }else{a+=rect(355,y-3,238,112,C.mint,C.teal)+txt(473,y+28,'GLOBAL MEAN',16,C.teal,600,'middle')+txt(473,y+74,'8 ÷ 4 = 2',29,C.teal,700,'middle');}
  });
  if(s<=4){a+=rect(673,110,269,265,C.paper)+txt(808,153,'FEATURE VECTOR',16,C.muted,600,'middle')+txt(808,235,'[ ?, ? ]',38,C.muted,600,'middle')+txt(808,319,s===4?'Both sums are 8.':'Collect four per channel.',18,C.muted,500,'middle');}
  if(s===5){a+=rect(673,110,269,265,C.mint,C.teal)+txt(808,153,'FEATURE VECTOR z',16,C.teal,600,'middle');[0,1].forEach(c=>{const x=782+c*60,y=231;a+=rect(x-24,y-30,50,54,C.white)+group(txt(mix(473,x,t),mix(182+c*172,y+7,t),'2',32,C.teal,700,'middle'));});a+=txt(808,319,'one value per channel',18,C.muted,500,'middle');}
  if(s>=6){a+=txt(689,79,'dashed links: ×−0.5',17,C.orange,600);[0,1].forEach(c=>{const y=108+c*172,show=s>6?1:clamp(t*2-c);a+=arrow(603,y+48,678,y+48,C.teal,2)+arrow(603,108+(1-c)*172+48,678,y+48,C.orange,2,.65,'4 4')+txt(637,y+35,'×1',15,C.teal,600,'middle')+rect(686,y-3,255,112,C.pale,C.orange)+txt(813,y+26,`CLASS ${c?'B':'A'} SCORE`,16,C.orange,600,'middle')+group(txt(813,y+71,'2 − 1 + 1 = 2',24,C.ink,700,'middle'),show);});}
  a+=rect(48,422,894,10,C.line,'none',5);
  if(s>=7){a+=rect(48,422,447*t,10,C.teal,'none',5)+rect(48+447,422,447*t,10,C.orange,'none',5)+txt(48,411,'Class A · 50%',18,C.teal,600)+txt(942,411,'Class B · 50%',18,C.orange,600,'end');}
  else a+=txt(48,408,s===4?'PAUSE · Four values, sum 8. What should the mean be?':s>=5?'The spatial maps have become a compact description.':`${k} of 4 positions collected in each channel`,18,C.muted);
  return a;
 }
 function freezing(s,p){
  const t=ease(p),late=s>=5,whead=s>=7?(t>.85?1.88:1.94):s>=4?(s===4&&t<=.85?2:1.94):2,wlate=s>=7&&t>.85?2.002:2;
  let a=label(48,37,'FOLLOW THE TWO DIRECTIONS','Green: forward computation · orange: parameter update signals');
  const xs=[55,305,555],names=['EARLY GROUP','LATER GROUP','NEW HEAD'],weights=[2,wlate,whead];
  xs.forEach((x,i)=>{const train=i===2||(i===1&&late);a+=rect(x,105,206,157,train?C.pale:C.mint,train?C.orange:C.teal)+tag(x+21,120,164,train?'UNLOCKED':'LOCKED',train?C.pale:C.mint,train?C.orange:C.teal)+txt(x+103,183,names[i],17,C.ink,700,'middle')+txt(x+103,228,weights[i].toFixed(3),32,C.ink,700,'middle');a+=txt(x+103,292,'forward active',17,C.teal,600,'middle');});
  a+=rect(820,105,126,157,s>=2?C.pale:C.white)+txt(883,180,'LOSS',20,C.ink,700,'middle')+txt(883,219,'L',36,C.orange,600,'middle');
  [0,1].forEach(i=>a+=arrow(xs[i]+212,186,xs[i+1]-8,186));a+=arrow(768,186,812,186);
  a+=arrow(57,307,946,307,C.teal,3,.4);if(s===1)a+=dot(mix(57,943,t),307,10,C.teal);
  if(s>=3){a+=arrow(883,350,658,350,C.orange,3);a+=txt(770,378,'ghead = +0.6',18,C.orange,600,'middle');if(s===3||s===6)a+=dot(mix(883,658,t),350,9,C.orange);}
  if(s>=6){a+=arrow(650,350,408,350,C.orange,3)+txt(500,378,'glate = −0.2',18,C.orange,600,'middle');if(s===6)a+=dot(mix(650,408,t),350,9,C.orange);}
  if(s===4||s===7){const active=s===4?[2]:[1,2];active.forEach(i=>{const x=xs[i]+103;a+=arrow(x,340,x,268,C.orange,3)+dot(x,mix(340,270,t),8,C.orange);});}
  if(s>=4)a+=tag(580,406,350,s>=7?'head: 1.940 → 1.880':'head: 2.000 → 1.940',C.pale,C.orange);
  a+=txt(55,442,s>=7?'early: 2.000 → 2.000 · late: 2.000 → 2.002':'Frozen does not mean bypassed.',19,C.teal,600);
  return a;
 }
 const leafPixels=[[0,0,7,0],[0,7,9,7],[7,9,7,0],[0,7,0,0]],arrowPixels=[[0,7,0,0],[7,7,7,7],[0,7,0,0],[0,0,0,0]];
 function augmentation(s,p){
  const t=ease(p),isArrow=s>=4,source=isArrow?arrowPixels:leafPixels;
  let a=tag(45,21,282,'TRAIN · 84 originals',C.mint)+tag(345,21,285,'VALIDATION · 18 originals',C.paper,C.muted)+tag(648,21,303,'TEST · 18 originals',C.paper,C.muted);
  a+=txt(160,102,'TRAINING ORIGINAL',18,C.teal,700,'middle')+txt(638,102,'TRANSFORMED VIEW',18,C.teal,700,'middle');
  a+=grid(source,48,124,57);
  a+=rect(520,124,228,228,C.paper,C.line,4,'stroke-dasharray="7 7"');
  if(s>=1){source.forEach((row,r)=>row.forEach((v,c)=>{
   let x=520+c*57,y=124+r*57,opacity=1;
   if(s===1){x=mix(48+c*57,x,t);y=124+r*57-25*Math.sin(t*Math.PI);opacity=t;}
   if(s===2||s===5){const q=ease(clamp((p-(c%2)*.12)/.88));x=mix(520+c*57,520+(3-c)*57,q);y=124+r*57+(c<2?-18:18)*Math.sin(q*Math.PI);}
   else if(s===3||s>=6)x=520+(3-c)*57;
   let value=v;
   if(s>=7)value=s===7?(t>.5?Math.min(9,v+3):v):Math.min(9,v+3);
   a+=group(cell(x,y,value,57,{highlight:(s===2||s===5)&&t<1,marked:s>=7&&v===7}),opacity);
  }));}
  a+=arrow(300,235,483,235,C.teal,3,.6);
  a+=txt(388,202,s===1?'COPY':s>=7?'ADD 3 + CLIP':'FLIP COLUMNS',17,C.teal,700,'middle');
  a+=tag(63,370,194,isArrow?'label: LEFT':'label: species A',C.mint);
  if(s>=1){const bad=s===5,right=s>=6;const labelText=bad?'label: LEFT ✕':right?'label: RIGHT':'label: '+(isArrow?'LEFT':'species A');a+=tag(525,370,223,labelText,bad?C.pale:C.mint,bad?C.orange:C.teal);}
  a+=rect(802,124,146,228,s===5?C.pale:C.white)+txt(875,159,'LABEL',17,C.muted,600,'middle')+txt(875,189,'CHECK',17,C.muted,600,'middle');
  a+=txt(875,257,s===5?'INVALID':s===3?'PREDICT':s>=6?'REPAIRED':'?',s>=3?19:48,s===5?C.orange:C.teal,700,'middle');
  if(s>=7)a+=txt(875,303,'7 + 3 → 9',18,C.orange,600,'middle');
  a+=txt(48,444,s===5?'Same pixel rule. Different meaning. The old label is now wrong.':s===3?'Is this transform safe for every task? Predict before continuing.':s>=8?'Augmented siblings belong to the same source split.':'Every displayed number stays attached to its moving pixel.',19,s===5?C.orange:C.muted);
  return a;
 }
 const attentionWeights=[.05,.05,.1,.1,.4,.05,.1,.05,.1];
 function attentionSum(){return attentionWeights.reduce((a,v,i)=>a+v*(i+1),0);}
 function context(s,p){
  const t=ease(p);let a='';
  if(s<=3){a+=label(50,36,'CNN · BUILD CONTEXT THROUGH DEPTH','The centre output can only use positions inside its field.');
   const x=70,y=99,cs=43;const vals=Array.from({length:7},(_,r)=>Array.from({length:7},(_,c)=>(r===0&&c===0)||(r===6&&c===6)?9:0));
   a+=grid(vals,x,y,cs);a+=rect(x,y,40,40,'none',C.orange,4)+rect(x+6*cs,y+6*cs,40,40,'none',C.orange,4);
   const width=s===0?1:mix(1+2*(s-1),1+2*s,t),n=width*cs;
   a+=rect(x+3.5*cs-n/2,y+3.5*cs-n/2,n-3,n-3,C.teal,C.teal,4,'fill-opacity=".14" stroke-width="3"');
   a+=rect(470,105,456,285,C.white)+txt(698,161,`${s} CONVOLUTION${s===1?'':'S'}`,18,C.muted,600,'middle')+txt(698,235,`${1+2*s} × ${1+2*s}`,56,C.teal,600,'middle')+txt(698,288,s===3?'Both corner marks are reachable.':'The corners are outside the field.',21,C.ink,500,'middle')+txt(698,339,'kernel 3 × 3 · stride 1',19,C.muted,500,'middle');
   a+=txt(50,451,s===3?'Theoretical coverage ≠ equal influence. CNNs can learn global context.':'Watch the field grow by two input positions per layer.',19,C.muted);
  }else if(s<=5){a+=label(50,36,'ViT · FROM PIXELS TO POSITIONED TOKENS','Separate toy image: 6 × 6 pixels → nine 2 × 2 patches.');
   for(let k=0;k<9;k++){const row=Math.floor(k/3),col=k%3,gap=s===4?mix(0,17,t):17;let x=53+col*(96+gap),y=105+row*(96+gap);
    const tx=543+col*132,ty=113+row*103;
    if(s===5){x=mix(x,tx,t);y=mix(y,ty,t);}
    const patch=[[k%3,(k+1)%5],[(k+2)%7,k===4?9:1]];
    if(s===4)a+=grid(patch,x,y,47)+txt(x+44,y+106,`P${k+1}`,15,C.teal,700,'middle');
    else a+=group(grid(patch,x,y,47),1-t)+group(rect(x,y,116,72,C.mint,C.teal)+txt(x+58,y+29,`TOKEN ${k+1}`,17,C.teal,700,'middle')+txt(x+58,y+54,`+ position ${k+1}`,16,C.muted,500,'middle'),t);
   }
   if(s===4){a+=rect(518,111,417,279,C.white)+txt(727,164,'SPLIT → FLATTEN',22,C.teal,700,'middle')+txt(727,213,'PROJECT → ADD POSITION',20,C.teal,700,'middle')+txt(727,289,'Patch IDs track identity.',19,C.muted,500,'middle')+txt(727,322,'They are not embedding values.',19,C.muted,500,'middle');}
   else {a+=group(txt(70,177,'4 pixels',29,C.teal,600)+arrow(70,209,355,209,C.teal,3)+txt(70,249,'learned projection',24,C.teal,600)+txt(70,285,'+ position information',22,C.muted),clamp((t-.6)/.4));}
   a+=txt(50,461,'The token retains a patch’s information in a learned feature vector.',19,C.muted);
  }else if(s<=7){a+=label(50,36,'GLOBAL ATTENTION · ONE QUERY, EVERY KEY','Toy scalar values V = [1, …, 9]; illustrative non-uniform weights.');
   const qx=729,qy=245;
   for(let k=0;k<9;k++){const x=50+(k%3)*134,y=104+Math.floor(k/3)*105,w=attentionWeights[k];
    a+=arrow(x+113,y+38,qx-62,qy,C.teal,1+w*12,.45);
    if(s===6){const u=clamp((p-(k%3)*.09)/.82);a+=dot(mix(x+113,qx-62,u),mix(y+38,qy,u),4+w*10,C.teal);}
    a+=rect(x,y,111,76,k===4?C.pale:C.mint,k===4?C.orange:C.teal)+txt(x+55,y+29,`V${k+1} = ${k+1}`,20,C.ink,700,'middle')+txt(x+55,y+57,`a = ${w.toFixed(2)}`,17,C.teal,500,'middle');
   }
   a+=rect(qx-60,qy-69,246,141,C.teal,C.teal)+txt(qx+63,qy-24,'QUERY 5',20,C.white,700,'middle')+txt(qx+63,qy+29,s===7?'5.15':'Σ aiVi',40,C.white,600,'middle');
   if(s===7)a+=tag(638,354,293,'weights sum to 1');
   a+=txt(50,450,'Thickness shows different weights. Every token is eligible to contribute.',19,C.muted);
  }else{a+=label(50,36,'GLOBAL CONNECTIONS HAVE A COST','224 × 224 input · patch tokens only · one attention head');
   const sizes=[16,32];sizes.forEach((patch,i)=>{const st=M.patchStats(224,patch),x=52+i*460;
    a+=rect(x,100,423,299,i?C.pale:C.mint)+txt(x+211,141,`${patch} × ${patch} PATCHES`,20,i?C.orange:C.teal,700,'middle')+txt(x+211,216,`${st.tokens} tokens`,37,C.ink,600,'middle')+txt(x+211,292,st.pairs.toLocaleString('en-US'),46,i?C.orange:C.teal,700,'middle')+txt(x+211,333,'token-pair scores',19,C.muted,500,'middle');
   });a+=txt(50,452,'Fewer, larger patches reduce pair count but give coarser spatial detail.',19,C.muted);
  }
  return a;
 }
 const renderers={pretrained,features,freezing,augmentation,context};
 function render(name,index,progress=1){if(!renderers[name])throw new Error('Unknown animation');const p=clamp(progress);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 480" class="teaching-svg" role="img" aria-label="${escape(name)} animation, beat ${index+1}" data-beat="${index}" data-progress="${p.toFixed(3)}"><rect width="1000" height="480" fill="${C.paper}"/><g font-family="system-ui, sans-serif">${renderers[name](index,p)}</g></svg>`;}
 const api={render,attentionWeights,attentionSum};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TransferScenes=api;
})(typeof window!=='undefined'?window:this);
