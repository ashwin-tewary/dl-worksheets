'use strict';
const M = window.CNNModel;
const $ = id => document.getElementById(id);
const colors = {teal:'#12655b',orange:'#a64126',ink:'#182e2b',paper:'#f6f4ed'};
const labs = {};
const viewKey = 'cnn-visual-mode-v1';
let visualMode = 'numbers';
try { if(localStorage.getItem(viewKey)==='images') visualMode='images'; } catch {}

// UCI Optical Recognition of Handwritten Digits, Alpaydin & Kaynak (1998).
// CC BY 4.0, https://doi.org/10.24432/C50P49. Sample index 403 in
// scikit-learn's digits.csv.gz. Native 8×8 intensities, unchanged (0–16).
const DIGIT = [
  [0,0,1,8,8,9,12,7], [0,0,8,16,12,13,16,5],
  [0,0,11,6,0,8,11,0], [0,0,15,3,1,15,3,0],
  [0,0,1,0,10,9,0,0], [0,0,0,3,13,1,0,0],
  [0,0,0,13,7,0,0,0], [0,0,1,11,1,0,0,0]
];
const DEMO = M.blobImage(7,2,2,3,4);
const EDGE_IMG = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,1,1,1,0,0,0],[1,1,1,1,0,0,0],[1,1,1,1,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]];
const inputFor = (numeric=EDGE_IMG)=>visualMode==='images'?DIGIT:numeric;
const imageOptions = ()=>visualMode==='images'?{image:true,max:16}:{};
const maxAbs = img=>Math.max(1e-9,...img.flat().map(Math.abs));
function fmt(n){
  if(!Number.isFinite(n)) return '—';
  if(Math.abs(n)<1e-10) return '0';
  return Number.isInteger(n)?String(n):String(Number(n.toFixed(3)));
}
function cellLabel(n){
  if(Math.abs(n-1/9)<1e-10) return '1/9';
  return Number.isInteger(n)?String(n):String(Number(n.toFixed(1)));
}
function cellColors(v,m,image=false){
  let c;
  if(image){
    const shade=Math.round(255*Math.max(0,Math.min(1,v/(m||16))));
    c=[shade,shade,shade];
  }else{
    const t=Math.min(1,Math.abs(v)/(m||1));
    const a=[247,248,241],b=v>=0?[18,101,91]:[166,65,38];
    c=a.map((x,i)=>Math.round(x+(b[i]-x)*t));
  }
  // Choose the higher-contrast of white and black (at least 4.5:1).
  const linear=c.map(x=>{x/=255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;});
  const lum=.2126*linear[0]+.7152*linear[1]+.0722*linear[2];
  return {bg:`rgb(${c.join(',')})`,fg:lum<.179?'#fff':'#000'};
}
function drawGrid(ctx,img,x0,y0,cell,opts={}){
  const h=img.length,w=img[0].length,m=opts.max||maxAbs(img);
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const paint=cellColors(img[y][x],m,opts.image);
    ctx.fillStyle=paint.bg;ctx.fillRect(x0+x*cell,y0+y*cell,cell,cell);
    ctx.strokeStyle=opts.image?'#ffffff28':'#a5b5a04d';ctx.lineWidth=.5;
    ctx.strokeRect(x0+x*cell,y0+y*cell,cell,cell);
    ctx.fillStyle=paint.fg;
    const label=cellLabel(img[y][x]);
    const size=Math.max(12,Math.min(14,(cell-5)/(label.length*.64)));
    ctx.font=`600 ${size}px ui-monospace, monospace`;
    ctx.fillText(label,x0+(x+.5)*cell,y0+(y+.5)*cell);
  }
  if(opts.win){
    const p=opts.win,x=Math.max(0,p.x),y=Math.max(0,p.y);
    const right=Math.min(w,p.x+p.k),bottom=Math.min(h,p.y+p.k);
    if(right>x&&bottom>y){
      ctx.strokeStyle='#fff';ctx.lineWidth=5;
      ctx.strokeRect(x0+x*cell+2,y0+y*cell+2,(right-x)*cell-4,(bottom-y)*cell-4);
      ctx.strokeStyle='#bc4a25';ctx.lineWidth=2.5;
      ctx.strokeRect(x0+x*cell+2,y0+y*cell+2,(right-x)*cell-4,(bottom-y)*cell-4);
    }
  }
}
function canvasWidth(canvas){
  return Math.max(160,Math.round(canvas.parentElement.clientWidth||canvas.getBoundingClientRect().width||600));
}
function canvasBox(canvas,w,h){
  h=Math.ceil(h);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  if(canvas.style.width!==w+'px')canvas.style.width=w+'px';
  if(canvas.style.height!==h+'px')canvas.style.height=h+'px';
  if(canvas.width!==Math.round(w*dpr))canvas.width=Math.round(w*dpr);
  if(canvas.height!==Math.round(h*dpr))canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#f3f4ed';ctx.fillRect(0,0,w,h);
  return ctx;
}
function title(ctx,text,x,y){
  ctx.fillStyle=colors.ink;ctx.font='600 12px system-ui, sans-serif';
  ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(text,x,y);
}
function tableHTML(img,label,opts={}){
  const m=opts.max||maxAbs(img);
  return `<table class="pixel-table"><caption>${label} · ${img.length}×${img[0].length}</caption><tbody>${img.map((row,y)=>`<tr>${row.map((v,x)=>{
    const c=cellColors(v,m,opts.image);
    const p=opts.win,active=p&&y>=p.y&&y<p.y+p.k&&x>=p.x&&x<p.x+p.k;
    return `<td class="${active?'in-window':''}" style="background:${c.bg};color:${c.fg}" title="Row ${y}, column ${x}: ${fmt(v)}">${fmt(v)}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table>`;
}
function imagePreview(img,opts={}){
  const m=opts.max||maxAbs(img);
  return `<svg class="image-preview" viewBox="0 0 ${img[0].length} ${img.length}" role="img" aria-label="Image view without numeric overlay" shape-rendering="crispEdges">${img.map((row,y)=>row.map((v,x)=>`<rect x="${x}" y="${y}" width="1" height="1" fill="${cellColors(v,m,opts.image).bg}"/>`).join('')).join('')}</svg>`;
}
function inspectValues(canvas,panels){
  const detail=$(canvas.id+'-values');
  // Do not replace an open inspector while a student is reading it.
  const key=JSON.stringify(panels.map(p=>[p.label,p.img,p.opts?.image,visualMode]));
  if(detail.dataset.key!==key){
    detail.dataset.key=key;
    detail.querySelector('.matrix-tables').innerHTML=panels.map(p=>tableHTML(p.img,p.label,p.opts)).join('');
  }
  // A moving window changes the highlight, not the matrix values or DOM nodes.
  detail.querySelectorAll('table').forEach((table,i)=>{
    const win=panels[i].opts?.win;
    table.querySelectorAll('tbody tr').forEach((row,y)=>{
      [...row.cells].forEach((cell,x)=>cell.classList.toggle('in-window',Boolean(win&&y>=win.y&&y<win.y+win.k&&x>=win.x&&x<win.x+win.k)));
    });
  });
}
function drawPanels(canvas,panels){
  canvas.dataset.visualMode=visualMode;
  labs[canvas.id].panels=panels;
  const margin=12,gap=28,minCell=32;
  const animated=labs[canvas.id]?.animated,flow=panels.length>1;
  const rowWidth=panels.reduce((n,p)=>n+Math.max(p.img[0].length*minCell,115),0)+gap*(panels.length-1)+margin*2;
  const w=Math.max(canvasWidth(canvas),flow?rowWidth:Math.max(...panels.map(p=>p.img[0].length))*minCell+margin*2);
  $(canvas.id+'-scroll-hint').hidden=w<=canvasWidth(canvas);
  const available=w-margin*2;
  const oneRow=panels.reduce((n,p)=>n+Math.max(p.img[0].length*minCell,115),0)+gap*(panels.length-1)<=available;
  let cell=oneRow?Math.min(38,Math.floor((available-gap*(panels.length-1))/panels.reduce((n,p)=>n+p.img[0].length,0))):minCell;
  while(cell>minCell&&panels.reduce((n,p)=>n+Math.max(p.img[0].length*cell,115),0)+gap*(panels.length-1)>available)cell--;
  let x=margin,y=32,rowHeight=0;
  const layout=panels.map(p=>{
    const pw=Math.max(p.img[0].length*cell,115);
    if(x>margin&&x+pw>w-margin){x=margin;y+=rowHeight+48;rowHeight=0;}
    const box={...p,x,y};x+=pw+gap;rowHeight=Math.max(rowHeight,p.img.length*cell);return box;
  });
  labs[canvas.id].layout=layout;
  const jumps=$(canvas.id+'-panels');
  jumps.hidden=panels.length<2||w<=canvasWidth(canvas);
  if(jumps.dataset.labels!==JSON.stringify(panels.map(p=>p.label))){
    jumps.dataset.labels=JSON.stringify(panels.map(p=>p.label));
    jumps.innerHTML=panels.map((p,i)=>`<button type="button" data-panel-index="${i}">${p.label}</button>`).join('');
  }
  const height=y+rowHeight+14,lab=labs[canvas.id];
  if(lab?.animated){
    const key=JSON.stringify([w,height,visualMode,panels.map(p=>[p.label,p.img,p.opts?.image,p.opts?.max])]);
    if(lab.scene?.key!==key){
      const backdrop=document.createElement('canvas');
      const ctx=canvasBox(backdrop,w,height);
      layout.forEach(p=>{title(ctx,p.label,p.x,p.y-12);drawGrid(ctx,p.img,p.x,p.y,cell,{...p.opts,win:null});});
      lab.scene={key,backdrop,layout,cell,w,height};
    }
    paintAnimation(lab);
  }else{
    const ctx=canvasBox(canvas,w,height);
    layout.forEach(p=>{title(ctx,p.label,p.x,p.y-12);drawGrid(ctx,p.img,p.x,p.y,cell,p.opts);});
  }
  canvas.setAttribute('aria-label',panels.map(p=>`${p.label}: ${p.img.length} by ${p.img[0].length}`).join('. ')+'. Expand Inspect matrices for values.');
  inspectValues(canvas,panels);
}
function arrangeExperiments(){
  document.querySelectorAll('.lab-shell').forEach(shell=>{
    const pane=shell.querySelector('.visual-pane'),controls=shell.querySelector('.controls');
    const title=controls.querySelector('h3').textContent;
    const guide=document.createElement('details');guide.className='experiment-guide';
    guide.innerHTML='<summary>Experiment prompts &amp; context</summary><div></div>';
    const body=guide.querySelector('div');
    [...controls.children].forEach(el=>{if(el.matches('.try,p'))body.append(el);});
    controls.querySelector('.eyebrow')?.remove();controls.querySelector('h3')?.remove();
    controls.querySelectorAll('label[for]').forEach(label=>{
      const input=$(label.htmlFor),field=document.createElement('div');field.className='control-field';
      label.before(field);field.append(label,input);
    });
    controls.setAttribute('aria-label',title);controls.setAttribute('role','group');
    pane.querySelector('.pane-heading').after(controls);pane.append(guide);
    if(pane.querySelector('.num-grid')){
      const fold=document.createElement('details');fold.className='layer-details';
      fold.innerHTML='<summary>Layer-by-layer values</summary>';
      const table=pane.querySelector('.num-grid');table.before(fold);fold.append(table);
    }
  });
}
function mount(id,draw,{animated=false}={}){
  const canvas=$(id);
  const wrapper=document.createElement('div');wrapper.className='canvas-scroll';
  wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Visual matrices; scroll horizontally for wide grids');wrapper.tabIndex=0;
  canvas.before(wrapper);wrapper.append(canvas);
  wrapper.insertAdjacentHTML('beforebegin',`<div id="${id}-panels" class="panel-jumps" aria-label="Jump to a matrix" hidden></div>`);
  $(id+'-panels').addEventListener('click',event=>{const button=event.target.closest('[data-panel-index]');if(button)focusPanel(labs[id],Number(button.dataset.panelIndex));});
  wrapper.insertAdjacentHTML('afterend',`<p class="matrix-scroll-hint" id="${id}-scroll-hint" hidden>↔ Scroll the visual sideways to see the whole matrix.</p><details class="matrix-values" id="${id}-values"><summary>Inspect matrices · values to 3 decimals</summary><div class="matrix-tables"></div></details>`);
  const lab={canvas,animated,phase:0,index:0,speed:1,showFull:false,playing:animated&&!matchMedia('(prefers-reduced-motion: reduce)').matches,visible:true,draw(){draw(lab);}};
  labs[id]=lab;
  if(animated){
    wrapper.insertAdjacentHTML('beforebegin',`<div class="animation-stages" id="${id}-stages"><span>01 · Find patch</span><i>→</i><span>02 · ${id==='cv-pool'?'Summarise':'Multiply & sum'}</span><i>→</i><span>03 · Write result</span></div>`);
    wrapper.insertAdjacentHTML('afterend',`<div class="animation-timeline"><label for="${id}-scrub">Patch <output id="${id}-position">1</output></label><input id="${id}-scrub" data-scrub="${id}" type="range" min="0" max="1" value="0" aria-label="Selected patch"><label for="${id}-speed">Speed</label><select id="${id}-speed" data-speed="${id}"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select><button type="button" data-full-map="${id}" aria-pressed="false">Show full map</button></div><p class="animation-status" id="${id}-status">Find the first patch.</p>`);
  }
  const playback=canvas.closest('.visual-pane').querySelector('.scene-tools');
  if(playback)wrapper.before(playback);
  if(id==='cv-stride')wrapper.insertAdjacentHTML('beforebegin','<p id="stride-location" class="scan-location"></p>');
  if(id==='cv-rf'){
    const comparison=document.createElement('div');comparison.className='field-comparison';
    wrapper.before(comparison);comparison.append(wrapper,$('field-growth'));
  }
  let lastWidth=0;
  new ResizeObserver(()=>{const w=canvasWidth(canvas);if(w!==lastWidth){lastWidth=w;lab.draw();}}).observe(wrapper);
  new IntersectionObserver(es=>{lab.visible=es[0].isIntersecting;}).observe(canvas);
  return lab;
}
function focusPanel(lab,index){
  const wrapper=lab.canvas.parentElement;
  wrapper.scrollLeft=Math.max(0,lab.layout[index].x-12);
}
function bindRange(id,outId,format=v=>v){
  const el=$(id);const paint=()=>$(outId).textContent=format(el.value);
  el.addEventListener('input',paint);paint();
}
function listen(ids,lab){ids.forEach(id=>$(id).addEventListener('input',()=>{lab.phase=0;lab.stageKey='';lab.draw();syncPlayback(lab);}));}
function readout(id,heading,text,calculation=''){
  const el=$(id),open=el.querySelector('.calculation-fold')?.open;
  el.innerHTML=`<b>${heading}</b><p>${text}</p>${calculation?`<details class="calculation-fold"${open?' open':''}><summary>Formula &amp; this calculation</summary><div>${calculation}</div></details>`:''}`;
}
function mountConv(id,getState){
  return mount(id,lab=>{
    const st=getState(),img=st.img,k=st.kernel.length;
    const padded=M.pad2d(img,st.pad),out=M.conv2d(img,st.kernel,st.stride,st.pad);
    const positions=M.convPositions(img.length,img[0].length,k,st.stride,st.pad);
    const idx=Math.min(positions.length-1,Math.floor(lab.phase*positions.length)),p=positions[idx];
    lab.pos=positions;lab.index=idx;lab.out=out;lab.state=st;lab.patchSize=k;lab.inputPad=st.pad;
    const patch=M.patchAt(img,p.y,p.x,k,st.pad);
    lab.patch=patch;
    drawPanels(lab.canvas,[
      {label:`Input${st.pad?' + padding':''}`,img:padded,opts:{...imageOptions(),win:{y:p.y+st.pad,x:p.x+st.pad,k}}},
      {label:'Kernel',img:st.kernel},
      {label:'Output',img:out,opts:{win:{y:p.oy,x:p.ox,k:1},...([M.KERNELS.identity,M.KERNELS.blur].includes(st.kernel)?imageOptions():{})}}
    ]);
    const terms=patch.flat().map((v,i)=>`${fmt(v)} × (${cellLabel(st.kernel.flat()[i])})`).join(' + ');
    const equals=Number.isInteger(out[p.oy][p.ox])?'=':'≈';
    readout(st.readout,`This patch produces ${fmt(out[p.oy][p.ox])}`,`${k}×${k} input patch → one cell at (${p.oy}, ${p.ox}). ${positions.length} patches build a ${out.length}×${out[0].length} feature map.`, `H<sub>out</sub> = ⌊(${img.length} + ${2*st.pad} − ${k}) / ${st.stride}⌋ + 1 = <strong>${out.length}</strong>.<span class="calculation">${terms} ${equals} <b>${fmt(out[p.oy][p.ox])}</b></span>`);
    lab.canvas.setAttribute('aria-label',`${visualMode==='images'?'Handwritten 7':'Numerical input'}, ${img.length} by ${img[0].length}. ${out.length} by ${out[0].length} output. Selected cell ${p.oy}, ${p.ox} is ${fmt(out[p.oy][p.ox])}. Expanded matrix tables follow.`);
  },{animated:true});
}
function convolutionLabs(){
  const kernel=mountConv('cv-kernel',()=>({img:inputFor(),kernel:M.KERNELS[$('k-kernel').value],stride:1,pad:0,readout:'read-kernel'}));
  const stride=mountConv('cv-stride',()=>({img:inputFor(DEMO),kernel:M.KERNELS.identity,stride:Number($('k-stride').value),pad:0,readout:'read-stride'}));
  const pad=mountConv('cv-pad',()=>({img:inputFor(DEMO),kernel:M.KERNELS.identity,stride:1,pad:Number($('k-pad').value),readout:'read-pad'}));
  listen(['k-kernel'],kernel);listen(['k-stride'],stride);listen(['k-pad'],pad);
  bindRange('k-stride','k-stride-value',v=>v+' px');bindRange('k-pad','k-pad-value',v=>v+' px');
}
function whyLab(){
  const lab=mount('cv-why',lab=>{
    const h=Number($('k-why-size').value),count=(h-2)**2;
    const img=inputFor(),patch=img.slice(1,4).map(r=>r.slice(1,4));
    drawPanels(lab.canvas,[{label:'Sample input',img,opts:{...imageOptions(),win:{y:1,x:1,k:3}}},{label:'Local patch',img:patch,opts:imageOptions()}]);
    readout('read-why',`${h}×${h} → ${h-2}×${h-2} · one output channel`,`<span class="parameter-counts"><span>Dense <strong>${(h*h*count).toLocaleString('en-US')}</strong> weights</span><span>Local, unshared <strong>${(9*count).toLocaleString('en-US')}</strong> weights</span><span>Convolution <strong>9 weights</strong></span></span>All three produce ${count.toLocaleString('en-US')} outputs. Only convolution reuses the same nine weights at every location.`);
  });
  bindRange('k-why-size','k-why-size-value',v=>v+' px');listen(['k-why-size'],lab);
}
function mapsLab(){
  const canvas=$('cv-maps');
  canvas.insertAdjacentHTML('afterend','<div class="map-comparison" aria-label="Compare feature maps"></div>');
  const gallery=canvas.nextElementSibling;
  gallery.innerHTML=['Vertical edges','Horizontal edges','Local average'].map((name,i)=>`<button type="button" data-map-choice="${i}" aria-pressed="${i===0}"><span class="map-thumbnail"></span><span><b>${name}</b><small>${i===0?'Changes across columns':i===1?'Changes across rows':'Average brightness'}</small></span></button>`).join('');
  const lab=mount('cv-maps',lab=>{
    const img=inputFor(),ks=[M.KERNELS.edgex,M.KERNELS.edgey,M.KERNELS.blur],names=['Vertical edges','Horizontal edges','Local average'];
    const focus=Number($('k-map-focus').value),maps=ks.map(k=>M.conv2d(img,k));
    const signedMax=Math.max(maxAbs(maps[0]),maxAbs(maps[1]));
    const opts=focus===2?imageOptions():{max:signedMax};
    drawPanels(lab.canvas,[{label:'Input',img,opts:imageOptions()},{label:'Selected kernel',img:ks[focus]},{label:names[focus]+' · output',img:maps[focus],opts}]);
    gallery.querySelectorAll('button').forEach((button,i)=>{
      button.setAttribute('aria-pressed',String(i===focus));
      button.querySelector('.map-thumbnail').innerHTML=imagePreview(maps[i],i===2?imageOptions():{max:signedMax});
    });
    readout('read-maps',`${names[focus]} · ${maps[focus].length}×${maps[focus][0].length} output`,`The main output comes from the selected kernel. Choose a preview to compare detectors on the same input. The two edge maps share a colour scale: teal is positive and coral is negative. The average map shows brightness.`);
  });listen(['k-map-focus'],lab);
  $('k-map-focus').addEventListener('input',()=>{if(!$(lab.canvas.id+'-panels').hidden)focusPanel(lab,2);});
  gallery.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
    $('k-map-focus').value=button.dataset.mapChoice;$('k-map-focus').dispatchEvent(new Event('input',{bubbles:true}));
  }));
}
function poolLab(){
  const lab=mount('cv-pool',lab=>{
    const img=inputFor(M.POOL_DEMO),kind=$('k-pool').value,out=M.pool2d(img,2,2,kind);
    const positions=M.convPositions(img.length,img[0].length,2,2),idx=Math.min(positions.length-1,Math.floor(lab.phase*positions.length)),p=positions[idx];
    lab.pos=positions;lab.index=idx;lab.out=out;lab.patchSize=2;lab.inputPad=0;
    drawPanels(lab.canvas,[{label:'Input',img,opts:{...imageOptions(),win:{y:p.y,x:p.x,k:2}}},{label:kind==='max'?'Max pooling':'Average pooling',img:out,opts:{...imageOptions(),win:{y:p.oy,x:p.ox,k:1}}}]);
    const values=M.patchAt(img,p.y,p.x,2).flat();
    readout('read-pool',`This window produces ${fmt(out[p.oy][p.ox])}`,`Four values become one ${kind==='max'?'maximum':'average'}. Size: ${img.length}×${img[0].length} → ${out.length}×${out[0].length}. No learned weights.`,`${kind==='max'?`max(${values.join(', ')})`:`(${values.join(' + ')}) / 4`} = <strong>${fmt(out[p.oy][p.ox])}</strong>.`);
  },{animated:true});listen(['k-pool'],lab);
}
function rfLab(){
  $('cv-rf').insertAdjacentHTML('afterend','<div id="field-growth" class="field-growth" aria-label="Receptive field by layer"></div>');
  const lab=mount('cv-rf',lab=>{
    const n=Number($('k-rf-n').value),k=Number($('k-rf-k').value),s=Number($('k-rf-s').value);
    const rows=M.receptiveField(Array.from({length:n},()=>({k,s}))),last=rows.at(-1);
    const img=M.pad2d(inputFor(DEMO),1),half=(last.rf-1)/2,centre=Math.floor(img.length/2);
    drawPanels(lab.canvas,[{label:`RF ${last.rf} · jump ${last.jump}`,img,opts:{...imageOptions(),win:{y:centre-half,x:centre-half,k:last.rf}}}]);
    $('field-growth').innerHTML='<b>Field growth · input pixels</b>'+rows.slice(1).map(r=>`<div><span>Layer ${r.layer}</span><i style="width:${Math.max(1,r.rf/last.rf*100)}%"></i><strong>${r.rf} × ${r.rf}</strong></div>`).join('');
    $('rf-table').innerHTML=rows.map(r=>`<tr><td>${r.layer}</td><td>${r.k} / ${r.s}</td><td>${r.rf}</td><td>${r.jump}</td></tr>`).join('');
    readout('read-rf',`${n} layers · receptive field ${last.rf}×${last.rf}`,`${last.rf>img.length?'The theoretical field exceeds the displayed image; the coral outline is clipped to the view.':'The coral region marks which input pixels can affect the selected unit.'} ${visualMode==='images'?'The 8×8 digit is shown with a 1-pixel zero margin. The growth bars use a shared scale within this stack.':''}`,`Each layer adds (K − 1) × previous jump to the receptive field, then multiplies jump by stride. Final field: <strong>${last.rf}</strong>; jump: <strong>${last.jump}</strong>.`);
  });bindRange('k-rf-n','k-rf-n-value',v=>v+' layers');listen(['k-rf-n','k-rf-k','k-rf-s'],lab);
}
function shiftLab(){
  const lab=mount('cv-shift',lab=>{
    const dx=Number($('k-shift').value);
    const src=M.pad2d(inputFor(M.blobImage(7,2,1,3,4)),1).map(row=>row.concat([0,0,0])),moved=M.shift2d(src,0,dx);
    const a=M.conv2d(src,M.KERNELS.edgex,1,1),b=M.conv2d(moved,M.KERNELS.edgex,1,1);
    const pa=M.pool2d(a,2,2),pb=M.pool2d(b,2,2);
    const stage=Number($('k-shift-stage').value),pairs=[[src,moved],[a,b],[pa,pb]],names=['Input','Convolution','Max pooling'];
    const opts=stage===0?imageOptions():{max:Math.max(maxAbs(a),maxAbs(b))};
    drawPanels(lab.canvas,[{label:names[stage]+' · original',img:pairs[stage][0],opts},{label:names[stage]+` · shifted +${dx}`,img:pairs[stage][1],opts}]);
    const same=JSON.stringify(pa)===JSON.stringify(pb);
    const descriptions=[
      'The same input moves inside a zero margin, leaving room for every allowed shift.',
      'A vertical-edge filter turns pixels into signed responses. Those responses move by the same number of pixels as the input: equivariance. Teal is positive; coral is negative.',
      `A 2×2 max pool with stride 2 summarises the edge responses. The whole pooled map ${same?'matches':'differs from'} the original in this example; pooling does not guarantee invariance.`
    ];
    readout('read-shift',`${names[stage]} · shift +${dx} pixels`,descriptions[stage],stage===0?'':`The fixed vertical-edge kernel is [−1, 0, 1] in each of its three rows. Convolution uses stride 1 and padding 1. ${stage===2?'Pooling then uses a 2×2 window and stride 2.':''}`);
  });bindRange('k-shift','k-shift-value',v=>v+' px');listen(['k-shift','k-shift-stage'],lab);
}
function alexLab(){
  $('cv-alex').insertAdjacentHTML('beforebegin','<div id="alex-stages" class="pipeline-stages" aria-label="Network stages">'+['Input','Convolution','ReLU','Max pooling'].map((name,i)=>`<button type="button" data-alex-stage="${i}" aria-pressed="${i===0}">${i+1} · ${name}</button>`).join('')+'</div>');
  const lab=mount('cv-alex',lab=>{
    const img=inputFor(),conv=M.conv2d(img,M.KERNELS.edgex,1,1),relu=conv.map(row=>row.map(v=>Math.max(0,v))),pool=M.pool2d(relu);
    const stage=Number($('k-alex-stage').value),names=['Input','Convolution','ReLU','Max pooling'];
    const arrays=[img,conv,relu,pool];
    const shown=stage===0?[0]:[stage-1,stage];
    drawPanels(lab.canvas,shown.map(i=>({label:names[i],img:arrays[i],opts:i===0?imageOptions():{}})));
    $('alex-stages').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
    const notes=['Start with pixel intensities.','A fixed vertical-edge kernel produces positive and negative responses.','ReLU keeps positive evidence. Negative responses become zero.','A 2×2 maximum with stride 2 makes the feature map half as tall and half as wide.'];
    readout('read-alex',`Stage ${stage+1} / 4 · ${names[stage]}`,`${notes[stage]}<br>AlexNet’s actual first layer uses 96 learned 11×11×3 kernels at stride 4: a 227×227 input gives 55×55 maps, then 3×3 pooling at stride 2 gives 27×27. This small example demonstrates the operations, not its trained predictions.`);
  });listen(['k-alex-stage'],lab);
  document.querySelectorAll('[data-alex-stage]').forEach(b=>b.addEventListener('click',()=>{$('k-alex-stage').value=b.dataset.alexStage;$('k-alex-stage').dispatchEvent(new Event('input',{bubbles:true}));}));
}
function archLab(){
  const lab=mount('cv-arch',lab=>{
    const n=Number($('k-vgg-n').value),s=M.stackVsLarge(3,n),source=inputFor(DEMO),padding=Math.max(0,Math.ceil((s.rf-source.length)/2)),img=M.pad2d(source,padding),centre=Math.floor(img.length/2);
    drawPanels(lab.canvas,[{label:`${n} small layers`,img,opts:{...imageOptions(),win:{y:centre-n,x:centre-n,k:s.rf}}},{label:`One ${s.kLarge}×${s.kLarge} layer`,img,opts:{...imageOptions(),win:{y:centre-n,x:centre-n,k:s.rf}}}]);
    readout('read-arch',`Same ${s.rf}×${s.rf} receptive field`,`<strong>${s.paramsSmall}</strong> weights in the stack; <strong>${s.paramsLarge}</strong> in one large filter. ${n===1?'The two designs coincide.':`With ReLU after each layer, the stack has ${n} nonlinearities instead of one.`} The matching regions show equal support, not equal outputs.`,`${n} × 3² = ${s.paramsSmall} weights in the stack; ${s.kLarge}² = ${s.paramsLarge} in the large filter. With a constant width of C channels, multiply both weight counts by C²; changing widths changes the comparison.`);
  });bindRange('k-vgg-n','k-vgg-n-value',v=>v+' × 3×3');listen(['k-vgg-n'],lab);
}
function problemVisuals(){
  const img=inputFor(),opt=imageOptions(),centre=Math.floor(img.length/2);
  const panel=(label,img,opts=opt)=>({label,img,opts});
  const edge=M.conv2d(img,M.KERNELS.edgex);
  const problems={
    why:[panel('Same pattern',M.pad2d(img,1)),panel('Different pixel addresses',M.shift2d(M.pad2d(img,1),0,1))],
    kernels:[panel('One pixel: enough evidence?',img,{...opt,win:{y:centre,x:centre,k:1}}),panel('A neighbourhood adds context',img,{...opt,win:{y:centre-1,x:centre-1,k:3}})],
    stride:[panel('Every centre · stride 1',M.conv2d(img,M.KERNELS.identity)),panel('Skipped centres · stride 2',M.conv2d(img,M.KERNELS.identity,2))],
    padding:[panel('Original',img),panel('One unpadded 3×3 layer',M.conv2d(img,M.KERNELS.identity))],
    maps:[panel('Vertical changes',edge,{}),panel('Horizontal changes',M.conv2d(img,M.KERNELS.edgey),{})],
    pooling:[panel('Many local responses',img),panel('One maximum per 2×2',M.pool2d(img))],
    field:[panel('A small view of a larger pattern',img,{...opt,win:{y:centre-1,x:centre-1,k:3}})],
    invariance:[panel('Original position',img),panel('Same object, shifted',M.shift2d(img,0,1))],
    alexnet:[panel('Raw pixels',img),panel('Edges are evidence, not a class',edge,{})],
    vgg:[panel('3×3: too little context',img,{...opt,win:{y:centre-1,x:centre-1,k:3}}),panel('7×7: a wider view',img,{...opt,win:{y:centre-3,x:centre-3,k:7}})]
  };
  Object.entries(problems).forEach(([id,panels])=>{
    const container=$('problem-'+id);container.dataset.visualMode=visualMode;
    container.innerHTML=panels.map(p=>`<div class="problem-panel${visualMode==='images'?' with-image':''}">${visualMode==='images'?imagePreview(p.img,p.opts):''}${tableHTML(p.img,p.label,p.opts)}</div>`).join('');
  });
  $('worked-patch').innerHTML=tableHTML(M.WORKED.patch,'Exercise patch',{image:visualMode==='images',max:3});
  $('worked-kernel').innerHTML=tableHTML(M.WORKED.kernel,'Exercise kernel');
  // The written exercises retain their own data in both modes.
  document.querySelectorAll('.questions-step .wt.small td').forEach(td=>{
    const raw=Number(td.textContent);
    if(visualMode==='images'&&Number.isFinite(raw)){const c=cellColors(raw,8,true);td.style.background=c.bg;td.style.color=c.fg;}
    else {td.style.background='';td.style.color='';}
  });
}
function applyMode(){
  document.body.dataset.visualMode=visualMode;
  $('visual-mode').setAttribute('aria-pressed',String(visualMode==='images'));
  $('mode-status').textContent=visualMode==='images'?'Images mode · real handwritten 7 · 8×8 pixels · intensity 0 (black) to 16 (white).':'Numbers mode · small matrices you can calculate by hand.';
  problemVisuals();
  Object.values(labs).forEach(lab=>{lab.phase=0;lab.stageKey='';lab.draw();syncPlayback(lab);});
}
function playbackState(lab){
  const n=lab.pos.length,position=Math.min(n,lab.phase*n);
  const index=Math.min(n-1,Math.floor(position)),p=lab.pos[index],next=lab.pos[index+1];
  const fraction=lab.phase>=1?1:position-index;
  const travel=Math.max(0,Math.min(1,(fraction-.8)/.2));
  const smooth=travel*travel*(3-2*travel);
  const win={x:p.x+(lab.inputPad||0),y:p.y+(lab.inputPad||0),k:lab.patchSize};
  // Interpolate adjacent windows only. Larger strides cross-fade between
  // valid origins; intermediate, unsampled patches must never be highlighted.
  const hop=Boolean(next&&(next.y!==p.y||Math.abs(next.x-p.x)>1));
  if(next&&!hop)win.x+=(next.x-p.x)*smooth;
  return {index,fraction,travel:smooth,window:win,next,hop,rowChange:next&&next.y!==p.y,
    visibleCount:lab.showFull?n:Math.min(n,index+(fraction>=.6?1:0)),
    stage:fraction<.16?'find':fraction<.6?'calculate':fraction<.8?'write':'move'};
}
function frameOutline(ctx,x,y,w,h,color,alpha=1){
  ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=10;
  ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.strokeRect(x+2,y+2,w-4,h-4);
  ctx.shadowBlur=0;ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.strokeRect(x+2,y+2,w-4,h-4);ctx.restore();
}
function paintAnimation(lab){
  if(!lab.scene||!lab.pos)return;
  const {backdrop,layout,cell,w,height}=lab.scene,ctx=canvasBox(lab.canvas,w,height);
  ctx.drawImage(backdrop,0,0,w,height);
  const state=playbackState(lab);lab.motion=state;
  const input=layout[0],output=layout.at(-1),p=lab.pos[state.index];
  const cols=output.img[0].length;
  // Unwritten output cells stay empty so the map visibly grows with the scan.
  for(let i=state.visibleCount;i<output.img.length*cols;i++){
    const x=output.x+(i%cols)*cell,y=output.y+Math.floor(i/cols)*cell;
    ctx.fillStyle='#e6ebe0';ctx.fillRect(x+.5,y+.5,cell-1,cell-1);
    ctx.fillStyle='#8d9a89';ctx.font='12px ui-monospace, monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('·',x+cell/2,y+cell/2);
  }
  const win=state.window;
  frameOutline(ctx,input.x+win.x*cell,input.y+win.y*cell,win.k*cell,win.k*cell,'#bf532e',state.hop?1-state.travel:1);
  if(state.hop&&state.travel){
    frameOutline(ctx,input.x+(state.next.x+(lab.inputPad||0))*cell,input.y+(state.next.y+(lab.inputPad||0))*cell,win.k*cell,win.k*cell,'#bf532e',state.travel);
  }
  if(state.stage==='calculate'){
    const term=Math.min(win.k*win.k-1,Math.floor((state.fraction-.16)/.44*win.k*win.k));
    const row=Math.floor(term/win.k),col=term%win.k;
    frameOutline(ctx,input.x+(p.x+(lab.inputPad||0)+col)*cell,input.y+(p.y+(lab.inputPad||0)+row)*cell,cell,cell,'#956c00');
    if(layout.length===3){const kernel=layout[1];frameOutline(ctx,kernel.x+col*cell,kernel.y+row*cell,cell,cell,'#956c00');}
  }
  const ox=output.x+p.ox*cell,oy=output.y+p.oy*cell;
  frameOutline(ctx,ox,oy,cell,cell,state.fraction>=.6?'#12655b':'#bf532e');
  if(state.stage==='write'){
    ctx.save();ctx.globalAlpha=.24*(1-(state.fraction-.6)/.2);ctx.fillStyle='#e6bd65';ctx.fillRect(ox,oy,cell,cell);ctx.restore();
  }
  // Stage and progress DOM updates happen only when their values change.
  const stage=lab.phase>=1?'complete':state.stage;
  const stageKey=stage+':'+state.index+':'+state.visibleCount;
  if(lab.stageKey!==stageKey){
    lab.stageKey=stageKey;lab.canvas.dataset.stage=stage;
    const active=stage==='find'||stage==='move'?0:stage==='calculate'?1:2;
    $(lab.canvas.id+'-stages').querySelectorAll('span').forEach((el,i)=>el.classList.toggle('current',i===active));
    $(lab.canvas.id+'-position').textContent=`${state.index+1} / ${lab.pos.length}`;
    const scrub=$(lab.canvas.id+'-scrub');scrub.max=lab.pos.length-1;scrub.value=state.index;
    const action={find:'Find the highlighted patch',calculate:lab.canvas.id==='cv-pool'?'Summarise the four highlighted values':'Multiply matching pixels and weights',write:'Write the result into the feature map',move:state.rowChange?'Start the next sampled row':state.hop?`Hop ${state.next.x-p.x} pixels to the next sampled patch`:'Slide to the next patch',complete:'Scan complete — every output cell is filled'};
    if(lab.canvas.id==='cv-stride'){
      const next=stage==='move'&&state.next?` Next origin (${state.next.y}, ${state.next.x})${state.rowChange?' — next row; column resets to 0':''}.`:'';
      $('stride-location').textContent=`Stride ${lab.state.stride} · input origin (${p.y}, ${p.x}) → output (${p.oy}, ${p.ox}).${next} Row, column; counted from 0.`;
    }
    $(lab.canvas.id+'-status').textContent=`${action[stage]}. ${state.visibleCount} / ${lab.pos.length} outputs visible.`;
  }
}
function syncPlayback(lab){
  const b=document.querySelector(`[data-motion="${lab.canvas.id}"]`);
  if(b){b.textContent=lab.playing?'Pause':lab.phase>=1?'Play again':'Play';b.setAttribute('aria-pressed',String(lab.playing));}
}
function wirePlayback(){
  document.querySelectorAll('[data-motion]').forEach(b=>{const lab=labs[b.dataset.motion];syncPlayback(lab);b.addEventListener('click',()=>{if(lab.phase>=1){lab.phase=0;lab.draw();}lab.playing=!lab.playing;syncPlayback(lab);});});
  document.querySelectorAll('[data-replay]').forEach(b=>b.addEventListener('click',()=>{const lab=labs[b.dataset.replay];lab.phase=0;lab.playing=true;lab.draw();syncPlayback(lab);}));
  const seek=(lab,index)=>{lab.playing=false;lab.phase=(index+.7)/lab.pos.length;lab.draw();syncPlayback(lab);};
  document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{const lab=labs[b.dataset.next];seek(lab,(lab.index+1)%lab.pos.length);}));
  document.querySelectorAll('[data-scrub]').forEach(el=>el.addEventListener('input',()=>seek(labs[el.dataset.scrub],Number(el.value))));
  document.querySelectorAll('[data-speed]').forEach(el=>el.addEventListener('input',()=>{labs[el.dataset.speed].speed=Number(el.value);}));
  document.querySelectorAll('[data-full-map]').forEach(b=>b.addEventListener('click',()=>{const lab=labs[b.dataset.fullMap];lab.showFull=!lab.showFull;b.textContent=lab.showFull?'Show scan progress':'Show full map';b.setAttribute('aria-pressed',String(lab.showFull));paintAnimation(lab);}));
}
function advanceLab(lab,dt){
  if(!lab.playing||!lab.pos)return;
  lab.phase=Math.min(1,lab.phase+dt*lab.speed/(lab.pos.length*2));
  const index=Math.min(lab.pos.length-1,Math.floor(lab.phase*lab.pos.length));
  if(index!==lab.index)lab.draw();else paintAnimation(lab);
  if(lab.phase>=1){lab.playing=false;syncPlayback(lab);}
}
let last=0;
function animate(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  Object.values(labs).forEach(lab=>{
    if(!lab.playing||!lab.visible||document.hidden)return;
    advanceLab(lab,dt);
  });
  requestAnimationFrame(animate);
}

