'use strict';
(() => {
 const M=window.TransferModel, $=id=>document.getElementById(id), fmt=n=>n.toLocaleString('en-US'), fixed=n=>Number(n.toFixed(3)).toString();
 function matrix(values,title,extra){return `<div class="matrix-block"><table class="number-matrix ${extra?'rf-table':''}"><caption>${title}</caption><tbody>${values.map((row,r)=>`<tr>${row.map((v,c)=>`<td ${extra?`class="${extra(r,c)}"`:''} style="background:hsl(100 24% ${96-v*3}%)">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
 function pretrained(){const c=+$('classes').value,n=513*c;$('classes-value').textContent=c;
 $('pretrained-flow').innerHTML=`<div class="node"><small>INPUT</small><strong>224 × 224 × 3</strong></div><b>→</b><div class="node reusable"><small>REUSED BACKBONE</small><strong>512 features</strong><span>11,176,512 parameters</span></div><b>→</b><div class="node mismatch"><small>NEW HEAD</small><strong>${c} class scores</strong><span>512 × ${c} weights + ${c} biases</span></div>`;
 $('pretrained-count').innerHTML=`New head: <strong>${fmt(n)}</strong> parameters. Backbone + head: <strong>${fmt(11176512+n)}</strong>.<br>The backbone size stays fixed as the label dictionary changes.`;}
 const examples={balanced:[[[1,3],[2,2]],[[0,2],[4,2]]],a:[[[2,4],[3,3]],[[0,1],[2,1]]],b:[[[0,1],[2,1]],[[2,4],[3,3]]]};
 function features(){const maps=examples[$('feature-example').value],z=M.pool(maps),r=M.classify(z);
 $('feature-maps').innerHTML=maps.map((a,i)=>matrix(a,`Channel ${i+1} → mean ${z[i]}`)).join('');
 $('feature-readout').innerHTML=`Pooled vector z = <strong>[${z.join(', ')}]</strong><br>Class A: ${z[0]} − 0.5 × ${z[1]} + 1 = <b>${r.logits[0]}</b><br>Class B: −0.5 × ${z[0]} + ${z[1]} + 1 = <b>${r.logits[1]}</b>`;
 $('feature-bars').innerHTML=r.probabilities.map((p,i)=>`<div class="prob-row"><span>Class ${i?'B':'A'}</span><div class="prob-track"><div class="prob-fill" style="width:${p*100}%"></div></div><b>${(p*100).toFixed(1)}%</b></div>`).join('');}
 let weights=[2,2,2],steps=0,last='No step taken yet.';
 const rates=[0.01,0.01,0.1],grad=[0.4,-0.2,0.6],groups=['Stem + layer1','Layer2–4','New head'];
 const flags=()=>['early','late','head'].map(x=>$(`train-${x}`).checked);
 function freezing(){const f=flags();$('freeze-route').innerHTML=weights.map((w,i)=>`<div class="freeze-block ${f[i]?'trainable':''}"><small>FORWARD PASS → ACTIVE</small><b>${groups[i]}</b><strong>${w.toFixed(3)}</strong><span class="state">${f[i]?'UNLOCKED · UPDATES':'FROZEN · FIXED'}<br>${fmt(M.counts[i])} parameters</span></div>`).join('');
 $('freeze-readout').innerHTML=`<strong>${fmt(M.trainableCount(f))}</strong> / 11,178,051 trainable parameters.<br>Steps taken: ${steps}. ${last}${f.every(x=>!x)?'<br>No groups are trainable: prediction still runs, but no weights will learn.':''}`;}
 $('sgd-step').addEventListener('click',()=>{const f=flags();weights=weights.map((w,i)=>M.update(w,grad[i],rates[i],f[i]));steps++;last='This step changed '+(groups.filter((_,i)=>f[i]).join(', ')||'no weights')+'.';freezing();});
 $('sgd-reset').addEventListener('click',()=>{weights=[2,2,2];steps=0;last='Weights reset to 2.';freezing();});
 const images={leaf:[[0,0,7,0],[0,7,9,7],[7,9,7,0],[0,7,0,0]],arrow:[[0,7,0,0],[7,7,7,7],[0,7,0,0],[0,0,0,0]]};
 function augmentation(){const task=$('aug-task').value,kind=$('aug-transform').value,b=+$('brightness').value,x=images[task],y=M.transform(x,kind,b);$('brightness-value').textContent=b;
 $('augmentation-matrices').innerHTML=matrix(x,'Original · values 0–9')+matrix(y,'Transformed · values 0–9');
 let note=task==='arrow'&&kind==='flip'?'Label changes: left becomes right. Do not keep the original “left” label.':task==='arrow'&&kind==='rotate'?'Label leaves the task: left becomes up, which is neither left nor right. Exclude this transform for this two-class task.':kind==='shift'?'Inspect the crop: shifting discards the rightmost column. Keep the label only if enough identifying evidence remains.':task==='leaf'?'Plausibly label-preserving for leaf species. Confirm that shape and other species cues remain visible.':'The direction label is unchanged by this geometry.';
 if(b!==0)note+=' Brightness is clipped to [0,9]; inspect whether important evidence disappears.';
 $('augmentation-readout').textContent=note;$('augmentation-readout').classList.toggle('warning',task==='arrow'&&['flip','rotate'].includes(kind));}
 function context(){const l=+$('depth').value,r=M.receptiveField(l),p=+$('patch').value,stats=M.patchStats(224,p);$('depth-value').textContent=l;
 const x=Array.from({length:7},(_,i)=>Array.from({length:7},(_,j)=>(i===0&&j===0)||(i===6&&j===6)?9:0));
 $('rf-grid').innerHTML=matrix(x,'7 × 7 input · marked corners = 9',(i,j)=>[Math.abs(i-3)<=l&&Math.abs(j-3)<=l?'covered':'',i===3&&j===3?'center':'',(i===0&&j===0)||(i===6&&j===6)?'marked':''].join(''))+`<p class="caption">Green: input positions in the centre output's theoretical receptive field. Orange outlines: the two distant marks. ${r>7?'The theoretical field extends beyond the image into padding.':''}</p>`;
 $('context-readout').innerHTML=`CNN field: <strong>${r} × ${r}</strong> after ${l} layer${l===1?'':'s'}. ${l>=3?'Both corner marks are covered.':'Both corner marks are still outside the field.'}<br><br>ViT patch tokens: <strong>${stats.tokens}</strong><br>Patch-to-patch scores per head: <strong>${fmt(stats.pairs)}</strong><br><small>224 × 224 input, ${p} × ${p} patches. Class token excluded.</small>`;}
 [['classes',pretrained],['feature-example',features],...['early','late','head'].map(x=>['train-'+x,freezing]),...['aug-task','aug-transform','brightness'].map(x=>[x,augmentation]),...['depth','patch'].map(x=>[x,context])].forEach(([id,fn])=>$(id).addEventListener('input',fn));
 [pretrained,features,freezing,augmentation,context].forEach(f=>f());
 document.querySelectorAll('.chkbtn').forEach(btn=>btn.addEventListener('click',()=>{
  const box=btn.closest('.box'),inputs=[...box.querySelectorAll('.qin')],msg=box.querySelector('.chkmsg');let right=0;
  inputs.forEach(inp=>{const raw=inp.value.trim(),normalise=s=>s.trim().toLowerCase().replace(/\s+/g,''),answers=inp.dataset.a.split('|');let ok=answers.some(a=>normalise(raw)===normalise(a));
   if(!ok&&/^[-+]?[\d,.]+$/.test(raw)){const value=Number(raw.replace(/,/g,''));ok=answers.some(a=>Number.isFinite(value)&&value===Number(a.replace(/,/g,'')));}
   inp.classList.toggle('ok',ok);inp.classList.toggle('no',raw!==''&&!ok);if(ok)right++;
  });
  msg.textContent=right===inputs.length?`All ${inputs.length} correct.`:`${right} of ${inputs.length} correct. Fix the red boxes and check again.`;msg.classList.toggle('good',right===inputs.length);
 }));
 const prefix='dl-transfer-v1:';
 document.querySelectorAll('textarea, .qin').forEach(el=>{try{el.value=localStorage.getItem(prefix+el.id)||'';}catch{$('saved-status').textContent='Storage unavailable; download answers to keep them.';}el.addEventListener('input',()=>{el.classList.remove('ok','no');try{localStorage.setItem(prefix+el.id,el.value);$('saved-status').textContent='Answers saved in this browser.';}catch{$('saved-status').textContent='Storage unavailable; download answers to keep them.';}});});
 $('export-answers').onclick=()=>{const written=Array.from(document.querySelectorAll('textarea')).map(el=>document.querySelector(`label[for="${el.id}"]`).textContent+'\n'+el.value),review=Array.from(document.querySelectorAll('.qin')).map((el,i)=>`Final review ${i+1}: ${el.value}`),text='TRANSFER LEARNING — MY WORKSHEET ANSWERS\n\n'+written.concat(review).join('\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='transfer-learning-answers.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('print').onclick=()=>window.print();
 if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));}});},{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('section[id]').forEach(x=>obs.observe(x));}
})();
