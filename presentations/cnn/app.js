'use strict';
const M = window.CNNModel;
const $ = id => document.getElementById(id);
const colors = { teal:'#167569', orange:'#c0613e', gold:'#bc8730', ink:'#294c42', paper:'#eef1e7' };

function fmt(n){
  if(!Number.isFinite(n)) return '—';
  if(Object.is(n,-0)) n = 0;
  if(Number.isInteger(n)) return String(n);
  const a = Math.abs(n);
  if(a>=100) return n.toFixed(1);
  if(a>=1) return n.toFixed(2);
  return n.toFixed(3);
}

function maxAbs(img){
  let m = 1e-9;
  img.forEach(row => row.forEach(v => { m = Math.max(m, Math.abs(v)); }));
  return m;
}

function mix(a,b,t){
  return a.map((c,i)=>Math.round(c+(b[i]-c)*t));
}
const TEAL=[22,117,105], ORANGE=[192,97,62], PAPER=[247,248,241];
function fillFor(v,m){
  const t = Math.max(-1, Math.min(1, v/(m||1)));
  const rgb = t>=0 ? mix(PAPER, TEAL, t) : mix(PAPER, ORANGE, -t);
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function drawGrid(ctx, img, x0, y0, cell, opts={}){
  const h = img.length, w = img[0].length, m = opts.max || maxAbs(img);
  const win = opts.win, pad = opts.pad || 0;
  ctx.font = Math.max(9, cell*0.32)+'px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(let i=0;i<h;i++)for(let j=0;j<w;j++){
    const x = x0+j*cell, y = y0+i*cell;
    ctx.fillStyle = fillFor(img[i][j], m);
    ctx.fillRect(x,y,cell-1,cell-1);
    if(win && i>=win.y && i<win.y+win.k && j>=win.x && j<win.x+win.k){
      ctx.strokeStyle = colors.orange; ctx.lineWidth = 2; ctx.strokeRect(x+0.5,y+0.5,cell-2,cell-2);
    }
    ctx.fillStyle = Math.abs(img[i][j])>0.55*m ? '#fff' : colors.ink;
    ctx.fillText(fmt(img[i][j]), x+cell/2, y+cell/2);
  }
  ctx.strokeStyle = '#c9d4c4'; ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, w*cell, h*cell);
  return {w:w*cell, h:h*cell, m};
}

function title(ctx, text, x, y){
  ctx.fillStyle = '#607661'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.fillText(text, x, y);
}

function sizeCanvas(canvas){
  const rect = canvas.getBoundingClientRect();
  if(!rect.width) return {w:600,h:300};
  const dpr = Math.min(devicePixelRatio||1, 2);
  const w = Math.round(rect.width), h = Math.round(rect.height);
  if(canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)){
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#f3f4eb'); g.addColorStop(1,'#e7edde');
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  return {w,h,ctx};
}

const DEMO = M.blobImage(7,2,2,3,4);
const EDGE_IMG = [
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],
  [1,1,1,1,0,0,0],
  [1,1,1,1,0,0,0],
  [1,1,1,1,0,0,0],
  [0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0]
];

function kernelByName(name){ return M.KERNELS[name] || M.KERNELS.edgex; }

const labs = {};

function mountConv(id, getState){
  const canvas = $(id);
  const lab = {
    canvas, phase:0, playing:!matchMedia('(prefers-reduced-motion: reduce)').matches, speed:1, visible:true, walk:-1,
    draw(){
      const st = getState();
      lab.state = st;
      const {w,h,ctx} = sizeCanvas(canvas);
      const img = st.pad ? M.pad2d(st.img, st.pad) : st.img;
      const k = st.kernel.length;
      const pos = M.convPositions(st.img.length, st.img[0].length, k, st.stride, st.pad);
      const idx = Math.min(pos.length-1, Math.floor(Math.min(0.999, lab.phase)*Math.max(pos.length,1)));
      const p = pos[idx] || {y:0,x:0,oy:0,ox:0};
      const out = M.conv2d(st.img, st.kernel, st.stride, st.pad);
      const cellIn = Math.min(28, Math.floor((h-70)/img.length));
      const cellOut = Math.min(34, Math.floor((h-70)/Math.max(out.length,1)));
      title(ctx, 'INPUT'+(st.pad?' + PAD':''), 16, 22);
      drawGrid(ctx, img, 16, 36, cellIn, {win:{y:p.y+st.pad,x:p.x+st.pad,k}, pad:st.pad});
      const kx = 16 + img[0].length*cellIn + 28;
      title(ctx, 'KERNEL', kx, 22);
      drawGrid(ctx, st.kernel, kx, 36, 36);
      const ox = kx + 3*36 + 28;
      title(ctx, `OUTPUT  ${out.length}×${out[0].length}`, ox, 22);
      drawGrid(ctx, out, ox, 36, cellOut, {win:{y:p.oy,x:p.ox,k:1}});
      lab.pos = pos; lab.index = idx; lab.out = out; lab.patch = M.patchAt(st.img, p.y, p.x, k, st.pad);
      if(st.readout){
        const prod = M.innerProduct(lab.patch, st.kernel);
        st.readout.innerHTML = `<b>Window (${p.oy}, ${p.ox}) on the output</b><p>The coral frame is the ${k}×${k} patch. Its inner product with the kernel is <strong>${fmt(prod)}</strong>, written at that output cell.</p><p>H<sub>out</sub> = ⌊(H + 2P − K)/S⌋ + 1 = ⌊(${st.img.length} + ${2*st.pad} − ${k})/${st.stride}⌋ + 1 = <strong>${out.length}</strong>.</p>`;
      }
    }
  };
  new ResizeObserver(()=>lab.draw()).observe(canvas);
  new IntersectionObserver(es=>{lab.visible=es[0].isIntersecting;}).observe(canvas);
  labs[id] = lab;
  return lab;
}

