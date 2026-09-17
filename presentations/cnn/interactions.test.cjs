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
  w.eval(fs.readFileSync('app.js','utf8')+';window.__labs=labs;window.__advance=typeof advanceLab==="function"?advanceLab:null;');
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
  assert.equal(w.__labs['cv-kernel'].out[0][0],20);
  assert.equal(new Set(w.__labs['cv-kernel'].scene.layout.map(panel=>panel.y)).size,1,'Related animated matrices stay on the same row, with horizontal scrolling when needed');
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
  assert.equal(d.querySelectorAll('#cv-kernel-values table')[2].querySelector('td').textContent,'20');
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
test('scan animation interpolates between patches and progressively reveals output',()=>{
  const dom=load(),w=dom.window,lab=w.__labs['cv-kernel'];
  assert.ok(w.__advance,'Animation has a frame update independent of calculation');
  lab.playing=true;
  w.__advance(lab,1.8);
  assert.equal(lab.index,0);
  assert.ok(lab.motion.window.x>0 && lab.motion.window.x<1,'Window slides between adjacent patch origins');
  assert.equal(lab.motion.visibleCount,1);
  w.__advance(lab,.3);
  assert.equal(lab.index,1);
  assert.equal(lab.motion.visibleCount,1,'The next result waits until its calculation stage');
  lab.playing=false;
  const phase=lab.phase;
  w.__advance(lab,1);
  assert.equal(lab.phase,phase);
  dom.window.close();
});
test('timeline seeking pauses at the requested patch; playback finishes and replay restarts',()=>{
  const dom=load(),w=dom.window,d=w.document,lab=w.__labs['cv-kernel'];
  const scrub=d.querySelector('[data-scrub="cv-kernel"]');
  assert.ok(scrub,'A timeline allows direct access to any patch');
  scrub.value='4';scrub.dispatchEvent(new w.Event('input'));
  assert.equal(lab.index,4);
  assert.equal(lab.motion.visibleCount,5);
  assert.equal(lab.playing,false);
  lab.playing=true;w.__advance(lab,100);
  assert.equal(lab.index,24);
  assert.equal(lab.motion.visibleCount,25);
  assert.equal(lab.playing,false);
  d.querySelector('[data-replay="cv-kernel"]').click();
  assert.equal(lab.index,0);
  assert.equal(lab.phase,0);
  assert.equal(lab.playing,true);
  assert.equal(lab.motion.visibleCount,0);
  dom.window.close();
});
test('feature-map selection replaces the main output with the matching convolution',()=>{
  for(const mode of ['numbers','images']){
    const dom=load(mode),w=dom.window,d=w.document,lab=w.__labs['cv-maps'];
    for(const value of ['0','1','2']){
      const select=d.getElementById('k-map-focus');select.value=value;select.dispatchEvent(new w.Event('input'));
      assert.equal(lab.panels?.length,3,'The main scene is input, selected kernel, selected output');
      const expected=w.CNNModel.conv2d(lab.panels[0].img,lab.panels[1].img);
      assert.deepEqual(lab.panels[2].img,expected);
      assert.equal(d.querySelector('[data-map-choice][aria-pressed="true"]').dataset.mapChoice,value);
    }
    dom.window.close();
  }
});
test('every lab keeps its parameter controls inside the visual pane before the canvas',()=>{
  const dom=load(),d=dom.window.document;
  for(const shell of d.querySelectorAll('.lab-shell')){
    const pane=shell.querySelector('.visual-pane'),controls=shell.querySelector('.controls'),canvas=shell.querySelector('canvas');
    assert.ok(pane.contains(controls),shell.closest('section').id+' controls belong to the visual');
    assert.ok(controls.compareDocumentPosition(canvas)&4,'Controls precede their canvas');
  }
  dom.window.close();
});
test('all lab controls recompute valid results at their limits in both visual modes',()=>{
  for(const mode of ['numbers','images']){
    const dom=load(mode),w=dom.window,d=w.document,M=w.CNNModel,labs=w.__labs;
    const set=(id,value)=>{const el=d.getElementById(id);el.value=String(value);el.dispatchEvent(new w.Event('input'));};
    for(const kernel of ['identity','blur','sharpen']){
      set('k-kernel',kernel);const lab=labs['cv-kernel'];
      assert.deepEqual(lab.out,M.conv2d(lab.state.img,M.KERNELS[kernel]));
    }
    for(const stride of [1,2,3]){set('k-stride',stride);const lab=labs['cv-stride'];assert.equal(lab.out.length,M.outputSize(lab.state.img.length,3,stride,0));}
    for(const pad of [0,2]){set('k-pad',pad);const lab=labs['cv-pad'];assert.equal(lab.out.length,lab.state.img.length+2*pad-2);}
    for(const kind of ['max','avg']){set('k-pool',kind);const lab=labs['cv-pool'];assert.deepEqual(lab.out,M.pool2d(lab.panels[0].img,2,2,kind));}
    set('k-rf-n',6);set('k-rf-k',11);set('k-rf-s',2);
    assert.match(d.getElementById('field-growth').textContent,/631 × 631/);
    assert.equal(d.querySelectorAll('#field-growth>div').length,6);
    set('k-shift',3);
    for(const stage of [0,1,2]){set('k-shift-stage',stage);assert.equal(labs['cv-shift'].panels.length,2);assert.notDeepEqual(labs['cv-shift'].panels[0].img,labs['cv-shift'].panels[1].img);}
    for(const stage of [0,1,2,3]){set('k-alex-stage',stage);assert.equal(labs['cv-alex'].panels.length,stage===0?1:2);assert.equal(d.querySelector('[data-alex-stage][aria-pressed="true"]').dataset.alexStage,String(stage));}
    for(const depth of [1,5]){
      set('k-vgg-n',depth);
      for(const p of labs['cv-arch'].panels){assert.equal(p.opts.win.k,2*depth+1);assert.ok(p.opts.win.x>=0&&p.opts.win.x+p.opts.win.k<=p.img[0].length,'Entire field stays visible at each depth');}
    }
    set('k-why-size',64);assert.match(d.getElementById('read-why').textContent,/15,745,024/);
    d.querySelector('[data-map-choice="2"]').click();assert.equal(d.getElementById('k-map-focus').value,'2');
    d.querySelector('[data-alex-stage="2"]').click();assert.equal(d.getElementById('k-alex-stage').value,'2');
    dom.window.close();
  }
});
test('stride animation hops only between sampled origins and resets correctly at row ends',()=>{
  for(const mode of ['numbers','images'])for(const stride of [2,3]){
    const dom=load(mode),w=dom.window,d=w.document,lab=w.__labs['cv-stride'];
    const el=d.getElementById('k-stride');el.value=String(stride);el.dispatchEvent(new w.Event('input'));
    lab.playing=true;w.__advance(lab,1.8);
    assert.equal(lab.motion.window.x,0,'A stride hop must not sweep over unsampled origins');
    assert.equal(lab.motion.next.x,stride);
    assert.equal(lab.motion.hop,true);
    w.__advance(lab,.3);assert.equal(lab.motion.window.x,stride);
    const columns=lab.out[0].length,scrub=d.getElementById('cv-stride-scrub');
    scrub.value=String(columns-1);scrub.dispatchEvent(new w.Event('input'));
    lab.playing=true;w.__advance(lab,.4);
    assert.equal(lab.motion.window.x,(columns-1)*stride);
    assert.equal(lab.motion.next.x,0);assert.equal(lab.motion.next.y,stride);
    w.__advance(lab,.3);assert.equal(lab.motion.window.x,0);assert.equal(lab.motion.window.y,stride);
    dom.window.close();
  }
});
test('translation convolution changes the input into edge responses and preserves the spatial shift',()=>{
  for(const mode of ['numbers','images']){
    const dom=load(mode),w=dom.window,d=w.document,lab=w.__labs['cv-shift'];
    const set=(id,value)=>{const el=d.getElementById(id);el.value=String(value);el.dispatchEvent(new w.Event('input'));};
    set('k-shift-stage',0);const original=lab.panels[0].img;
    set('k-shift-stage',1);
    assert.notDeepEqual(lab.panels[0].img,original,'Convolution must visibly compute features, not copy input');
    assert.ok(lab.panels[0].img.flat().some(v=>v<0),'Signed edges stay visible');
    for(const dx of [0,1,2,3]){
      set('k-shift',dx);
      assert.deepEqual(lab.panels[1].img,w.CNNModel.shift2d(lab.panels[0].img,0,dx));
    }
    assert.match(d.getElementById('read-shift').textContent,/Convolution/);
    dom.window.close();
  }
});
