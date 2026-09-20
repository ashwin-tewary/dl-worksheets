/* Each storyboard has a prediction, a visible computation, and a concluding check.
   Values are separate from the free-exploration controls below the walkthrough. */
'use strict';
const storyboards={
  shattered:{title:'Watch agreement disappear',kind:'gradient',steps:[
    ['Start with agreement','Both paired gradient patterns agree. Their RMS is 1. Predict what would happen if the signal became less coherent but no smaller.',{depth:1,magnitude:1}],
    ['Add transformations','In this controlled illustration, increasing depth reduces the shared pattern. Both gradients still have RMS 1.',{depth:8,magnitude:1}],
    ['Keep size; lose agreement','At illustrative depth 32, correlation is about 0.021. A norm-only diagnostic would miss this change.',{depth:32,magnitude:1}],
    ['Now shrink the signal','Scaling both traces to RMS 0.05 creates a magnitude problem too. Correlation stays about 0.021. These are independent diagnostics.',{depth:32,magnitude:.05}],
    ['The question a shortcut answers','Can a direct route preserve useful structure? Keep this distinction in mind as we build a residual block. This synthetic example demonstrates the distinction; it does not measure ResNet performance.',{depth:1,magnitude:1}]
  ]},
  residual:{title:'Follow the original and the edit',kind:'residual',steps:[
    ['Keep a copy','Input x = 2 travels along two routes. One preserves the original; one computes a learned correction. Here F(x) = 0.2x.',{active:0}],
    ['Compute the correction','The learned branch produces F(2) = 0.4. The shortcut still carries the original value 2.',{active:1}],
    ['Meet at the addition','Add corresponding values: y = 2 + 0.4 = 2.4. No post-add activation is used in this demonstration.',{active:2}],
    ['Send the gradient backward','For upstream gradient 1, the shortcut contributes 1 and the branch contributes 0.2. Total input gradient: 1.2.',{active:3}],
    ['Test the limit','If the branch instead learns F(x) = −x, its derivative −1 cancels the identity derivative +1. A shortcut helps, but cannot promise a nonzero gradient.',{active:4}]
  ]},
  resnet:{title:'Cross a stage boundary',kind:'resnet',steps:[
    ['Start from a feature tensor','The input is 56 × 56 × 64. We want the next stage to halve spatial size and double channels.',{active:0}],
    ['Transform the main route','A 3 × 3 convolution with stride 2, padding 1, and 128 outputs produces 28 × 28 × 128. A second 3 × 3 convolution preserves that shape.',{active:1}],
    ['Try the identity shortcut','The unchanged shortcut is 56 × 56 × 64. Elementwise addition with 28 × 28 × 128 is invalid. Predict a repair before continuing.',{active:2}],
    ['Project the shortcut','A 1 × 1 convolution with stride 2 and 128 output channels aligns the shortcut. It uses 64 × 128 = 8,192 weights, excluding BN.',{active:3}],
    ['Add, activate, continue','Both routes now produce 28 × 28 × 128. Add them and apply ReLU in the original post-activation basic block.',{active:4}]
  ]},
  inception:{title:'Build a multi-scale feature stack',kind:'inception',steps:[
    ['Fan out the same input','Send the entire 28 × 28 × 192 tensor to every branch. We reveal branches one at a time for teaching; they are parallel routes.',{active:0}],
    ['Inspect one location','The 1 × 1 branch mixes the 192 channels at each spatial position into 64 outputs. It does not mix neighboring positions.',{active:1}],
    ['Inspect a neighborhood','Reduce to 96 channels, then apply a 3 × 3 convolution with 128 outputs. Reduction saves weights compared with applying the wide kernel directly.',{active:2}],
    ['Add wider and pooled views','A reduction to 16 precedes the 5 × 5 branch with 32 outputs. A pooling branch followed by 1 × 1 adds 32 more. Same padding preserves 28 × 28.',{active:3}],
    ['Stack channels, do not add','Concatenate 64 + 128 + 32 + 32 = 256 channels. Every spatial position now has responses from all four routes.',{active:4}]
  ]},
  depthwise:{title:'Slide first. Mix second.',kind:'depthwise',steps:[
    ['Separate the channels','A and B each receive their own 2 × 2 all-ones spatial filter. Stride is 1, padding is valid. Predict the top-left response in each channel.',{pixel:0,phase:0}],
    ['Filter the first patch','A: 1 + 2 + 4 + 5 = 12. B: 9 + 8 + 6 + 5 = 28. No information has crossed between channels.',{pixel:0,phase:1}],
    ['Slide one column','A: 2 + 3 + 5 + 6 = 16. B: 8 + 7 + 5 + 4 = 24. Each response uses the same filter weights.',{pixel:1,phase:1}],
    ['Move to the next row','A: 4 + 5 + 7 + 8 = 24. B: 6 + 5 + 3 + 2 = 16. Follow the highlighted cells and the accumulating output grids.',{pixel:2,phase:1}],
    ['Finish the spatial pass','The bottom-right sums are 28 and 12. We now have two 2 × 2 maps; depth multiplier 1 preserved the number of channels.',{pixel:3,phase:1}],
    ['Mix at one position','A pointwise filter with weights [1, −1] combines both channels. Top-left: 1 × 12 − 1 × 28 = −16. This is the first channel-mixing operation.',{pixel:0,phase:2}],
    ['Apply the same mix everywhere','The final map is [[−16, −8], [8, 16]]. Spatial filtering and channel mixing were two separate operations.',{pixel:3,phase:3}]
  ]}
};
function storyNode(label,value,active){return `<div class="story-node ${active?'is-active':''}"><span>${label}</span><strong>${value}</strong></div>`;}
function storyGrid(title,values,n,highlight=[],known=values.length){return `<div class="story-grid-group"><b>${title}</b><div class="story-grid" style="--columns:${n}" role="img" aria-label="${title}: ${values.map((v,i)=>i<known?v:'not yet computed').join(', ')}">${values.map((v,i)=>`<span class="${highlight.includes(i)?'is-active':''}">${i<known?v:'·'}</span>`).join('')}</div></div>`;}
function paintStory(scene,kind,d){
  if(kind==='gradient'){
    const g=CNN.gradient(d.depth,d.magnitude),w=Math.max(230,scene.clientWidth),h=230,left=42,right=16,top=24,bottom=38,px=i=>left+i/79*(w-left-right),py=v=>top+(2.2-v)/4.4*(h-top-bottom),path=a=>a.map((v,i)=>`${i?'L':'M'}${px(i)},${py(v)}`).join(' ');
    scene.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Synthetic paired gradients with fixed scale"><title>Size and correlation are different</title><path d="M${left} ${top}V${h-bottom}H${w-right}" fill="none" stroke="#90a69a"/>${[-2,0,2].map(v=>`<text x="${left-9}" y="${py(v)+4}" text-anchor="end">${v}</text>`).join('')}<path d="${path(g.a)}" fill="none" stroke="#12655b" stroke-width="2.5"/><path d="${path(g.b)}" fill="none" stroke="#a9512c" stroke-width="2" stroke-dasharray="5 3"/><text x="${w/2}" y="${h-7}" text-anchor="middle">Paired sample index · 1 to 80</text><text x="${left}" y="15">Gradient value</text></svg><div class="story-metrics"><span>Illustrative depth <b>${d.depth}</b></span><span>RMS <b>${d.magnitude}</b></span><span>Correlation <b>${g.rho.toFixed(3)}</b></span></div><p class="caption">Solid: g(x) · dashed: g(x + δ). Synthetic paired samples, not trained-network measurements.</p>`;
  } else if(kind==='residual'){
    const a=d.active,negative=a===4;
    scene.innerHTML=`<div class="story-route">${storyNode('Input x','2',a===0)}<span class="route-arrow">↓ split</span><div class="story-lanes">${storyNode(a===3?'Shortcut gradient':'Identity route',a===3?'1':'2',a===0||a===3)}${storyNode(a===3?'Branch gradient':'Learned route F(x)',a===3?'0.2':negative?'−2':a>=1?'0.4':'0.2 × 2',a===1||a===3||negative)}</div><span class="route-arrow">${a===3?'↑ gradients sum':'↓ elementwise addition'}</span>${storyNode(a===3?'Input gradient':'Output before activation',a===3?'1 + 0.2 = 1.2':negative?'2 − 2 = 0':a>=2?'2 + 0.4 = 2.4':'?',a>=2)}</div>`;
  } else if(kind==='resnet'){
    const a=d.active;scene.innerHTML=`<div class="story-route">${storyNode('Input','56 × 56 × 64',a===0)}<span class="route-arrow">↓ two routes</span><div class="story-lanes">${storyNode('Main route · two 3 × 3 convs',a>=1?'28 × 28 × 128':'stride 2, then stride 1',a===1)}${storyNode(a>=3?'Shortcut · 1 × 1, stride 2':'Shortcut · identity',a>=3?'28 × 28 × 128':'56 × 56 × 64',a===2||a===3)}</div>${storyNode('Addition',a===2?'✕ Shapes do not match':a>=3?'✓ Shapes match':'Compare H, W, C',a>=2)}${a>=4?storyNode('After addition + ReLU','28 × 28 × 128',true):''}</div>`;
  } else if(kind==='inception'){
    const a=d.active;scene.innerHTML=`${storyNode('Shared input','28 × 28 × 192',a===0)}<p class="route-arrow">↓ every branch receives the same tensor</p><div class="story-branches">${[['1 × 1','64',1],['1 × 1 → 3 × 3','128',2],['1 × 1 → 5 × 5','32',3],['Pool → 1 × 1','32',3]].map(([label,value,at])=>storyNode(label,a>=at?value+' channels':'pending reveal',a===at||a===4)).join('')}</div><p class="route-arrow">↓ concatenate along channels</p><div class="channel-stack ${a===4?'complete':''}" aria-label="Output channels in four groups"><span style="flex:64">64</span><span style="flex:128">128</span><span style="flex:32">32</span><span style="flex:32">32</span></div><p class="caption">${a===4?'28 × 28 × 256. Segment widths encode channel counts.':'Predict the output channel count before the final reveal.'}</p>`;
  } else {
    const inputs=[[1,2,3,4,5,6,7,8,9],[9,8,7,6,5,4,3,2,1]],outputs=inputs.map(CNN.conv2),p=d.pixel,start=[0,1,3,4][p],patch=[start,start+1,start+3,start+4],known=d.phase===0?0:d.phase===1?p+1:4;
    scene.innerHTML=`<div class="story-matrix-row">${inputs.map((v,i)=>storyGrid('Input '+(i?'B':'A'),v,3,d.phase<2?patch:[])).join('')}${storyGrid('Spatial filter',[1,1,1,1],2,[])}</div><p class="route-arrow">↓ filter each channel independently</p><div class="story-matrix-row">${outputs.map((v,i)=>storyGrid(i?'B′':'A′',v,2,[p],known)).join('')}</div>${d.phase>=2?`<p class="route-arrow">↓ 1 × A′ + (−1) × B′</p><div class="story-matrix-row">${storyGrid('Mixed output',outputs[0].map((v,i)=>v-outputs[1][i]),2,[p],d.phase===3?4:1)}</div>`:''}`;
  }
}
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const lessonPlayers=[];
for(const [id,story] of Object.entries(storyboards)){
  const host=document.querySelector(`#${id} .walkthrough`);
  host.innerHTML=`<p class="eyebrow">GUIDED VISUAL / ${story.steps.length} PLANNED STEPS</p><h3>${story.title}</h3><div class="story-toolbar"><button type="button" data-action="previous" aria-label="Previous step: ${story.title}">← Previous</button><button type="button" data-action="play">Play walkthrough</button><button type="button" data-action="next" aria-label="Next step: ${story.title}">Next →</button><button type="button" data-action="restart">Restart</button></div><p class="story-counter"></p><div class="story-scene"></div><div class="story-narration" aria-live="polite" aria-atomic="true"><h4></h4><p></p></div><p class="caption">${motionPreference.matches?'Reduced motion: advance at your own pace.':'Each step holds for 5.5 seconds. Pause to discuss, or step through manually.'} The guided example uses fixed values; explore your own settings below.</p>`;
  const scene=host.querySelector('.story-scene'),play=host.querySelector('[data-action="play"]');let lastIndex=-1;
  const player=LecturePlayback.createPlayer(story.steps.length,state=>{
    const [title,narration,values]=story.steps[state.index];
    play.textContent=state.playing?'Pause':motionPreference.matches?'Advance one step':state.index===story.steps.length-1?'Replay walkthrough':'Play walkthrough';
    play.setAttribute('aria-pressed',String(state.playing));
    host.querySelector('[data-action="previous"]').disabled=state.index===0;
    host.querySelector('[data-action="next"]').disabled=state.index===story.steps.length-1;
    host.querySelector('.story-counter').textContent=`Step ${state.index+1} of ${story.steps.length}`;
    if(lastIndex!==state.index){lastIndex=state.index;paintStory(scene,story.kind,values);host.querySelector('.story-narration h4').textContent=title;host.querySelector('.story-narration p').textContent=narration;if(!motionPreference.matches)scene.querySelectorAll('.is-active').forEach(el=>el.animate([{transform:'translateY(9px)'},{transform:'translateY(0)'}],{duration:450,easing:'ease-out'}));}
  },{reducedMotion:()=>motionPreference.matches});
  host.querySelector('.story-toolbar').addEventListener('click',event=>{const action=event.target.dataset.action;if(!action)return;if(action==='play'){const wasPlaying=player.state.playing;lessonPlayers.forEach(other=>other.pause());if(!wasPlaying)player.play();}else player[action]();});
  if(story.kind==='gradient'&&typeof ResizeObserver!=='undefined')new ResizeObserver(()=>paintStory(scene,story.kind,story.steps[player.state.index][2])).observe(scene);
  lessonPlayers.push(player);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)lessonPlayers.forEach(p=>p.pause());});
motionPreference.addEventListener('change',()=>lessonPlayers.forEach(p=>p.pause()));
