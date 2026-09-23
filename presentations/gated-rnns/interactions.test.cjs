const {test}=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');
function setup(t,{saved,reduced=true,blocked=false}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://example.test/gated/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;t.after(()=>w.close());w.matchMedia=()=>({matches:reduced,addEventListener(){}});
 if(saved)w.localStorage.setItem('dl-gated-rnns-v1',saved);
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});
 for(const name of ['model.js','../sequence-modelling/timeline.js','storyboards.js','scenes.js','app.js'])w.eval(fs.readFileSync(path.join(__dirname,name),'utf8'));
 const $=s=>w.document.querySelector(s);
 function input(s,value){const n=$(s);if(n.type==='radio')n.checked=true;else n.value=value;n.dispatchEvent(new w.Event(n.tagName==='SELECT'?'change':'input',{bubbles:true}));}
 const submit=s=>$(s).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 return {w,$,input,submit};
}
test('all 15 independently calculated answers grade and edits invalidate stale progress',t=>{
 const c=setup(t);['.4','no','state','.8','0','keep','1/8','no','clip','.8','candidate','36','8','offline','reverse'].forEach((a,i)=>{
 const id='#q'+(i+1);c.input(c.$(id).dataset.kind==='choice'?id+` input[value="${a}"]`:id+' input',a);c.submit(id);
 });assert.equal(c.$('#progress').value,15);
 c.input('#q4 input','wrong');assert.equal(c.$('#progress').value,14);c.submit('#q4');assert.match(c.$('#q4 .feedback').textContent,/Try again/);
});
test('closing LSTM output preserves cell and hides only hidden state',t=>{
 const c=setup(t);c.$('[data-preset=hide]').click();
 const stats=[...c.w.document.querySelectorAll('[data-animation=lstm] .stat strong')].map(e=>e.textContent);
 assert.deepEqual(stats,['0.6','0.2','0.8','0']);
 c.$('[data-preset=retain]').click();assert.equal(c.$('[data-animation=lstm] [data-option=forget]').value,'1');assert.equal(c.$('[data-animation=lstm] [data-option=input]').value,'0');
});
test('GRU reset does not erase the carry route; update endpoints work',t=>{
 const c=setup(t);c.$('[data-preset=gru-keep]').click();
 assert.equal(c.$('[data-animation=gru] .stat:last-child strong').textContent,'0.8');
 c.$('[data-preset=gru-replace]').click();assert.equal(c.$('[data-animation=gru] .stat:last-child strong').textContent,'0.197');
});
test('live prefix hides every suffix value and backward state, independent of ending',t=>{
 const c=setup(t);c.$('[data-animation=bidirectional] [data-beat="5"]').click();
 const before=c.$('[data-animation=bidirectional] svg').textContent;
 c.input('[data-animation=bidirectional] [data-option=ending]','loan');assert.notEqual(c.$('[data-animation=bidirectional] svg').textContent,before);
 c.input('[data-animation=bidirectional] [data-option=mode]','live');
 const live=c.$('[data-animation=bidirectional] svg').textContent;assert.doesNotMatch(live,/loan|river|approved/);
 c.input('[data-animation=bidirectional] [data-option=ending]','river');assert.equal(c.$('[data-animation=bidirectional] svg').textContent,live);
 assert.equal(c.$('[data-animation=bidirectional] table'),null);
});
test('prediction pause conceals calculated results, continue reveals and replay resets',t=>{
 const c=setup(t);c.$('[data-animation=lstm] [data-beat="3"]').click();
 assert.equal(c.$('[data-animation=lstm]').dataset.checkpoint,'true');assert.match(c.$('[data-animation=lstm] .readout').textContent,/Predict/);
 c.$('[data-animation=lstm] .anim-play').click();assert.equal(c.$('[data-animation=lstm]').dataset.currentBeat,'4');
 assert.equal(c.$('[data-animation=lstm]').dataset.playing,'false');c.$('[data-animation=lstm] .anim-replay').click();assert.equal(c.$('[data-animation=lstm]').dataset.currentBeat,'0');
});
test('answers restore as literal text; malformed or blocked storage does not break teaching',t=>{
 const a=setup(t);a.input('#q4 input','.8');a.submit('#q4');a.input('#exit-design','Use <img src=x> literally.');
 const b=setup(t,{saved:a.w.localStorage.getItem('dl-gated-rnns-v1')});assert.equal(b.$('#progress').value,1);assert.equal(b.$('#exit-design').value,'Use <img src=x> literally.');
 const c=setup(t,{saved:'{"answers":"bad","notes":true}'});c.input('#q4 input','.8');c.submit('#q4');assert.equal(c.$('#progress').value,1);
 const d=setup(t,{blocked:true});d.input('#q4 input','.8');d.submit('#q4');assert.match(d.$('#storage-status').textContent,/unavailable/);
});
