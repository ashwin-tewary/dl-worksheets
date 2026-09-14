const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
function load(saved){
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 w.matchMedia=()=>({matches:true});w.requestAnimationFrame=()=>0;w.ResizeObserver=class{observe(){}};w.IntersectionObserver=class{observe(){}};
 const gradient={addColorStop(){}};const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 w.HTMLCanvasElement.prototype.getContext=()=>ctx;w.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({width:600,height:300});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 if(saved)w.localStorage.setItem('initialization-lab-v1',saved);
 w.eval(fs.readFileSync('model.js','utf8'));w.eval(fs.readFileSync('app.js','utf8')+';window.__testScenes=scenes;window.__testAnimate=animate;');return dom;
}
const input=(w,id,value)=>{const e=w.document.getElementById(id);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));};
test('all questions render; wrong/correct feedback and reset work',()=>{
 const dom=load(),w=dom.window,d=w.document;assert.equal(d.querySelectorAll('.question').length,11);
 const first=d.querySelector('.question');first.querySelector('.answer').click();assert.match(first.textContent,/Try again/);assert.equal(d.getElementById('progress').value,0);
 const keys=[1,1,1,2,1,1,1,2,1,2,0];d.querySelectorAll('.question').forEach((q,i)=>q.querySelectorAll('.answer')[keys[i]].click());
 assert.equal(d.getElementById('progress').value,11);assert.equal(d.getElementById('progress-percent').textContent,'100%');assert.equal(d.querySelectorAll('.lab.complete').length,5);assert.equal(d.getElementById('finish').hidden,false);
 const saved=w.localStorage.getItem('initialization-lab-v1'),reloaded=load(saved);assert.equal(reloaded.window.document.getElementById('progress').value,11);reloaded.window.close();
 d.getElementById('reset-progress').click();assert.equal(d.getElementById('reset-dialog').open,true);d.getElementById('cancel-reset').click();assert.equal(d.getElementById('progress').value,11);
 d.getElementById('reset-progress').click();d.getElementById('confirm-reset').click();assert.equal(d.getElementById('progress').value,0);assert.equal(d.querySelectorAll('.correct').length,0);dom.window.close();
});
test('simulation controls update model output and do not produce nonfinite chart paths',()=>{
 const dom=load(),w=dom.window,d=w.document;input(w,'sym-break',true);assert.match(d.getElementById('sym-status').textContent,/Symmetry can break/);
 d.getElementById('random-standard').click();assert.match(d.getElementById('random-status').textContent,/growing/);d.getElementById('random-balanced').click();assert.match(d.getElementById('random-status').textContent,/stays on scale/);
 input(w,'random-sigma',.3);input(w,'random-depth',50);input(w,'random-activation','tanh');assert.match(d.getElementById('random-status').textContent,/saturated/);
 input(w,'xavier-width',256);assert.match(d.getElementById('xavier-calculator').textContent,/0.0510/);input(w,'xavier-activation','tanh');assert.match(d.getElementById('xavier-status').textContent,/changes the picture/);
 input(w,'he-depth',50);input(w,'he-init','xavier');assert.match(d.getElementById('he-status').textContent,/decays/);input(w,'he-activation','leaky');assert.match(d.getElementById('he-metrics').textContent,/1.000/);
 for(const path of d.querySelectorAll('svg path'))assert.doesNotMatch(path.getAttribute('d'),/NaN|Infinity/);
 assert.ok(w.__testScenes.he.point(0,0,1)[1] < w.__testScenes.he.point(0,0,0)[1],'positive z projects upward');dom.window.close();
});
test('corrupt saved progress is ignored',()=>{for(const saved of ['not json','null','{"s-theory":100,"bad":"x"}']){const dom=load(saved);assert.equal(dom.window.document.getElementById('progress').value,0);dom.window.close();}});
test('guided playback scrubs, steps, replays and animates every scene',()=>{
 const dom=load(),w=dom.window,d=w.document;
 assert.doesNotMatch(d.body.textContent,/DS 3000|Foundations of Deep Learning|Fundamentals of Deep Learning/);
 for(const name of ['symmetry','random','xavier','he']){
  assert.equal(d.querySelectorAll(`#guide-${name} .guide-steps li`).length,3);
  input(w,`walk-${name}`,100);assert.equal(w.__testScenes[name].playing,false);assert.match(d.getElementById(`walk-label-${name}`).textContent,/Layer/);assert.equal(d.getElementById(`next-${name}`).disabled,true);
  d.getElementById(`back-${name}`).click();assert.equal(d.getElementById(`next-${name}`).disabled,false);
  d.getElementById(`next-${name}`).click();assert.equal(d.getElementById(`next-${name}`).disabled,true);
  d.querySelector(`[data-replay="${name}"]`).click();assert.equal(w.__testScenes[name].phase,0);assert.equal(w.__testScenes[name].playing,true);
  const speed=d.getElementById(`speed-${name}`);speed.value='2';speed.dispatchEvent(new w.Event('change'));assert.equal(w.__testScenes[name].speed,2);
 }
 // Simulate a visible document in the non-browser test environment.
 Object.defineProperty(d,'hidden',{value:false});w.__testAnimate(1000);
 for(const scene of Object.values(w.__testScenes))assert.ok(scene.phase>0);
 input(w,'walk-he',100);assert.match(d.getElementById('readout-he').textContent,/He · q at L10/);assert.match(d.getElementById('readout-he').textContent,/9.77e-4/);
 input(w,'he-depth',20);assert.equal(w.__testScenes.he.phase,0);assert.equal(d.getElementById('walk-label-he').textContent,'Input');dom.window.close();
});
test('each visualization is preceded by visible theory, an example and a prediction',()=>{
 const dom=load(),d=dom.window.document;
 assert.ok(d.querySelector('.theory-primer .notation-grid'));
 for(const key of ['symmetry','random','xavier','he']){
  const section=d.getElementById(key),theory=section.querySelector('.theory-section'),experiment=section.querySelector('.experiment');
  assert.equal(theory.nextElementSibling,experiment);
  assert.equal(theory.querySelectorAll('.theory-reasoning li').length,3);
  assert.ok(theory.querySelector('.theory-example p').textContent.length>100);
  assert.ok(theory.querySelector('.prediction summary'));
  assert.ok(theory.querySelector('.observation-task p'));
  assert.equal(theory.closest('details'),null);
 }
 dom.window.close();
});
