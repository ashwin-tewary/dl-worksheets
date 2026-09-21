const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function setup(t,{saved,reduced=false,blockedStorage=false}={}){
 const dom=new JSDOM(html,{url:'https://example.test/sequence/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;t.after(()=>w.close());
 w.matchMedia=()=>({matches:reduced,addEventListener(){}});
 if(saved)w.localStorage.setItem('dl-sequence-modelling-v1',saved);
 if(blockedStorage)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage disabled');}});
 for(const file of ['model.js','timeline.js','storyboards.js','scenes.js','app.js'])w.eval(fs.readFileSync(path.join(__dirname,file),'utf8'));
 const $=s=>w.document.querySelector(s);
 const input=(selector,value)=>{const node=$(selector);if(node.type==='radio')node.checked=true;else node.value=value;node.dispatchEvent(new w.Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 const submit=id=>$(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 return {w,$,input,submit};
}
test('a fraction grades correctly, and an edited answer invalidates stale progress',t=>{
 const c=setup(t);c.input('#q1 input','1/3');c.submit('#q1');assert.equal(c.$('#progress').value,1);
 c.input('#q1 input','1/0');assert.equal(c.$('#progress').value,0);c.submit('#q1');assert.equal(c.$('#progress').value,0);
 assert.match(c.$('#q1 .feedback').textContent,/Try again/);
});
test('all fifteen independently solved answers are accepted, including zero-tolerance counts',t=>{
 const c=setup(t),answers=['1/3','mean','yes','3','good','no','.5','state','.762','18','18','sum','.0115','no','saturation'];
 answers.forEach((value,i)=>{const id='#q'+(i+1),form=c.$(id);c.input(form.dataset.kind==='choice'?id+' input[value="'+value+'"]':id+' input',value);c.submit(id);});
 assert.equal(c.$('#progress').value,15);
 c.input('#q10 input','18 words');c.submit('#q10');assert.equal(c.$('#progress').value,14);
});
test('answers, checked progress and literal exit notes survive a reload',t=>{
 const a=setup(t);a.input('#q10 input','18');a.submit('#q10');a.input('#exit-design','Keep <warning> before fault.');
 const saved=a.w.localStorage.getItem('dl-sequence-modelling-v1'),b=setup(t,{saved});
 assert.equal(b.$('#q10 input').value,'18');assert.equal(b.$('#progress').value,1);
 assert.equal(b.$('#exit-design').value,'Keep <warning> before fault.');
 assert.equal(b.$('#exit-design warning'),null);
});
test('hidden-width and sequence-length controls change distinct model quantities',t=>{
 const c=setup(t);c.input('[data-animation=unroll] [data-option=length]','8');
 let stats=[...c.w.document.querySelectorAll('[data-animation=unroll] .stat strong')].map(n=>n.textContent);
 assert.deepEqual(stats,['18','8','2']);c.input('[data-animation=unroll] [data-option=hidden]','4');
 stats=[...c.w.document.querySelectorAll('[data-animation=unroll] .stat strong')].map(n=>n.textContent);
 assert.deepEqual(stats,['42','8','4']);
});
test('task mode changes the supplied target positions after reveal',t=>{
 const c=setup(t);c.$('[data-animation=tasks] [data-beat="5"]').click();
 c.input('[data-animation=tasks] [data-option=task]','next');
 assert.match(c.$('[data-animation=tasks] svg').textContent,/NEXT-TOKEN targets/);
 assert.match(c.$('[data-animation=tasks] svg').textContent,/EOS/);
 c.input('[data-animation=tasks] [data-option=task]','classification');
 assert.match(c.$('[data-animation=tasks] svg').textContent,/negative/);
 assert.doesNotMatch(c.$('[data-animation=tasks] svg').textContent,/EOS/);
});
test('growth and saturation presets synchronize forward/backward controls and separate their quantities',t=>{
 const c=setup(t);c.$('[data-preset=growth]').click();
 assert.equal(c.$('[data-animation=memory] [data-option=weight]').value,'1.2');
 let values=[...c.w.document.querySelectorAll('[data-animation=gradient] .stat strong')].map(n=>+n.textContent);
 assert.deepEqual(values,[38.338,38.338]);
 c.$('[data-preset=saturation]').click();
 assert.equal(c.$('[data-animation=memory] [data-option=activation]').value,'tanh');
 values=[...c.w.document.querySelectorAll('[data-animation=gradient] .stat strong')].map(n=>+n.textContent);
 assert.ok(values[0]>.5);assert.ok(values[1]<.01);
 assert.match(c.$('[data-animation=gradient] .readout').textContent,/plotted sensitivity is never clipped/);
});
test('prediction seek, replay and reduced motion expose stable and honest player states',t=>{
 const c=setup(t,{reduced:true}),host=c.$('[data-animation=state]');
 c.$('[data-animation=state] [data-beat="3"]').click();assert.equal(host.dataset.checkpoint,'true');assert.equal(host.dataset.playing,'false');
 c.$('[data-animation=state] .anim-play').click();assert.equal(host.dataset.currentBeat,'4');assert.equal(host.dataset.playing,'false');
 c.$('[data-animation=state] .anim-replay').click();assert.equal(host.dataset.currentBeat,'0');
 assert.match(c.$('[data-animation=state] .readout').textContent,/predict/);
});
test('forward and backward sweeps do not show final readouts until the reveal completes',t=>{
 const c=setup(t);
 for(const key of ['memory','gradient']){
  c.$('[data-animation='+key+'] [data-beat="3"]').click();
  c.$('[data-animation='+key+'] .anim-next').click();
  assert.match(c.$('[data-animation='+key+'] .readout').textContent,/Predict/);
  c.$('[data-animation='+key+'] [data-beat="4"]').click();
  assert.doesNotMatch(c.$('[data-animation='+key+'] .readout').textContent,/Predict/);
 }
});
test('a page print reveals complete figures, then restores teaching positions',t=>{
 const c=setup(t);c.$('[data-animation=order] [data-beat="2"]').click();
 c.w.dispatchEvent(new c.w.Event('beforeprint'));assert.equal(c.$('[data-animation=order]').dataset.currentBeat,'5');
 c.w.dispatchEvent(new c.w.Event('afterprint'));assert.equal(c.$('[data-animation=order]').dataset.currentBeat,'2');
});
test('practice works with browser storage disabled',t=>{
 const c=setup(t,{blockedStorage:true});c.input('#q10 input','18');c.submit('#q10');
 assert.equal(c.$('#progress').value,1);assert.match(c.$('#storage-status').textContent,/unavailable/);
});