function checkers(){
  document.querySelectorAll('.chkbtn').forEach(btn=>{
    const box = btn.closest('.box');
    const msg = btn.parentNode.querySelector('.chkmsg');
    btn.addEventListener('click', ()=>{
      const inputs = box.querySelectorAll('.qin');
      let right=0, total=0;
      inputs.forEach(inp=>{
        total++;
        const raw = inp.value.trim();
        const ans = inp.getAttribute('data-a').split('|');
        const tol = parseFloat(inp.getAttribute('data-tol')||'0');
        if(raw===''){ inp.classList.remove('ok','no'); return; }
        let ok=false;
        const num = parseFloat(raw.replace(/,/g,'').replace(/%$/,''));
        ans.forEach(a=>{
          const an = parseFloat(a);
          if(!isNaN(an) && !isNaN(num) && /^[-+]?[\d.,]+%?$/.test(raw)){
            const t = tol || Math.max(Math.abs(an)*0.012, 0.0051);
            if(Math.abs(num-an)<=t) ok=true;
          } else if(raw.toLowerCase()===a.toLowerCase()) ok=true;
        });
        inp.classList.toggle('ok', ok);
        inp.classList.toggle('no', !ok);
        if(ok) right++;
      });
      msg.textContent = right===total ? 'All '+total+' correct.' : right+' of '+total+' correct. Fix the red boxes and check again.';
      msg.classList.toggle('good', right===total);
      updateProgress();
    });
  });
}