function bindRange(id, outId, fmtFn){
  const el = $(id); if(!el) return;
  const paint = ()=>{ if(outId && $(outId)) $(outId).textContent = fmtFn ? fmtFn(el.value) : el.value; };
  el.addEventListener('input', ()=>{ paint(); Object.values(labs).forEach(L=>{L.phase=0; L.draw();}); });
  paint();
}

function kernelLab(){
  const read = $('read-kernel');
  const lab = mountConv('cv-kernel', ()=>({
    img: EDGE_IMG, kernel: kernelByName($('k-kernel').value), stride:1, pad:0, readout: read
  }));
  $('k-kernel').addEventListener('input', ()=>{ lab.phase=0; lab.draw(); });
  lab.draw();
}

function strideLab(){
  const read = $('read-stride');
  const lab = mountConv('cv-stride', ()=>({
    img: DEMO, kernel: M.KERNELS.identity, stride: Number($('k-stride').value), pad:0, readout: read
  }));
  bindRange('k-stride','k-stride-value', v=>v+' px');
  $('k-stride').addEventListener('input', ()=>lab.draw());
  lab.draw();
}

function padLab(){
  const read = $('read-pad');
  const lab = mountConv('cv-pad', ()=>({
    img: DEMO, kernel: M.KERNELS.identity, stride:1, pad: Number($('k-pad').value), readout: read
  }));
  bindRange('k-pad','k-pad-value', v=>v+' px');
  $('k-pad').addEventListener('input', ()=>lab.draw());
  lab.draw();
}

function mapsLab(){
  const canvas = $('cv-maps');
  const lab = {
    canvas, phase:0, playing:false, speed:1, visible:true,
    draw(){
      const {w,h,ctx} = sizeCanvas(canvas);
      const kernels = [M.KERNELS.edgex, M.KERNELS.edgey, M.KERNELS.blur];
      const names = ['edge x','edge y','blur'];
      const cell = Math.min(22, Math.floor((h-80)/7));
      title(ctx, 'ONE IMAGE · THREE KERNELS · THREE FEATURE MAPS', 16, 22);
      drawGrid(ctx, EDGE_IMG, 16, 40, cell);
      kernels.forEach((k,i)=>{
        const x = 16 + 7*cell + 24 + i*(5*36);
        title(ctx, names[i].toUpperCase(), x, 22);
        drawGrid(ctx, k, x, 40, 22);
        const fmap = M.conv2d(EDGE_IMG, k, 1, 0);
        drawGrid(ctx, fmap, x, 40+3*22+16, 26);
      });
      $('read-maps').innerHTML = `<b>A feature map is one kernel’s output</b><p>Each coral detector looks for a different pattern. Stacking the three maps gives a 5×5×3 volume. The network later learns the kernels; here they are fixed so you can see the geometry.</p><p>Parameters for 16 kernels on 3 input channels, 3×3, no bias: 16 × 3 × 9 = <strong>432</strong>.</p>`;
    }
  };
  new ResizeObserver(()=>lab.draw()).observe(canvas);
  new IntersectionObserver(es=>{lab.visible=es[0].isIntersecting;}).observe(canvas);
  labs['cv-maps'] = lab; lab.draw();
}

