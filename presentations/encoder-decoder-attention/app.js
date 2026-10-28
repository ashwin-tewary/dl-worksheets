/* DOM orchestration, accessible playback and browser-local worksheet progress. */
(()=>{
 'use strict';
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const M=window.AttentionModel,S=window.AttentionScenes,stories=window.AttentionStories;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),players=[],controllers=[];
 const f=(v,d=3)=>Number(v).toFixed(d),vec=v=>'['+v.map(x=>f(x)).join(', ')+']';
 const presets=[[1,0],[0,1],[1,1]],targetNames=['je','t’aime','EOS'];
 function slider(key,name,min,max,step,value){return `<label>${name}: <output data-output="${key}">${value}</output><input aria-label="${name}" data-option="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
 function controls(key){
  if(key==='encoder')return '<label>Decoder mode<select data-option="teacher" aria-label="Decoder mode"><option value="true">Training: teacher forcing</option><option value="false">Inference: previous prediction</option></select></label>';
  if(key==='bottleneck')return slider('length','Source length',3,16,1,8)+slider('retention','Retention r',0,1,.05,.5);
  return slider('qx','Query coordinate 1',-2,2,.1,1)+slider('qy','Query coordinate 2',-2,2,.1,0)+(key==='recipe'?slider('temperature','Temperature T',.25,2,.25,1)+'<label><input type="checkbox" data-option="mask"> Treat third source as padding</label>':'')+(key==='multiplicative'?'<label>Scoring function<select data-option="method" aria-label="Scoring function"><option value="dot">Dot: qᵀh</option><option value="general">General: qᵀWa h</option></select></label>':'')+`<div class="preset-row" role="group" aria-label="Target query presets">${targetNames.map((name,i)=>`<button data-preset="${i}" type="button">t = ${i+1} · ${name}</button>`).join('')}</div>`;
 }
 function table(headers,rows,caption){return `<div class="math-scroll"><table class="math-table"><caption>${caption}</caption><thead><tr>${headers.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;}
 function readout(key,beat,o){
  if(key==='encoder'){const feed=M.decoderInputs(['je','t’aime','EOS'],o.teacher,['tu','aimes','EOS']);return `<p class="hint">The encoder toy recurrence is hᵢ = tanh(xᵢ + 0.5hᵢ₋₁), with x = [1, 0.5, −0.5]. These scalars isolate state updates; they are not token IDs or learned embeddings.</p>`+(beat>=4?table(['Step','Input to decoder','Scripted output'],feed.map((x,i)=>`<tr><th>${i+1}</th><td>${x}</td><td>${o.teacher?['je','t’aime','EOS'][i]:['tu','aimes','EOS'][i]}</td></tr>`),'Two clocks: only the target clock is tabulated here. Inference outputs illustrate an error; no model is being trained.'):'<p>Before the reveal: what input begins target generation, and what is fed back next?</p>');}
  if(key==='bottleneck'){if(beat<3)return '<p>Make a prediction before seeing the final-state difference. Changing length changes computation; the state width remains one.</p>';const a=M.encode([1,...Array(o.length-1).fill(0)],o.retention),b=M.encode([-1,...Array(o.length-1).fill(0)],o.retention);return table(['Position','State from +1','State from −1','Absolute gap'],a.map((x,i)=>`<tr><th>${i+1}</th><td>${f(x,6)}</td><td>${f(b[i],6)}</td><td>${f(Math.abs(x-b[i]),6)}</td></tr>`),'Toy state trajectory, full precision calculation; six decimal places displayed.');}
  const r=S.result(key,o);
  if(beat<3)return key==='additive'?'<p>Trace the scoring network first. Weights and context stay hidden until after the prediction stop. In this toy Wq and Wh are identity, b = [0,0] and v = [1,−1].</p>':'<p>Weights and context stay hidden until after the prediction stop. Source states: h₁ = [1,0], h₂ = [0,1], h₃ = [1,1].</p>';
  let out=table(['Source','State hᵢ','Score eᵢ','Weight αᵢ'],M.H.map((h,i)=>`<tr data-source="${i}"><th scope="row">${i+1} · ${['I','love',o.mask?'PAD':'you'][i]}</th><td>${vec(h)}</td><td>${o.mask&&i===2?'masked':f(r.scores[i])}</td><td>${f(r.weights[i])}</td></tr>`),'One query, three source positions. Weights sum to 1 before rounding.');
  if(beat>=4)out+=`<p class="context-line">c = ${vec(r.context)}<br>Σ αᵢ = ${f(r.weights.reduce((a,b)=>a+b,0))}</p><p>c[1] = ${r.weights.map((a,i)=>`${f(a)} × ${M.H[i][0]}`).join(' + ')} = ${f(r.context[0])}. Values displayed to three decimals.</p>`;
  if(key==='additive')out+=table(['Source','u = Wq q + Wh h','tanh(u)','vᵀ tanh(u)'],M.H.map((h,i)=>{const u=h.map((v,j)=>v+[o.qx,o.qy][j]);return `<tr><th>h${i+1}</th><td>${vec(u)}</td><td>${vec(u.map(Math.tanh))}</td><td>${f(r.scores[i])}</td></tr>`;}),'The score network is visible for every source/query pair.');
  if(key==='multiplicative')out+=`<p>Wa = [[1,0],[0,2]] for general scoring. ${o.method==='general'?'Transformed states: [1,0], [0,2], [1,2].':'Dot uses the original states directly.'} Scores are unscaled.</p>`;
  if(beat>=5){out+='<h4>Target × source attention map</h4><p class="hint">Each row uses a hand-chosen query preset, except the selected row, which follows your query sliders. Click a target row to load its preset. These are numerical experiments, not learned translation alignments.</p><div class="math-scroll"><table class="math-table heatmap"><caption>Rows normalize independently. Darker means higher weight; exact weights remain printed.</caption><thead><tr><th>Target step</th><th>1 · I</th><th>2 · love</th><th>3 · '+(o.mask?'PAD':'you')+'</th></tr></thead><tbody>';
   presets.forEach((q,i)=>{const a=i===o.target?r:S.result(key,{...o,qx:q[0],qy:q[1]});out+=`<tr class="${i===o.target?'selected':''}"><th><button data-target="${i}" aria-label="Load target step ${i+1} preset">${i+1} · ${targetNames[i]}${i===o.target?' *':''}</button></th>${a.weights.map(v=>`<td style="background:rgba(18,101,91,${.10+.65*v});color:${v>.65?'#fffefa':'#183c35'}">${f(v)}</td>`).join('')}</tr>`;});out+='</tbody></table></div>';
  }return out;
 }
 function stopOthers(player){players.forEach(p=>{if(p!==player)p.pause();});}
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $$('[data-animation]').forEach((host,index)=>{
  const key=host.dataset.animation,story=stories[key],o={qx:1,qy:0,temperature:1,length:8,retention:.5,method:'dot',mask:false,teacher:true,target:0};
  host.innerHTML=`<div class="anim-heading"><span class="eyebrow">GUIDED ANIMATION / ${String(index+1).padStart(2,'0')}</span><h3>${story.title}</h3><p>Play the sequence, pause to predict, then experiment. Nothing plays automatically.</p></div><div class="lab-controls">${controls(key)}</div><div class="anim-toolbar" role="group" aria-label="${key} playback"><button class="anim-play">▶ Play</button><button class="anim-previous">← Back</button><button class="anim-next">Next →</button><button class="anim-replay">↺ Replay</button><label>Speed <select class="anim-speed" aria-label="${key} playback speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><span class="anim-counter"></span></div><div class="anim-viewport" tabindex="0" role="region" aria-label="${key} numbered diagram, scroll horizontally"><div class="anim-canvas"></div></div><p class="anim-pan-hint">On small screens, scroll across the diagram; numbers keep their readable size.</p><div class="anim-timeline"><label>Scrub the walkthrough<input aria-label="${key} timeline" type="range" class="anim-scrubber" min="0" max="5" value="0" step="0.01"></label><button class="anim-download">Download SVG frame ↓</button></div><div class="anim-beats" role="group" aria-label="${key} animation beats">${story.steps.map((s,i)=>`<button data-beat="${i}"><span>${i+1}</span>${s.title}${s.checkpoint?' · Predict':''}</button>`).join('')}</div><div class="anim-caption" aria-live="polite"><span class="anim-phase"></span><h4></h4><p class="anim-narration"></p><div class="anim-equation"></div><p class="anim-prompt" hidden>Pause for a prediction. Continue or Next reveals the next step.</p></div><p class="anim-assumptions">${story.note}</p><p class="anim-reduced" ${reduced.matches?'':'hidden'}>Reduced motion: Play advances one stable step at a time.</p><div class="readout"></div>`;
  const find=s=>$(s,host);let previous=-1,readoutKey='';
  function render(state,force=false){
   const step=story.steps[state.index];find('.anim-canvas').innerHTML=S.render(key,state.index,state.progress,o);
   host.dataset.currentBeat=state.index;host.dataset.playing=state.playing;host.dataset.checkpoint=state.checkpoint;
   const action=state.playing?'Pause':state.checkpoint?'Continue':reduced.matches?'Next step':'Play';find('.anim-play').textContent=(state.playing?'Ⅱ ':'▶ ')+action;find('.anim-play').setAttribute('aria-label',`${action} ${key} animation`);
   find('.anim-previous').disabled=state.index===0;find('.anim-next').disabled=state.index===5;
   find('.anim-counter').textContent=`${state.index+1} / 6`;find('.anim-scrubber').value=state.index===0?0:state.index-1+state.progress;find('.anim-scrubber').setAttribute('aria-valuetext',step.title);
   if(force||previous!==state.index){find('.anim-caption h4').textContent=step.title;find('.anim-narration').textContent=step.narration;find('.anim-equation').textContent=step.equation;$$('[data-beat]',host).forEach((b,i)=>{b.classList.toggle('current',i===state.index);b.setAttribute('aria-pressed',String(i===state.index));});previous=state.index;}
   find('.anim-phase').textContent=step.checkpoint?'PREDICT BEFORE REVEAL':'FOLLOW THE MECHANISM';find('.anim-caption').classList.toggle('is-checkpoint',state.checkpoint);find('.anim-prompt').hidden=!state.checkpoint;
   const signature=state.index+JSON.stringify(o);if(force||readoutKey!==signature){find('.readout').innerHTML=readout(key,state.index,o);readoutKey=signature;}
  }
  const player=window.SequenceTimeline.createPlayer(story.steps,render,{reduced:()=>reduced.matches,transition:1400,hold:5200});players.push(player);
  function sync(){ $$('[data-option]',host).forEach(input=>{const prop=input.dataset.option;if(input.type==='checkbox')input.checked=o[prop];else input.value=String(o[prop]);const out=$(`[data-output="${prop}"]`,host);if(out)out.value=o[prop];});$$('[data-preset]',host).forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.preset===o.target)));}
  function refresh(){player.pause();sync();render({...player.state},true);}
  function preset(i){o.target=i;[o.qx,o.qy]=presets[i];refresh();}
  find('.anim-play').onclick=()=>{if(player.state.playing)player.pause();else{stopOthers(player);player.play();}};
  find('.anim-next').onclick=()=>{stopOthers(player);player.next();};find('.anim-previous').onclick=()=>player.previous();find('.anim-replay').onclick=()=>player.restart();
  find('.anim-speed').onchange=e=>player.speed(+e.target.value);find('.anim-scrubber').oninput=e=>{stopOthers(player);player.seek(+e.target.value);};
  $$('[data-beat]',host).forEach(b=>b.onclick=()=>{stopOthers(player);player.seek(+b.dataset.beat);});
  find('.anim-download').onclick=()=>download(`${key}-beat-${player.state.index+1}.svg`,find('.anim-canvas').innerHTML,'image/svg+xml');
  $$('[data-option]',host).forEach(input=>input.addEventListener(input.type==='range'?'input':'change',()=>{const prop=input.dataset.option;o[prop]=input.type==='checkbox'?input.checked:input.type==='range'?+input.value:prop==='teacher'?input.value==='true':input.value;refresh();}));
  $$('[data-preset]',host).forEach(b=>b.onclick=()=>preset(+b.dataset.preset));find('.readout').onclick=e=>{const b=e.target.closest('[data-target]');if(b){const target=+b.dataset.target;preset(target);find(`[data-target="${target}"]`)?.focus({preventScroll:true});}};
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)player.pause();}).observe(host);
  reduced.addEventListener('change',()=>{player.pause();if(reduced.matches)player.seek(player.state.index);find('.anim-reduced').hidden=!reduced.matches;});
  controllers.push({player,host,refresh});sync();
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)players.forEach(p=>p.pause());});
 const storeKey='dl-attention-v1';let saved={answers:{},notes:''};try{const x=JSON.parse(localStorage.getItem(storeKey));if(x&&typeof x==='object'&&x.answers&&typeof x.answers==='object')saved=x;}catch{}
 function persist(){try{localStorage.setItem(storeKey,JSON.stringify(saved));$('#save-status').textContent='Saved in this browser';}catch{$('#save-status').textContent='Storage unavailable; use Export to keep a copy.';}}
 function number(value){const s=value.trim();if(/^[+-]?(\d+(\.\d*)?|\.\d+)\s*\/\s*[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)){const [a,b]=s.split('/').map(Number);return b===0?NaN:a/b;}return s===''?NaN:Number(s);}
 function correct(form,value){return form.dataset.kind==='choice'?value===form.dataset.answer:Number.isFinite(number(value))&&Math.abs(number(value)-Number(form.dataset.answer))<=.002;}
 function progress(){const count=$$('.check.correct').length;$('#progress').value=count;$('#progress-label').textContent=`${count} of 18 checks answered correctly`;}
 $$('.check').forEach(form=>{
  const old=saved.answers[form.id];if(old&&typeof old.value==='string'){if(form.dataset.kind==='choice'){const radio=$$('input[type=radio]',form).find(x=>x.value===old.value);if(radio)radio.checked=true;}else form.elements.answer.value=old.value;if(old.checked&&correct(form,old.value)){form.classList.add('correct');$('.feedback',form).textContent='Correct — saved from your previous visit.';}}
  function answer(){return form.dataset.kind==='choice'?$('input:checked',form)?.value||'':form.elements.answer.value;}
  form.addEventListener('submit',e=>{e.preventDefault();const value=answer(),ok=correct(form,value);form.classList.toggle('correct',ok);$('.feedback',form).textContent=ok?'Correct. Explain your reasoning, then compare the worked answer.':value?'Try again. Trace the given values; the worked reasoning can help.':'Choose or enter an answer first.';saved.answers[form.id]={value,checked:ok};progress();persist();});
  form.addEventListener('input',()=>{form.classList.remove('correct');$('.feedback',form).textContent='';saved.answers[form.id]={value:answer(),checked:false};progress();persist();});
 });progress();
 $('#design-notes').value=typeof saved.notes==='string'?saved.notes:'';$('#design-notes').oninput=e=>{saved.notes=e.target.value;persist();};
 $('#export').onclick=()=>download('attention-worksheet-answers.json',JSON.stringify({worksheet:document.title,exportedAt:new Date().toISOString(),...saved},null,2),'application/json');
 $('#reset').onclick=()=>{if(!confirm('Clear this worksheet’s saved answers and notes?'))return;saved={answers:{},notes:''};$$('.check').forEach(form=>{form.reset();form.classList.remove('correct');$('.feedback',form).textContent='';});$('#design-notes').value='';progress();persist();};
 $('#hide-source').onclick=()=>{const sentence=$('#memory-sentence'),b=$('#hide-source');sentence.hidden=!sentence.hidden;b.textContent=sentence.hidden?'Reopen the notebook':'Close the notebook';b.setAttribute('aria-expanded',String(!sentence.hidden));};
 $('#print').onclick=()=>window.print();let printPositions=[];
 window.addEventListener('beforeprint',()=>{printPositions=players.map(p=>p.state.index);players.forEach(p=>p.seek(5));});
 window.addEventListener('afterprint',()=>players.forEach((p,i)=>p.seek(printPositions[i]||0)));
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){$$('.sidebar nav a').forEach(a=>{if(a.getAttribute('href')==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -65% 0px'});$$('main section').forEach(s=>observer.observe(s));}
})();