const storageKey = 'cnn-lab-v1';
function save(){
  const values = {};
  document.querySelectorAll('.qin[id]').forEach(inp=>{ values[inp.id]=inp.value; });
  try{ localStorage.setItem(storageKey, JSON.stringify(values)); }
  catch{ $('storage-note').textContent='Progress is available for this visit; browser storage is unavailable.'; }
}
function loadSaved(){
  try{
    const saved = JSON.parse(localStorage.getItem(storageKey)||'{}');
    if(!saved || typeof saved!=='object' || Array.isArray(saved)) return;
    Object.entries(saved).forEach(([id,v])=>{ const el=$(id); if(el && el.classList.contains('qin')) el.value=v; });
  }catch{ $('storage-note').textContent='Progress is available for this visit; browser storage is unavailable.'; }
}
function updateProgress(){
  const inputs=[...document.querySelectorAll('.qin')];
  const filled = inputs.filter(i=>i.classList.contains('ok')).length;
  const parts=[...document.querySelectorAll('section.lab')];
  let complete=0;
  parts.forEach((sec,i)=>{
    const qs=sec.querySelectorAll('.qin');
    const done = qs.length && [...qs].every(q=>q.classList.contains('ok'));
    sec.classList.toggle('complete', done);
    const link=document.querySelectorAll('nav a')[i];
    if(link) link.classList.toggle('done', done);
    if(done) complete++;
  });
  $('progress').max = inputs.length;
  $('progress').value = filled;
  $('progress-label').textContent = `${complete} of ${parts.length} sections complete`;
  $('progress-percent').textContent = inputs.length ? Math.round(filled/inputs.length*100)+'%' : '0%';
  $('finish').hidden = complete !== parts.length;
  save();
}