function poolLab(){
  const canvas = $('cv-pool');
  const lab = {
    canvas, phase:0, playing:!matchMedia('(prefers-reduced-motion: reduce)').matches, speed:1, visible:true,
    draw(){
      const kind = $('k-pool').value;
      const img = M.POOL_DEMO;
      const out = M.pool2d(img, 2, 2, kind);
      const pos = M.convPositions(4,4,2,2,0);
      const idx = Math.min(pos.length-1, Math.floor(Math.min(0.999, lab.phase)*pos.length));
      const p = pos[idx];
      const {w,h,ctx} = sizeCanvas(canvas);
      title(ctx, '4×4 INPUT', 16, 22);
      drawGrid(ctx, img, 16, 40, 42, {win:{y:p.y,x:p.x,k:2}});
      title(ctx, (kind==='max'?'MAX':'AVG')+' 2×2, STRIDE 2', 16+4*42+36, 22);
      drawGrid(ctx, out, 16+4*42+36, 40, 64, {win:{y:p.oy,x:p.ox,k:1}});
      $('read-pool').innerHTML = `<b>Window (${p.oy}, ${p.ox})</b><p>${kind==='max'?'The output is the largest value in the 2×2.':'The output is the mean of the four values.'} Pooling has <strong>no learned weights</strong>.</p><p>Spatial size: 4 → 2. With overlapping 3×3 stride 2 (AlexNet), size falls more slowly than a 2×2 stride 2 grid.</p>`;
    }
  };
  $('k-pool').addEventListener('input', ()=>{lab.phase=0; lab.draw();});
  new ResizeObserver(()=>lab.draw()).observe(canvas);
  new IntersectionObserver(es=>{lab.visible=es[0].isIntersecting;}).observe(canvas);
  labs['cv-pool'] = lab; lab.draw();
}

function rfLab(){
  const canvas = $('cv-rf');
  function layers(){
    const n = Number($('k-rf-n').value);
    const k = Number($('k-rf-k').value);
    const s = Number($('k-rf-s').value);
    return Array.from({length:n}, ()=>({k,s,p:0}));
  }
  const lab = {
    canvas, phase:0, playing:false, speed:1, visible:true,
    draw(){
      const rows = M.receptiveField(layers());
      const {w,h,ctx} = sizeCanvas(canvas);
      const last = rows.at(-1);
      const n = 15, cell = Math.min(22, Math.floor((Math.min(w,h)-80)/n));
      const cx = 8, cy = 7, half = (last.rf-1)/2;
      const img = M.zeros(n,n);
      for(let i=0;i<n;i++)for(let j=0;j<n;j++){
        const d = Math.max(Math.abs(i-cy), Math.abs(j-cx));
        img[i][j] = d<=half ? 1 - d/(half+0.5) : 0;
      }
      title(ctx, `RECEPTIVE FIELD = ${last.rf} · JUMP = ${last.jump}`, 16, 22);
      drawGrid(ctx, img, 16, 40, cell, {win:{y:cy-half, x:cx-half, k:last.rf}});
      $('rf-table').innerHTML = rows.map(r=>`<tr><td>${r.layer}</td><td>${r.k} / ${r.s}</td><td>${r.rf}</td><td>${r.jump}</td></tr>`).join('');
      $('read-rf').innerHTML = `<b>After ${rows.length-1} layer(s)</b><p>Each new layer adds (K − 1) × jump to the field, then multiplies the jump by the stride. Three 3×3 layers at stride 1 give RF = 7, the same field as one 7×7.</p>`;
    }
  };
  ['k-rf-n','k-rf-k','k-rf-s'].forEach(id=>$(id).addEventListener('input', ()=>{
    if(id==='k-rf-n') $('k-rf-n-value').textContent = $('k-rf-n').value+' layers';
    lab.phase=0; lab.draw();
  }));
  $('k-rf-n-value').textContent = $('k-rf-n').value+' layers';
  new ResizeObserver(()=>lab.draw()).observe(canvas);
  labs['cv-rf'] = lab; lab.draw();
}

