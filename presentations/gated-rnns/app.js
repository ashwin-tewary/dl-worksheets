/* Accessible worksheet controls, guided playback, and local practice progress. */
'use strict';
(() => {
 const M=window.GatedModel,S=window.GatedScenes,stories=window.GatedStories;
 const $=(selector,base=document)=>base.querySelector(selector);
 const $$=(selector,base=document)=>[...base.querySelectorAll(selector)];
 const f=S.format,players=[],controllers=[];
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const defaults={recap:{weight:.5},lstm:{previous:.8,forget:.75,input:.5,candidate:.4,output:.6},highway:{links:20,forget:.95},gru:{previous:.8,x:.2,reset:.5,update:.75},bidirectional:{ending:'river',mode:'complete'}};
 const range=(key,label,min,max,step,value)=>`<label>${label} <output data-output="${key}">${value}</output><input type="range" data-option="${key}" aria-label="${label}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
 function controls(key){
  if(key==='recap')return range('weight','Recurrent weight w',0,1.5,.1,.5);
  if(key==='lstm')return range('forget','Forget f',0,1,.05,.75)+range('input','Input i',0,1,.05,.5)+range('candidate','Candidate g',-1,1,.1,.4)+range('output','Output o',0,1,.05,.6)+'<div class="preset-row"><button data-preset="retain">Retain old memory</button><button data-preset="hide">Hide output</button><button data-preset="default">Default example</button></div>';
  if(key==='highway')return range('links','Recurrent links L',1,40,1,20)+range('forget','Constant forget f',0,1,.01,.95);
  if(key==='gru')return range('reset','Reset r',0,1,.05,.5)+range('update','Update z (retain old)',0,1,.05,.75)+'<div class="preset-row"><button data-preset="gru-keep">Reset candidate, retain state</button><button data-preset="gru-replace">Take new candidate</button><button data-preset="default">Default example</button></div>';
  return '<label>Available input<select data-option="mode" aria-label="Available input"><option value="complete">Complete sentence</option><option value="live">Live prefix: the bank</option></select></label><label>Sentence ending<select data-option="ending" aria-label="Sentence ending"><option value="river">near the river</option><option value="loan">approved a loan</option></select></label>';
 }
 const stat=(label,value)=>`<div class="stat"><small>${label}</small><strong>${value}</strong></div>`;
 function readout(key,beat,o,progress=1){
  const show=beat>=4;
  if(key==='recap')return '<p><b>Try this:</b> set w to 0. Which states can still carry information from earlier inputs? With w = 0 each state depends only on its current input. The animation supplies chosen values, not word embeddings learned from data.</p>';
  if(key==='lstm'){const s=M.lstm(o);return `<div class="stats">${stat('Retained contribution',beat>=1?f(s.keep):'—')}${stat('New writing',beat>=2?f(s.write):'—')}${stat('Stored cell c',show?f(s.cell):'Predict')}${stat('Exposed hidden h',beat>=5?f(s.hidden):'Predict')}</div><p>Old cell = 0.8. The candidate is signed, while gates are between 0 and 1. Both branches feed the new cell; only the output branch is filtered by o.</p>`;}
  if(key==='highway')return `<div class="stats">${stat('Linear RNN path: 0.8ᴸ',show?f(.8**o.links):'Predict')}${stat('Direct LSTM path: fᴸ',show?f(o.forget**o.links):'Predict')}</div><p>All write terms are zero and gates are held fixed. Values below 10⁻⁵ meet the bottom of the plotted scale; zero is marked separately. These products are neither probabilities nor full parameter gradients.</p>`;
  if(key==='gru'){const s=M.gru(o);return `<div class="stats">${stat('Candidate h̃',beat>=2?f(s.candidate):'—')}${stat('Retained old state',show?f(s.keep):'Predict')}${stat('New candidate contribution',show?f(s.write):'Predict')}${stat('New hidden h',show?f(s.hidden):'Predict')}</div><p>Input x = 0.2 · previous state h = 0.8 · weights 1 · bias 0. Our z retains the old state; r changes the candidate branch.</p>`;}
  const live=o.mode==='live';
  if(live)return '<p><b>Information boundary:</b> the prefix is [the, bank]. The suffix and backward states are unavailable. Switching the hypothetical ending cannot affect either observed forward state. This display does not run a backward encoder over the prefix.</p>';
  const xs=[0,0,0,0,o.ending==='river'?1:-1],s=M.bidirectional(xs);
  if(!show)return '<p><b>Watch the alignment:</b> reverse processing order does not change original token indices. The numerical table appears after the prediction stop.</p>';
  return `<div class="math-scroll"><table class="math-table"><caption>States aligned to original input positions · numbers are a toy encoding</caption><thead><tr><th>Position t</th><th>xₜ</th><th>Forward h→ₜ</th><th>Backward h←ₜ</th></tr></thead><tbody>${xs.map((x,i)=>`<tr><th>${i+1}${i===1?' · bank':''}</th><td>${x}</td><td>${f(s.forward[i])}</td><td>${f(s.backward[i])}</td></tr>`).join('')}</tbody></table></div><p>At bank, changing the supplied ending changes its backward state but not its forward state. A real model learns representations and a task head; these signs are not semantic labels.</p>`;
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
   refresh();
  }));
  $$('[data-preset]',host).forEach(button=>button.onclick=()=>{
   if(key==='lstm')Object.assign(o,button.dataset.preset==='retain'?{forget:1,input:0,candidate:.4,output:.6}:button.dataset.preset==='hide'?{forget:.75,input:.5,candidate:.4,output:0}:{forget:.75,input:.5,candidate:.4,output:.6});
   if(key==='gru')Object.assign(o,button.dataset.preset==='gru-keep'?{reset:0,update:1}:button.dataset.preset==='gru-replace'?{reset:0,update:0}:{reset:.5,update:.75});
   refresh();player.seek(story.steps.length-1);
  });
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)player.pause();},{threshold:0});observer.observe(host);}
  reduced.addEventListener('change',()=>{player.pause();if(reduced.matches)player.seek(player.state.index);query('.anim-reduced').hidden=!reduced.matches;render({...player.state},true);});
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)players.forEach(p=>p.pause());});
 // Answer text is always inserted using textContent/value, never evaluated or rendered as HTML.
 const storageKey='dl-gated-rnns-v1';let saved={answers:{},notes:{}};
 try{const value=JSON.parse(localStorage.getItem(storageKey)||'null');if(value&&typeof value==='object'&&value.answers&&typeof value.answers==='object'&&!Array.isArray(value.answers)&&value.notes&&typeof value.notes==='object'&&!Array.isArray(value.notes))saved=value;}catch{ /* Practice still works when storage is unavailable. */ }
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
 $('#export').onclick=()=>{let body='KEEP THE CLUE. READ THE CONTEXT. — MY WORKSHEET ANSWERS\n\n';forms.forEach(form=>{const v=answer(form);let label=v;if(form.dataset.kind==='choice'&&v)label=$$('label',form).find(l=>$('input',l)?.value===v)?.textContent.trim()||v;body+=`${$('.qnum',form).textContent}\n${$('h3',form).textContent}\nMy answer: ${label||'(unanswered)'}\n\n`;});$$('[data-save]').forEach(field=>{body+=`${$(`label[for="${field.id}"]`).textContent}\n${field.value||'(unanswered)'}\n\n`;});download('gated-rnns-my-answers.txt',body);};
 $('#reset').onclick=()=>{if(!window.confirm('Reset all saved answers for this worksheet in this browser?'))return;saved={answers:{},notes:{}};forms.forEach(form=>{form.reset();form.classList.remove('correct');$('.feedback',form).textContent='';});$$('[data-save]').forEach(field=>field.value='');store();progress();};
 $('#print').onclick=()=>window.print();let printPositions=[];
 window.addEventListener('beforeprint',()=>{printPositions=controllers.map(c=>c.player.state.index);controllers.forEach(c=>c.player.seek(stories[c.key].steps.length-1));});
 window.addEventListener('afterprint',()=>controllers.forEach((c,i)=>c.player.seek(printPositions[i]??0)));
 if('IntersectionObserver' in window){const nav=$$('.sidebar nav a');const observer=new IntersectionObserver(entries=>{const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(active)nav.forEach(a=>{if(a.hash===`#${active.target.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-10% 0px -65% 0px'});$$('section[id]').filter(s=>nav.some(a=>a.hash===`#${s.id}`)).forEach(s=>observer.observe(s));}
 progress();
})();