function nav(){
  const links=[...document.querySelectorAll('nav a')];
  const secs=[...document.querySelectorAll('.lab')];
  let pending=false;
  window.addEventListener('scroll', ()=>{
    if(pending) return; pending=true;
    requestAnimationFrame(()=>{
      let active=0;
      secs.forEach((s,i)=>{ if(s.getBoundingClientRect().top<220) active=i; });
      links.forEach((a,i)=>{
        a.classList.toggle('active', i===active);
        if(i===active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');
      });
      pending=false;
    });
  }, {passive:true});
}

document.querySelectorAll('.qin').forEach((inp,i)=>{ if(!inp.id) inp.id='qin-'+i; inp.addEventListener('change', save); });
loadSaved();
arrangeExperiments();
whyLab(); convolutionLabs(); mapsLab(); poolLab(); rfLab(); shiftLab(); alexLab(); archLab();
applyMode();
$('visual-mode').addEventListener('click',()=>{
  visualMode=visualMode==='images'?'numbers':'images';
  try{localStorage.setItem(viewKey,visualMode);}catch{}
  applyMode();
});
wirePlayback(); checkers(); nav(); updateProgress();
requestAnimationFrame(animate);

$('reset-progress').addEventListener('click', ()=>$('reset-dialog').showModal());
$('cancel-reset').addEventListener('click', ()=>$('reset-dialog').close());
$('confirm-reset').addEventListener('click', ()=>{
  document.querySelectorAll('.qin').forEach(i=>{ i.value=''; i.classList.remove('ok','no'); });
  document.querySelectorAll('.chkmsg').forEach(m=>{ m.textContent=''; m.classList.remove('good'); });
  try{ localStorage.removeItem(storageKey); }catch{}
  updateProgress(); $('reset-dialog').close();
});
$('print').addEventListener('click', ()=>window.print());
