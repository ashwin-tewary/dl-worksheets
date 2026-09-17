const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
function load(savedMode){
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
  w.matchMedia=()=>({matches:true});w.requestAnimationFrame=()=>0;w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};
  const gradient={addColorStop(){}};const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({width:600,height:340});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  if(savedMode) w.localStorage.setItem('cnn-visual-mode-v1',savedMode);
  w.eval(fs.readFileSync('model.js','utf8'));
  w.eval(fs.readFileSync('app.js','utf8')+';window.__labs=labs;');
  return dom;
}
test('sections, typed blanks, check and show-answer exist',()=>{
  const d=load().window.document;
  assert.equal(d.querySelectorAll('section.lab').length,11);
  assert.ok(d.querySelectorAll('.qin').length>=30);
  assert.ok(d.querySelectorAll('.chkbtn').length>=10);
  assert.ok(d.querySelectorAll('details.ans').length>=10);
});
test('checking paints correct and incorrect boxes and updates progress',()=>{
  const dom=load(),w=dom.window,d=w.document;
  const first=d.querySelector('#q-k1');
  first.value='1';
  d.querySelector('#kernels .chkbtn').click();
  assert.ok(first.classList.contains('ok'));
  d.getElementById('q-k2').value='0';
  d.querySelector('#kernels .chkbtn').click();
  assert.ok(d.getElementById('q-k2').classList.contains('no'));
  assert.ok(Number(d.getElementById('progress').value)>=1);
  d.getElementById('reset-progress').click();
  assert.equal(d.getElementById('reset-dialog').open,true);
  d.getElementById('confirm-reset').click();
  assert.equal(d.getElementById('q-k1').value,'');
  assert.equal(d.getElementById('progress').value,0);
  dom.window.close();
});
test('stride control updates the live formula readout',()=>{
  const dom=load(),w=dom.window,d=w.document;
  const el=d.getElementById('k-stride');
  el.value='2'; el.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.match(d.getElementById('read-stride').textContent,/3/);
  assert.doesNotMatch(d.body.textContent,/DS 3000|Foundations of Deep Learning/);
  const home=new JSDOM(fs.readFileSync('../../index.html','utf8')).window.document;
  assert.ok(home.querySelector('#presentations a[href="presentations/cnn/"]'));
  const kernel=d.getElementById('cv-kernel');
  assert.match(kernel.style.height, /^\d+px$/);
  assert.ok(Number.parseInt(kernel.style.height,10)<900);
  assert.equal(d.querySelectorAll('#cv-pool').length,1);
  dom.window.close();
});
test('image mode recomputes the digit convolution and restores number examples without losing answers',()=>{
  const dom=load(),w=dom.window,d=w.document;
  const toggle=d.getElementById('visual-mode');
  assert.ok(toggle,'A worksheet-wide image toggle is available');
  d.getElementById('q-k1').value='1';
  d.querySelector('#kernels .chkbtn').click();
  toggle.click();
  assert.equal(toggle.getAttribute('aria-pressed'),'true');
  assert.equal(w.localStorage.getItem('cnn-visual-mode-v1'),'images');
  assert.equal(w.__labs['cv-kernel'].out.length,6);
  assert.equal(w.__labs['cv-kernel'].out[0][0],14);
  for(const lab of Object.values(w.__labs)) assert.equal(lab.canvas.dataset.visualMode,'images');
  assert.equal(d.getElementById('q-k1').value,'1');
  assert.ok(d.getElementById('q-k1').classList.contains('ok'));
  const stride=d.getElementById('k-stride');
  stride.value='2';stride.dispatchEvent(new w.Event('input'));
  assert.equal(w.__labs['cv-stride'].out.length,3);
  toggle.click();
  assert.equal(w.__labs['cv-kernel'].out.length,5);
  assert.equal(w.__labs['cv-kernel'].out[0][0],0);
  assert.equal(stride.value,'2');
  assert.equal(toggle.getAttribute('aria-pressed'),'false');
  dom.window.close();
});
test('a saved image preference applies to every lab on load and pixel values remain inspectable',()=>{
  const dom=load('images'),d=dom.window.document;
  assert.equal(d.body.dataset.visualMode,'images');
  for(const lab of Object.values(dom.window.__labs)){
    assert.equal(lab.canvas.dataset.visualMode,'images');
    const values=d.getElementById(lab.canvas.id+'-values');
    assert.ok(values && values.querySelector('table td'),'Every lab exposes readable matrix values');
  }
  assert.match(d.getElementById('cv-kernel-values').textContent,/14/);
  dom.window.close();
});
test('architecture controls compare dense, local and shared weights at the same output size',()=>{
  const dom=load(),w=dom.window,d=w.document;
  const control=d.getElementById('k-why-size');
  assert.ok(control,'Image size is adjustable');
  control.value='32';control.dispatchEvent(new w.Event('input'));
  assert.match(d.getElementById('read-why').textContent,/921,600/);
  assert.match(d.getElementById('read-why').textContent,/8,100/);
  assert.match(d.getElementById('read-why').textContent,/9 weights/);
  dom.window.close();
});
test('manual stepping advances exactly one patch and pauses animation',()=>{
  const dom=load(),d=dom.window.document,lab=dom.window.__labs['cv-kernel'];
  const step=d.querySelector('[data-next="cv-kernel"]');
  assert.ok(step,'The moving window can be advanced manually');
  step.click();
  assert.equal(lab.index,1);
  assert.equal(lab.playing,false);
  dom.window.close();
});
test('matrix inspector highlights follow manual stepping without replacing an open table',()=>{
  const dom=load(),d=dom.window.document;
  const inspector=d.getElementById('cv-kernel-values');
  inspector.open=true;
  const tables=inspector.querySelectorAll('table');
  const inputCells=tables[0].querySelectorAll('td');
  const outputCells=tables[2].querySelectorAll('td');
  assert.ok(inputCells[0].classList.contains('in-window'));
  d.querySelector('[data-next="cv-kernel"]').click();
  assert.equal(inspector.querySelector('table'),tables[0]);
  assert.ok(!inputCells[0].classList.contains('in-window'));
  assert.ok(inputCells[3].classList.contains('in-window'));
  assert.ok(!outputCells[0].classList.contains('in-window'));
  assert.ok(outputCells[1].classList.contains('in-window'));
  dom.window.close();
});
test('numeric labels maintain at least 4.5:1 contrast over grayscale digit pixels',()=>{
  const dom=load('images'),d=dom.window.document;
  const luminance=rgb=>{
    const values=rgb.match(/\d+/g).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return values[0]*.2126+values[1]*.7152+values[2]*.0722;
  };
  for(const cell of d.querySelectorAll('#problem-why td')){
    const bg=luminance(cell.style.background),fg=luminance(cell.style.color);
    const contrast=(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05);
    assert.ok(contrast>=4.5,`Pixel ${cell.textContent} has contrast ${contrast.toFixed(2)}`);
  }
  dom.window.close();
});
