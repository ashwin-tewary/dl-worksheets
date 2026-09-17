'use strict';
const M = window.CNNModel;
const $ = id => document.getElementById(id);
const colors = {teal:'#12655b',orange:'#a64126',ink:'#182e2b',paper:'#f6f4ed'};
const labs = {};
const viewKey = 'cnn-visual-mode-v1';
let visualMode = 'numbers';
try { if(localStorage.getItem(viewKey)==='images') visualMode='images'; } catch {}

// UCI Optical Recognition of Handwritten Digits, Alpaydin & Kaynak (1998).
// CC BY 4.0, https://doi.org/10.24432/C50P49. Sample index 7 in
// scikit-learn's digits.csv.gz. Native 8×8 intensities, unchanged (0–16).
const DIGIT = [
  [0,0,7,8,13,16,15,1], [0,0,7,7,4,11,12,0],
  [0,0,0,0,8,13,1,0], [0,4,8,8,15,15,6,0],
  [0,2,11,15,15,4,0,0], [0,0,0,16,5,0,0,0],
  [0,0,9,15,1,0,0,0], [0,0,13,5,0,0,0,0]
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
  canvas.style.width=w+'px';canvas.style.height=h+'px';
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
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
  const margin=12,gap=22,minCell=32;
  const w=Math.max(canvasWidth(canvas),Math.max(...panels.map(p=>p.img[0].length))*minCell+margin*2);
  $(canvas.id+'-scroll-hint').hidden=w<=canvasWidth(canvas);
  const available=w-margin*2;
  const oneRow=panels.reduce((n,p)=>n+Math.max(p.img[0].length*minCell,115),0)+gap*(panels.length-1)<=available;
  const cell=oneRow?Math.min(38,Math.floor((available-gap*(panels.length-1))/panels.reduce((n,p)=>n+p.img[0].length,0))):minCell;
  let x=margin,y=32,rowHeight=0;
  const layout=panels.map(p=>{
    const pw=Math.max(p.img[0].length*cell,115);
    if(x>margin&&x+pw>w-margin){x=margin;y+=rowHeight+48;rowHeight=0;}
    const box={...p,x,y};x+=pw+gap;rowHeight=Math.max(rowHeight,p.img.length*cell);return box;
  });
  const ctx=canvasBox(canvas,w,y+rowHeight+14);
  layout.forEach(p=>{title(ctx,p.label,p.x,p.y-12);drawGrid(ctx,p.img,p.x,p.y,cell,p.opts);});
  inspectValues(canvas,panels);
}
function mount(id,draw,{animated=false}={}){
  const canvas=$(id);
  const wrapper=document.createElement('div');wrapper.className='canvas-scroll';
  wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','Visual matrices; scroll horizontally for wide grids');wrapper.tabIndex=0;
  canvas.before(wrapper);wrapper.append(canvas);
  wrapper.insertAdjacentHTML('afterend',`<p class="matrix-scroll-hint" id="${id}-scroll-hint" hidden>↔ Scroll the visual sideways to see the whole matrix.</p><details class="matrix-values" id="${id}-values"><summary>Inspect matrices · values to 3 decimals</summary><div class="matrix-tables"></div></details>`);
  const lab={canvas,phase:0,index:0,playing:animated&&!matchMedia('(prefers-reduced-motion: reduce)').matches,visible:true,draw(){draw(lab);}};
  labs[id]=lab;
  let lastWidth=0;
  new ResizeObserver(()=>{const w=canvasWidth(canvas);if(w!==lastWidth){lastWidth=w;lab.draw();}}).observe(wrapper);
  new IntersectionObserver(es=>{lab.visible=es[0].isIntersecting;}).observe(canvas);
  return lab;
}
function bindRange(id,outId,format=v=>v){
  const el=$(id);const paint=()=>$(outId).textContent=format(el.value);
  el.addEventListener('input',paint);paint();
}
function listen(ids,lab){ids.forEach(id=>$(id).addEventListener('input',()=>{lab.phase=0;lab.draw();}));}
function readout(id,heading,text){$(id).innerHTML=`<b>${heading}</b><p>${text}</p>`;}
function mountConv(id,getState){
  return mount(id,lab=>{
    const st=getState(),img=st.img,k=st.kernel.length;
    const padded=M.pad2d(img,st.pad),out=M.conv2d(img,st.kernel,st.stride,st.pad);
    const positions=M.convPositions(img.length,img[0].length,k,st.stride,st.pad);
    const idx=Math.min(positions.length-1,Math.floor(lab.phase*positions.length)),p=positions[idx];
    lab.pos=positions;lab.index=idx;lab.out=out;lab.state=st;
    const patch=M.patchAt(img,p.y,p.x,k,st.pad);
    lab.patch=patch;
    drawPanels(lab.canvas,[
      {label:`Input${st.pad?' + padding':''}`,img:padded,opts:{...imageOptions(),win:{y:p.y+st.pad,x:p.x+st.pad,k}}},
      {label:'Kernel',img:st.kernel},
      {label:'Output',img:out,opts:{win:{y:p.oy,x:p.ox,k:1},...([M.KERNELS.identity,M.KERNELS.blur].includes(st.kernel)?imageOptions():{})}}
    ]);
    const terms=patch.flat().map((v,i)=>`${fmt(v)} × (${cellLabel(st.kernel.flat()[i])})`).join(' + ');
    const equals=Number.isInteger(out[p.oy][p.ox])?'=':'≈';
    readout(st.readout,`Output (${p.oy}, ${p.ox}) ${equals} ${fmt(out[p.oy][p.ox])}`,`H<sub>out</sub> = ⌊(${img.length} + ${2*st.pad} − ${k}) / ${st.stride}⌋ + 1 = <strong>${out.length}</strong>. ${positions.length} placements.<br><span class="calculation">${terms} ${equals} <b>${fmt(out[p.oy][p.ox])}</b></span>`);
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
  const lab=mount('cv-maps',lab=>{
    const img=inputFor(),ks=[M.KERNELS.edgex,M.KERNELS.edgey,M.KERNELS.blur],names=['Vertical edges','Horizontal edges','Local average'];
    const focus=Number($('k-map-focus').value),maps=ks.map(k=>M.conv2d(img,k));
    drawPanels(lab.canvas,[{label:'Input',img,opts:imageOptions()},{label:'Selected kernel',img:ks[focus]},...maps.map((img,i)=>({label:(i===focus?'● ':'')+names[i],img,opts:i===2?imageOptions():{}}))]);
    readout('read-maps',`Three detectors → ${maps[0].length}×${maps[0][0].length}×3`,`Selected: <strong>${names[focus]}</strong>. The other maps stay visible for comparison. Each map has its own filter; the same filter is reused at every location. Teal = positive response, coral = negative response; each signed map uses its own colour range.`);
  });listen(['k-map-focus'],lab);
}
function poolLab(){
  const lab=mount('cv-pool',lab=>{
    const img=inputFor(M.POOL_DEMO),kind=$('k-pool').value,out=M.pool2d(img,2,2,kind);
    const positions=M.convPositions(img.length,img[0].length,2,2),idx=Math.min(positions.length-1,Math.floor(lab.phase*positions.length)),p=positions[idx];
    lab.pos=positions;lab.index=idx;lab.out=out;
    drawPanels(lab.canvas,[{label:'Input',img,opts:{...imageOptions(),win:{y:p.y,x:p.x,k:2}}},{label:kind==='max'?'Max pooling':'Average pooling',img:out,opts:{...imageOptions(),win:{y:p.oy,x:p.ox,k:1}}}]);
    const values=M.patchAt(img,p.y,p.x,2).flat();
    readout('read-pool',`Output (${p.oy}, ${p.ox}) = ${fmt(out[p.oy][p.ox])}`,`${kind==='max'?`max(${values.join(', ')})`:`(${values.join(' + ')}) / 4`} = <strong>${fmt(out[p.oy][p.ox])}</strong>. Size: ${img.length}×${img[0].length} → ${out.length}×${out[0].length}. No learned weights.`);
  },{animated:true});listen(['k-pool'],lab);
}
function rfLab(){
  const lab=mount('cv-rf',lab=>{
    const n=Number($('k-rf-n').value),k=Number($('k-rf-k').value),s=Number($('k-rf-s').value);
    const rows=M.receptiveField(Array.from({length:n},()=>({k,s}))),last=rows.at(-1);
    const img=visualMode==='images'?M.pad2d(DIGIT,3):M.pad2d(DEMO,4),half=(last.rf-1)/2;
    drawPanels(lab.canvas,[{label:`RF ${last.rf} · jump ${last.jump}`,img,opts:{...imageOptions(),win:{y:7-half,x:7-half,k:last.rf}}}]);
    $('rf-table').innerHTML=rows.map(r=>`<tr><td>${r.layer}</td><td>${r.k} / ${r.s}</td><td>${r.rf}</td><td>${r.jump}</td></tr>`).join('');
    readout('read-rf',`${n} layers · receptive field ${last.rf}×${last.rf}`,`Each layer adds (K − 1) × previous jump, then multiplies jump by stride. ${last.rf>img.length?'The theoretical field exceeds the displayed image; the coral outline is clipped to the view.':'The coral region marks which input pixels can affect the selected unit.'} ${visualMode==='images'?'The 8×8 digit is shown with a 3-pixel zero margin.':''}`);
  });bindRange('k-rf-n','k-rf-n-value',v=>v+' layers');listen(['k-rf-n','k-rf-k','k-rf-s'],lab);
}
function shiftLab(){
  const lab=mount('cv-shift',lab=>{
    const dx=Number($('k-shift').value);
    const src=visualMode==='images'?M.pad2d(DIGIT,2):M.blobImage(7,2,1,3,4),moved=M.shift2d(src,0,dx);
    const a=M.conv2d(src,M.KERNELS.identity,1,1),b=M.conv2d(moved,M.KERNELS.identity,1,1);
    const pa=M.pool2d(a,2,2),pb=M.pool2d(b,2,2);
    drawPanels(lab.canvas,[{label:'Input',img:src,opts:imageOptions()},{label:`Input shifted +${dx}`,img:moved,opts:imageOptions()},{label:'Convolution',img:a,opts:imageOptions()},{label:'Conv. after shift',img:b,opts:imageOptions()},{label:'Pooled original',img:pa,opts:imageOptions()},{label:'Pooled shifted',img:pb,opts:imageOptions()}]);
    const same=JSON.stringify(pa)===JSON.stringify(pb);
    readout('read-shift',`Shift +${dx} pixels · ${same?'pooled maps match':'pooled maps differ'}`,`The identity convolution moves with the input: equivariance. The <em>whole</em> pooled map is ${same?'unchanged in this example':'different in this example'}; one unchanged cell would not prove invariance. Zero-filled shifts discard anything beyond the frame.`);
  });bindRange('k-shift','k-shift-value',v=>v+' px');listen(['k-shift'],lab);
}
function alexLab(){
  const lab=mount('cv-alex',lab=>{
    const img=inputFor(),conv=M.conv2d(img,M.KERNELS.edgex,1,1),relu=conv.map(row=>row.map(v=>Math.max(0,v))),pool=M.pool2d(relu);
    const stage=Number($('k-alex-stage').value),names=['Input','Convolution','ReLU','Max pooling'];
    const arrays=[img,conv,relu,pool];
    drawPanels(lab.canvas,arrays.slice(0,stage+1).map((img,i)=>({label:names[i],img,opts:i===0?imageOptions():{}})));
    const notes=['Start with pixel intensities.','A fixed vertical-edge kernel produces positive and negative responses.','ReLU keeps positive evidence: max(0, z). Negative responses become zero.','A 2×2 maximum with stride 2 makes the feature map half as tall and half as wide.'];
    readout('read-alex',`Stage ${stage+1} / 4 · ${names[stage]}`,`${notes[stage]}<br>AlexNet’s actual first layer uses 96 learned 11×11×3 kernels at stride 4: a 227×227 input gives 55×55 maps, then 3×3 pooling at stride 2 gives 27×27. This small example demonstrates the operations, not its trained predictions.`);
  });listen(['k-alex-stage'],lab);
}
function archLab(){
  const lab=mount('cv-arch',lab=>{
    const n=Number($('k-vgg-n').value),s=M.stackVsLarge(3,n),img=inputFor(DEMO),centre=Math.floor(img.length/2);
    drawPanels(lab.canvas,[{label:`${n} small layers`,img,opts:{...imageOptions(),win:{y:centre-n,x:centre-n,k:s.rf}}},{label:`One ${s.kLarge}×${s.kLarge} layer`,img,opts:{...imageOptions(),win:{y:centre-n,x:centre-n,k:s.rf}}}]);
    readout('read-arch',`Same ${s.rf}×${s.rf} receptive field`,`${n} × 9 = <strong>${s.paramsSmall}</strong> weights in the stack; ${s.kLarge}² = <strong>${s.paramsLarge}</strong> in one large filter. ${n===1?'The two designs coincide.':`With ReLU after each layer, the stack has ${n} nonlinearities instead of one.`} The matching regions show equal support, not equal outputs. With a constant width of C channels, multiply both weight counts by C²; changing widths changes the comparison.`);
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
    container.innerHTML=panels.map(p=>`<div class="problem-panel">${visualMode==='images'?imagePreview(p.img,p.opts):''}${tableHTML(p.img,p.label,p.opts)}</div>`).join('');
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
  Object.values(labs).forEach(lab=>{lab.phase=0;lab.draw();});
}
function wirePlayback(){
  const sync=id=>{const b=document.querySelector(`[data-motion="${id}"]`);if(b){b.textContent=labs[id].playing?'Pause':'Play';b.setAttribute('aria-pressed',String(labs[id].playing));}};
  document.querySelectorAll('[data-motion]').forEach(b=>{sync(b.dataset.motion);b.addEventListener('click',()=>{labs[b.dataset.motion].playing=!labs[b.dataset.motion].playing;sync(b.dataset.motion);});});
  document.querySelectorAll('[data-replay]').forEach(b=>b.addEventListener('click',()=>{const lab=labs[b.dataset.replay];lab.phase=0;lab.playing=true;lab.draw();sync(b.dataset.replay);}));
  document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{const lab=labs[b.dataset.next];lab.playing=false;lab.phase=((lab.index+1)%lab.pos.length+.001)/lab.pos.length;lab.draw();sync(b.dataset.next);}));
}
let last=0;
function animate(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  Object.values(labs).forEach(lab=>{
    if(!lab.playing||!lab.visible||document.hidden)return;
    const n=lab.pos.length;
    lab.phase=(lab.phase+dt/(n*1.35))%1;
    // Redraw only when the selected patch changes, not on every frame.
    if(Math.floor(lab.phase*n)!==lab.index)lab.draw();
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