function shiftLab(){
  const canvas = $('cv-shift');
  const lab = {
    canvas, phase:0, playing:!matchMedia('(prefers-reduced-motion: reduce)').matches, speed:1, visible:true,
    draw(){
      const dx = Number($('k-shift').value);
      const src = M.blobImage(7,2,1,3,4);
      const moved = M.shift2d(src, 0, dx);
      const a = M.conv2d(src, M.KERNELS.identity, 1, 1);
      const b = M.conv2d(moved, M.KERNELS.identity, 1, 1);
      const pooledA = M.pool2d(a,2,2,'max');
      const pooledB = M.pool2d(b,2,2,'max');
      const {w,h,ctx} = sizeCanvas(canvas);
      const cell = 22;
      title(ctx, 'INPUT', 16, 22); drawGrid(ctx, src, 16, 36, cell);
      title(ctx, `SHIFTED +${dx}`, 16+8*cell, 22); drawGrid(ctx, moved, 16+8*cell, 36, cell);
      title(ctx, 'CONV (EQUIVARIANT)', 16, 36+8*cell); drawGrid(ctx, a, 16, 50+8*cell, 18);
      title(ctx, 'CONV AFTER SHIFT', 16+8*cell, 36+8*cell); drawGrid(ctx, b, 16+8*cell, 50+8*cell, 18);
      $('read-shift').innerHTML = `<b>Shift of ${dx} pixel(s)</b><p>A stride-1 convolution <strong>moves with the object</strong>: that is translation equivariance, not invariance. After 2×2 max-pool the maps are ${fmt(pooledA[1][1])} and ${fmt(pooledB[1][1])} at a centre cell — pooling makes the code <em>more</em> invariant, not perfectly so.</p>`;
    }
  };
  bindRange('k-shift','k-shift-value', v=>v+' px');
  $('k-shift').addEventListener('input', ()=>lab.draw());
  new ResizeObserver(()=>lab.draw()).observe(canvas);
  labs['cv-shift'] = lab; lab.draw();
}

function archLab(){
  const canvas = $('cv-arch');
  const lab = {
    canvas, phase:0, playing:false, speed:1, visible:true,
    draw(){
      const n = Number($('k-vgg-n').value);
      const s = M.stackVsLarge(3, n);
      const {w,h,ctx} = sizeCanvas(canvas);
      ctx.fillStyle = colors.ink; ctx.font = '16px Georgia, serif';
      ctx.fillText(`${n} × (3×3)  ≡  one ${s.kLarge}×${s.kLarge} field`, 20, 36);
      const maxP = Math.max(s.paramsSmall, s.paramsLarge, 1);
      const bar = (label, val, y, color)=>{
        ctx.fillStyle = '#dce5d4'; ctx.fillRect(20,y, w-40, 26);
        ctx.fillStyle = color; ctx.fillRect(20,y, (w-40)*val/maxP, 26);
        ctx.fillStyle = colors.ink; ctx.font = '13px ui-monospace, monospace';
        ctx.fillText(`${label}: ${val} weights per in/out channel pair`, 28, y+18);
      };
      bar('stacked 3×3', s.paramsSmall, 70, colors.teal);
      bar('one large kernel', s.paramsLarge, 110, colors.orange);
      ctx.font = '13px sans-serif'; ctx.fillStyle = '#5f7069';
      ctx.fillText('Three nonlinearities vs one. Same receptive field, fewer parameters, more depth.', 20, 170);
      $('read-arch').innerHTML = `<b>${n} layers of 3×3</b><p>Receptive field ${s.rf}. Weights ${s.paramsSmall} vs ${s.paramsLarge} for a single ${s.kLarge}×${s.kLarge}. VGG chose the cheaper, deeper option throughout.</p>`;
    }
  };
  bindRange('k-vgg-n','k-vgg-n-value', v=>v+' × 3×3');
  $('k-vgg-n').addEventListener('input', ()=>lab.draw());
  new ResizeObserver(()=>lab.draw()).observe(canvas);
  labs['cv-arch'] = lab; lab.draw();
}

function wirePlayback(){
  document.querySelectorAll('[data-replay]').forEach(b=>b.addEventListener('click',()=>{
    const lab = labs[b.dataset.replay]; if(!lab) return; lab.phase=0; lab.playing=true; lab.draw();
    const pause = document.querySelector(`[data-motion="${b.dataset.replay}"]`);
    if(pause){ pause.textContent='Pause'; pause.setAttribute('aria-pressed','true'); }
  }));
  document.querySelectorAll('[data-motion]').forEach(b=>{
    const lab = labs[b.dataset.motion]; if(!lab) return;
    b.textContent = lab.playing ? 'Pause' : 'Play';
    b.addEventListener('click',()=>{
      lab.playing = !lab.playing;
      b.textContent = lab.playing ? 'Pause' : 'Play';
      b.setAttribute('aria-pressed', String(lab.playing));
    });
  });
}

let last=0;
function animate(t){
  const dt = Math.min(0.05, (t-last)/1000); last = t;
  Object.values(labs).forEach(lab=>{
    if(lab.playing && lab.visible && !document.hidden){
      lab.phase += dt*(lab.speed||1)/4;
      if(lab.phase>=1) lab.phase=0;
      lab.draw();
    }
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
kernelLab(); strideLab(); padLab(); mapsLab(); poolLab(); rfLab(); shiftLab(); archLab();
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
