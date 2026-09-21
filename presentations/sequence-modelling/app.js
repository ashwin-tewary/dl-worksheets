/* Accessible worksheet controls, guided playback, and local practice progress. */
'use strict';
(() => {
 const M=window.SequenceModel,S=window.SequenceScenes,stories=window.SequenceStories;
 const $=(selector,base=document)=>base.querySelector(selector);
 const $$=(selector,base=document)=>[...base.querySelectorAll(selector)];
 const f=S.format,players=[],controllers=[];
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const chain={gap:20,weight:.8,activation:'linear'};
 const defaults={order:{reverse:false},tasks:{task:'classification'},state:{weight:.5,activation:'tanh'},unroll:{length:4,hidden:2},memory:chain,gradient:chain};
 const range=(key,label,min,max,step,value)=>`<label>${label} <output data-output="${key}">${value}</output><input type="range" data-option="${key}" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
 const activation=(value)=>`<label>Cell rule<select data-option="activation" aria-label="Cell activation"><option value="linear" ${value==='linear'?'selected':''}>Linear · for hand calculation</option><option value="tanh" ${value==='tanh'?'selected':''}>Tanh · nonlinear RNN</option></select></label>`;
 function controls(key){
  if(key==='order')return '<button data-reverse aria-pressed="false">Reverse order ↔</button><span class="storage-note">Time still runs left to right; the frame order changes.</span>';
  if(key==='tasks')return '<label>Prediction task<select data-option="task" aria-label="Prediction task"><option value="classification">Review label · many to one</option><option value="tagging">Token tags · aligned outputs</option><option value="next">Next token · shifted targets</option></select></label>';
  if(key==='state')return range('weight','Recurrent weight w',0,1.5,.1,.5)+activation('tanh');
  if(key==='unroll')return range('length','Sequence length T',2,8,1,4)+range('hidden','Hidden width H',2,8,1,2)+'<span class="storage-note">Input d = 3 · output C = 2 · one recurrent layer</span>';
  return range('gap','Recurrent links L',1,40,1,20)+range('weight','Recurrent weight w',.4,1.5,.1,.8)+activation('linear')+(key==='gradient'?'<div class="preset-row" role="group" aria-label="Gradient experiments"><button data-preset="decay">Decay</button><button data-preset="growth">Growth</button><button data-preset="saturation">Saturation</button></div>':'');
 }
 const stat=(label,value)=>`<div class="stat"><small>${label}</small><strong>${value}</strong></div>`;
 function readout(key,beat,o,progress=1){
  const revealed=beat>4||(beat===4&&progress===1);
  if(key==='order')return '<p><b>Read the matrix:</b> row 2 contains the moving dot; every other pixel is 0. The time average loses direction because addition ignores order.</p>';
  if(key==='tasks')return '<p><b>Input vocabulary:</b> [not, very, good]. The output targets are supplied examples. ADV = adverb; ADJ = adjective. EOS marks the end. A real model must learn its readout from labelled examples.</p>';
  if(key==='state'){
   const t=M.trace([1,0,1],Number(o.weight),o.activation),upto=beat>=6?3:beat>=5?2:beat>=4?1:0;
   return `<div class="math-scroll"><table class="math-table"><caption>Exact scalar trace · rounded here to three decimals</caption><thead><tr><th>t</th><th>xₜ</th><th>hₜ₋₁</th><th>xₜ + whₜ₋₁</th><th>hₜ</th></tr></thead><tbody>${t.map((s,i)=>`<tr><td>${s.t}</td><td>${s.x}</td><td>${i<upto?f(s.previous):'—'}</td><td>${i<upto?f(s.z):'—'}</td><td class="number">${i<upto?f(s.h):'predict'}</td></tr>`).join('')}</tbody></table></div><p>Values reveal with the walkthrough. Weight 1 on the input, bias 0, h₀ = 0. ${o.activation==='linear'?'Linear mode deliberately removes tanh.':'Tanh is applied after the two contributions are added.'}</p>`;
  }
  if(key==='unroll')return `<div class="stats">${stat('Parameters (weights + biases)',M.parameters(3,+o.hidden,2))}${stat('Cell evaluations',o.length)}${stat('Coordinates in each state',o.hidden)}</div><p>Count: 3H + H² + H + 2H + 2. This includes the output head. A single-layer unroll is not a stack of independent layers.</p>`;
  const last=M.memoryChain(+o.gap,+o.weight,o.activation).at(-1);
  if(key==='memory')return `<div class="stats">${stat('Starting state h₀','1')}${stat('Ending state hL',revealed?f(last.h):'Predict')}${stat('Zero-input updates',o.gap)}</div><p>All future inputs are 0. This is a controlled propagation experiment. The final scalar is not a probability, and its sign can survive even when its magnitude shrinks.</p>`;
  return `<div class="stats">${stat('Forward state hL',revealed?f(last.h):'Predict')}${stat('Backward sensitivity ∂hL/∂h₀',revealed?f(last.gradient):'Predict')}</div><p>Both quantities come from the same recurrence. The plotted sensitivity is never clipped. ${beat>=6?'Separate supplied parameter-gradient examples: g = 38 clips to 5; g = 0.0115 stays 0.0115. Optimizers clip accumulated parameter gradients after backward propagation, not this state-sensitivity path.':'The final beat introduces a separate parameter-gradient clipping example.'}</p>`;
 }
 function download(name,content,type='text/plain'){
  const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function stopOthers(current){players.forEach(p=>{if(p!==current)p.pause();});}
 $$('[data-animation]').forEach((host,number)=>{
  const key=host.dataset.animation,story=stories[key],o=defaults[key],id=`player-${key}`;
  host.innerHTML=`<div class="anim-heading"><span class="eyebrow">Guided animation / ${String(number+1).padStart(2,'0')}</span><h3>${story.title}</h3><p>${story.subtitle}</p></div><div class="lab-controls">${controls(key)}</div><div class="anim-toolbar" role="group" aria-label="${key} playback controls"><button class="anim-play" aria-label="Play ${key} animation">▶ Play</button><button class="anim-previous" aria-label="Previous ${key} beat">← Back</button><button class="anim-next" aria-label="Next ${key} beat">Next →</button><button class="anim-replay" aria-label="Replay ${key} animation">↺ Replay</button><label for="${id}-speed">Speed<select id="${id}-speed" class="anim-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><span class="anim-counter"></span></div><div class="anim-viewport" tabindex="0" role="region" aria-label="${key} diagram; scroll horizontally on a narrow screen"><div class="anim-canvas"></div></div><p class="anim-pan-hint">Swipe across the diagram. Numbers keep their readable size.</p><div class="anim-timeline"><label for="${id}-timeline">Scrub the walkthrough<input id="${id}-timeline" type="range" min="0" max="${story.steps.length-1}" step="0.01" value="0" class="anim-scrubber"></label><button class="anim-download">Download SVG frame ↓</button></div><div class="anim-beats" role="group" aria-label="${key} animation beats">${story.steps.map((step,i)=>`<button type="button" data-beat="${i}" aria-label="${key}: ${step.title}"><span>${String(i+1).padStart(2,'0')}</span>${step.title}${step.checkpoint?'<i>Predict</i>':''}</button>`).join('')}</div><div class="anim-caption" aria-live="polite"><span class="anim-phase"></span><h4></h4><p class="anim-narration"></p><div class="anim-equation"></div><p class="anim-prompt" hidden>Pause for predictions. Choose Continue or Next to reveal.</p></div><p class="anim-assumptions">${story.note}</p><p class="anim-reduced" ${reduced.matches?'':'hidden'}>Reduced motion is on: controls reveal stable steps without animated movement.</p><div class="readout"></div>`;
  const query=selector=>$(selector,host),canvas=query('.anim-canvas');let previousBeat=-1,current={index:0,progress:1},previousFrame='',previousReadout='';
  function render(state,force=false){
   current=state;const step=story.steps[state.index],frame=`${state.index}:${state.progress.toFixed(3)}`;
   if(force||previousFrame!==frame){canvas.innerHTML=S.render(key,state.index,state.progress,o);previousFrame=frame;}
   host.dataset.currentBeat=String(state.index);host.dataset.playing=String(state.playing);host.dataset.checkpoint=String(state.checkpoint);
   const label=state.playing?'Pause':state.checkpoint?'Continue':reduced.matches?'Next step':'Play';
   query('.anim-play').textContent=`${state.playing?'Ⅱ':'▶'} ${label}`;query('.anim-play').setAttribute('aria-label',`${label} ${key} animation`);
   query('.anim-previous').disabled=state.index===0;query('.anim-next').disabled=state.index===story.steps.length-1;
   query('.anim-counter').textContent=`${state.index+1} / ${story.steps.length}`;
   query('.anim-scrubber').value=String(state.index===0?0:state.index-1+state.progress);query('.anim-scrubber').setAttribute('aria-valuetext',`Beat ${state.index+1}: ${step.title}`);
   if(force||previousBeat!==state.index){
    query('.anim-caption h4').textContent=step.title;query('.anim-narration').textContent=step.narration;query('.anim-equation').textContent=step.equation;
    $$('[data-beat]',host).forEach((button,i)=>{button.classList.toggle('current',i===state.index);button.setAttribute('aria-pressed',String(i===state.index));});
    previousBeat=state.index;
   }
   const readoutState=`${state.index}:${state.progress===1}`;
   if(force||readoutState!==previousReadout){query('.readout').innerHTML=readout(key,state.index,o,state.progress);previousReadout=readoutState;}
   query('.anim-phase').textContent=step.checkpoint?'PREDICT BEFORE REVEAL':'FOLLOW THE MECHANISM';query('.anim-prompt').hidden=!state.checkpoint;query('.anim-caption').classList.toggle('is-checkpoint',state.checkpoint);
  }
  const player=window.SequenceTimeline.createPlayer(story.steps,render,{reduced:()=>reduced.matches,transition:1200,hold:5000});players.push(player);
  const sync=()=>{$$('[data-option]',host).forEach(input=>{input.value=String(o[input.dataset.option]);const output=$(`[data-output="${input.dataset.option}"]`,host);if(output)output.textContent=input.value;});};
  const refresh=()=>{player.pause();sync();render({...player.state},true);};controllers.push({key,player,refresh});
  query('.anim-play').onclick=()=>{if(player.state.playing)player.pause();else{stopOthers(player);player.play();}};
  query('.anim-next').onclick=()=>{stopOthers(player);player.next();};query('.anim-previous').onclick=()=>player.previous();query('.anim-replay').onclick=()=>player.restart();
  query('.anim-speed').onchange=e=>player.speed(+e.target.value);query('.anim-scrubber').oninput=e=>{stopOthers(player);player.seek(+e.target.value);};
  $$('[data-beat]',host).forEach(button=>button.onclick=()=>{stopOthers(player);player.seek(+button.dataset.beat);});
  query('.anim-download').onclick=()=>download(`${key}-beat-${current.index+1}.svg`,canvas.innerHTML,'image/svg+xml');
  $$('[data-option]',host).forEach(input=>input.addEventListener(input.tagName==='SELECT'?'change':'input',()=>{
   o[input.dataset.option]=input.type==='range'?+input.value:input.value;
   if(key==='memory'||key==='gradient')controllers.filter(c=>['memory','gradient'].includes(c.key)).forEach(c=>c.refresh());else refresh();
  }));
  if(key==='order')query('[data-reverse]').onclick=()=>{o.reverse=!o.reverse;query('[data-reverse]').setAttribute('aria-pressed',String(o.reverse));query('[data-reverse]').textContent=o.reverse?'Restore original order ↔':'Reverse order ↔';refresh();};
  $$('[data-preset]',host).forEach(button=>button.onclick=()=>{Object.assign(chain,{gap:20,weight:button.dataset.preset==='decay'?.8:button.dataset.preset==='growth'?1.2:1.3,activation:button.dataset.preset==='saturation'?'tanh':'linear'});controllers.filter(c=>['memory','gradient'].includes(c.key)).forEach(c=>c.refresh());player.seek(story.steps.length-1);});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)player.pause();},{threshold:0});observer.observe(host);}
  reduced.addEventListener('change',()=>{player.pause();if(reduced.matches)player.seek(player.state.index);query('.anim-reduced').hidden=!reduced.matches;render({...player.state},true);});
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)players.forEach(p=>p.pause());});
 // Answer text is always inserted using textContent/value, never evaluated or rendered as HTML.
 const storageKey='dl-sequence-modelling-v1';let saved={answers:{},notes:{}};
 try{const value=JSON.parse(localStorage.getItem(storageKey)||'null');if(value&&typeof value==='object'&&value.answers&&value.notes)saved=value;}catch{ /* Practice still works when storage is unavailable. */ }
 const forms=$$('.check');
 function store(){try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{$('#storage-status').textContent='Browser saving is unavailable. Use Save my answers to keep a text copy.';}}
 function answer(form){return form.dataset.kind==='number'?$('input[name=answer]',form).value:($('input[name=answer]:checked',form)?.value||'');}
 function parseNumber(value){const s=value.trim().replaceAll(',','');if(!s)return NaN;if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)){const [a,b]=s.split('/').map(Number);return b===0?NaN:a/b;}return Number(s);}
 function isCorrect(form,value){if(form.dataset.kind==='choice')return value===form.dataset.answer;const n=parseNumber(value);return Number.isFinite(n)&&Math.abs(n-Number(form.dataset.answer))<=Number(form.dataset.tolerance);}
 function progress(){const n=forms.filter(form=>form.classList.contains('correct')).length;$('#progress').value=n;$('#progress-label').textContent=`${n} of ${forms.length} checks understood`;}
 function grade(form,announce=true){const value=answer(form),correct=isCorrect(form,value);form.classList.toggle('correct',correct);if(announce)$('.feedback',form).textContent=!value?'Enter or choose an answer first.':correct?'Correct. Open the reasoning to explain why.':`Try again. ${form.dataset.hint}`;saved.answers[form.id]={value,checked:!!value};store();progress();}
 forms.forEach(form=>{
  const existing=saved.answers[form.id];if(existing&&typeof existing.value==='string'){
   if(form.dataset.kind==='number')$('input[name=answer]',form).value=existing.value;else $$('input[name=answer]',form).forEach(input=>input.checked=input.value===existing.value);
   if(existing.checked)grade(form,false);
  }
  form.addEventListener('submit',e=>{e.preventDefault();grade(form);});
  form.addEventListener('input',()=>{saved.answers[form.id]={value:answer(form),checked:false};form.classList.remove('correct');$('.feedback',form).textContent='';store();progress();});
 });
 $$('[data-save]').forEach(field=>{field.value=typeof saved.notes[field.id]==='string'?saved.notes[field.id]:'';field.addEventListener('input',()=>{saved.notes[field.id]=field.value;store();});});
 $('#hide-cue').onclick=()=>{const word=$('#cue-word'),hidden=word.style.visibility==='hidden';word.style.visibility=hidden?'visible':'hidden';word.setAttribute('aria-hidden',String(!hidden));$('#hide-cue').textContent=hidden?'Hide the word':'Reveal the word';$('#hide-cue').setAttribute('aria-expanded',String(hidden));};
 $('#export').onclick=()=>{let body='REMEMBER WHAT CAME BEFORE — MY WORKSHEET ANSWERS\n\n';forms.forEach(form=>{const v=answer(form);let label=v;if(form.dataset.kind==='choice'&&v)label=$$('label',form).find(l=>$('input',l)?.value===v)?.textContent.trim()||v;body+=`${$('.qnum',form).textContent}\n${$('h3',form).textContent}\nMy answer: ${label||'(unanswered)'}\n\n`;});$$('[data-save]').forEach(field=>{body+=`${$(`label[for="${field.id}"]`).textContent}\n${field.value||'(unanswered)'}\n\n`;});download('sequence-modelling-my-answers.txt',body);};
 $('#reset').onclick=()=>{if(!window.confirm('Reset all saved answers for this worksheet in this browser?'))return;saved={answers:{},notes:{}};forms.forEach(form=>{form.reset();form.classList.remove('correct');$('.feedback',form).textContent='';});$$('[data-save]').forEach(field=>field.value='');store();progress();};
 $('#print').onclick=()=>window.print();let printPositions=[];
 window.addEventListener('beforeprint',()=>{printPositions=controllers.map(c=>c.player.state.index);controllers.forEach(c=>c.player.seek(stories[c.key].steps.length-1));});
 window.addEventListener('afterprint',()=>controllers.forEach((c,i)=>c.player.seek(printPositions[i]??0)));
 if('IntersectionObserver' in window){const nav=$$('.sidebar nav a');const observer=new IntersectionObserver(entries=>{const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(active)nav.forEach(a=>{if(a.hash===`#${active.target.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-10% 0px -65% 0px'});$$('section[id]').filter(s=>nav.some(a=>a.hash===`#${s.id}`)).forEach(s=>observer.observe(s));}
 progress();
})();
