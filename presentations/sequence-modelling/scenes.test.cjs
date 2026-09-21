const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('./scenes.js'),stories=require('./storyboards.js');
test('all animation beats render finite SVGs under default and extreme controls',()=>{
 for(const [key,story] of Object.entries(stories)){
  for(let beat=0;beat<story.steps.length;beat++)for(const options of [{},{length:8,hidden:8,gap:40,weight:1.5,activation:'tanh',reverse:true,task:'next'},{length:2,hidden:2,gap:1,weight:.4,activation:'linear',task:'tagging'}]){
   const svg=S.render(key,beat,.5,options);
   assert.ok(svg.startsWith('<svg'));assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
  }
 }
});
test('unrolling updates the visible count when width changes but not when length changes',()=>{
 assert.match(S.render('unroll',4,1,{length:8,hidden:2}),/18 parameters/);
 assert.match(S.render('unroll',4,1,{length:2,hidden:4}),/42 parameters/);
});
test('every prediction checkpoint has a subsequent reveal',()=>{
 for(const story of Object.values(stories)){
  const points=story.steps.map((step,i)=>step.checkpoint?i:-1).filter(i=>i>=0);
  assert.ok(points.length>0);assert.ok(points.every(i=>i<story.steps.length-1));
 }
});
test('next-token prediction keeps the target outside the read prefix',()=>{
 const svg=S.render('tasks',3,1,{task:'next'});
 assert.equal((svg.match(/read so far/g)||[]).length,2);
 assert.equal((svg.match(/>future input</g)||[]).length,1);
 assert.doesNotMatch(svg,/NEXT-TOKEN targets: x₂, x₃, EOS/);
});
