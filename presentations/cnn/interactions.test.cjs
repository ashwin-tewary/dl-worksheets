const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
function load(){
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
  w.matchMedia=()=>({matches:true});w.requestAnimationFrame=()=>0;w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};
  const gradient={addColorStop(){}};const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({width:600,height:340});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.eval(fs.readFileSync('model.js','utf8'));
  w.eval(fs.readFileSync('app.js','utf8')+';window.__labs=labs;');
  return dom;
}
test('sections, typed blanks, check and show-answer exist',()=>{
  const d=load().window.document;
  assert.equal(d.querySelectorAll('section.lab').length,10);
  assert.ok(d.querySelectorAll('.qin').length>=30);
  assert.ok(d.querySelectorAll('.chkbtn').length>=10);
  assert.ok(d.querySelectorAll('details.ans').length>=10);
  d.querySelectorAll('.lab .minute .equation').forEach(eq=>{
    assert.ok(eq.nextElementSibling && eq.nextElementSibling.classList.contains('formula-explanation'));
    assert.ok(eq.nextElementSibling.textContent.length>250);
  });
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
  dom.window.close();
});
test('each visual section has theory immediately before the experiment',()=>{
  const d=load().window.document;
  for(const id of ['kernels','stride','padding','maps','pooling','field','invariance','vgg']){
    const section=d.getElementById(id);
    const theory=section.querySelector('.theory-section');
    const experiment=section.querySelector('.experiment');
    assert.equal(theory.nextElementSibling,experiment);
    assert.equal(theory.querySelectorAll('.theory-reasoning li').length,3);
    assert.ok(theory.querySelector('.prediction'));
  }
});
