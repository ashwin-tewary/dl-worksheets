/* Guided visual demonstrations embedded in each lecture section. */
'use strict';
(() => {
 const players=[], reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const names={pretrained:'pretraining',features:'feature extraction',freezing:'layer freezing',augmentation:'augmentation',context:'CNN and ViT'};
 function stopOthers(current){players.forEach(p=>{if(p!==current)p.pause();});}
 document.querySelectorAll('[data-animation]').forEach((host,index)=>{
  const key=host.dataset.animation,story=window.TransferStories[key],name=names[key];if(!story)return;
  const id=`animation-${key}-${index}`;
  host.innerHTML=`<div class="anim-heading"><div><span class="eyebrow">GUIDED WALKTHROUGH / ${String(index+1).padStart(2,'0')}</span><h3>${story.title}</h3><p>${story.subtitle}</p></div></div>
  <div class="anim-toolbar" aria-label="${name} playback controls"><button class="anim-play" aria-label="Play ${name} animation">▶ Play</button><button class="anim-previous" aria-label="Previous ${name} beat">← Back</button><button class="anim-next" aria-label="Next ${name} beat">Next →</button><button class="anim-replay" aria-label="Replay ${name} animation">↺ Replay</button><label for="${id}-speed">Speed<select id="${id}-speed" class="anim-speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><span class="anim-counter"></span></div>
  <div class="anim-viewport" tabindex="0" role="region" aria-label="${name} animated diagram; scroll horizontally on small screens"><div class="anim-canvas"></div></div><p class="anim-pan-hint">Swipe the diagram to follow the full scene. Pixel numbers stay at a readable size.</p>
  <div class="anim-timeline"><label for="${id}-timeline">Scrub the sequence<input id="${id}-timeline" type="range" min="0" max="${story.steps.length-1}" step="0.01" value="0" class="anim-scrubber"></label><button class="anim-download">Download frame ↓</button></div>
  <div class="anim-beats" role="group" aria-label="${name} storyboard beats">${story.steps.map((step,i)=>`<button aria-label="${name}: ${step.title}" data-beat="${i}"><span>${String(i+1).padStart(2,'0')}</span>${step.title}${step.checkpoint?' <i>Predict</i>':''}</button>`).join('')}</div>
  <div class="anim-caption" aria-live="polite"><div class="anim-caption-top"><span class="anim-phase"></span><h4></h4></div><p class="anim-narration"></p><div class="anim-equation"></div><p class="anim-prompt" hidden>Pause here for student predictions. Choose “Continue” or “Next” when ready to reveal.</p></div><p class="anim-assumptions">${story.note}</p><p class="anim-reduced" ${reduced.matches?'':'hidden'}>Reduced motion is on. Play and Next reveal stable steps without moving the diagram.</p>`;
  const $=sel=>host.querySelector(sel),canvas=$('.anim-canvas'),play=$('.anim-play');let lastBeat=-1,lastFrame='',current={index:0,progress:1};
  const player=window.TransferTimeline.createPlayer(story.steps,state=>{
   current=state;const step=story.steps[state.index],frameKey=`${state.index}:${state.progress.toFixed(3)}`;
   if(lastFrame!==frameKey){canvas.innerHTML=window.TransferScenes.render(key,state.index,state.progress);lastFrame=frameKey;}
   host.dataset.currentBeat=String(state.index);host.dataset.playing=String(state.playing);host.dataset.checkpoint=String(state.checkpoint);
   play.textContent=state.playing?'Ⅱ Pause':state.checkpoint?'▶ Continue':'▶ Play';play.setAttribute('aria-label',`${state.playing?'Pause':state.checkpoint?'Continue':'Play'} ${name} animation`);
   $('.anim-previous').disabled=state.index===0;$('.anim-next').disabled=state.index===story.steps.length-1;
   $('.anim-counter').textContent=`${state.index+1} / ${story.steps.length} beats`;
   const position=state.index===0?0:state.index-1+state.progress;$('.anim-scrubber').value=String(position);$('.anim-scrubber').setAttribute('aria-valuetext',`Beat ${state.index+1}: ${step.title}`);
   if(lastBeat!==state.index){$('.anim-caption h4').textContent=step.title;$('.anim-narration').textContent=step.narration;$('.anim-equation').textContent=step.equation;
    host.querySelectorAll('.anim-beats button').forEach((b,i)=>{b.classList.toggle('current',i===state.index);b.setAttribute('aria-pressed',String(i===state.index));});lastBeat=state.index;}
   $('.anim-phase').textContent=step.checkpoint?'PREDICT BEFORE REVEAL':'FOLLOW THE MECHANISM';$('.anim-prompt').hidden=!state.checkpoint;$('.anim-caption').classList.toggle('is-checkpoint',state.checkpoint);
  },{reduced:()=>reduced.matches});
  players.push(player);
  play.onclick=()=>{if(player.state.playing)player.pause();else{stopOthers(player);player.play();}};
  $('.anim-next').onclick=()=>{stopOthers(player);player.next();};$('.anim-previous').onclick=()=>player.previous();$('.anim-replay').onclick=()=>player.restart();
  $('.anim-speed').onchange=e=>player.speed(+e.target.value);$('.anim-scrubber').oninput=e=>{stopOthers(player);player.seek(+e.target.value);};
  host.querySelectorAll('.anim-beats button').forEach(b=>b.onclick=()=>{stopOthers(player);player.seek(+b.dataset.beat);});
  $('.anim-download').onclick=()=>{const svg=canvas.innerHTML;const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=url;a.download=`${key}-beat-${String(current.index+1).padStart(2,'0')}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)player.pause();},{threshold:0});observer.observe(host);}
  reduced.addEventListener('change',()=>{player.pause();$('.anim-reduced').hidden=!reduced.matches;});
 });
})();
