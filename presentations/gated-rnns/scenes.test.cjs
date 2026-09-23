const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('./scenes.js');
test('backward pass particle follows its arrow right to left',()=>{
 const x=p=>{const svg=S.render('bidirectional',2,p,{ending:'river',mode:'complete'});return [...svg.matchAll(/<circle cx="([\d.]+)" cy="248"/g)].map(m=>+m[1]);};
 const a=x(.25),b=x(.75);assert.equal(a.length,4);assert.equal(b.length,4);a.forEach((v,i)=>assert.ok(b[i]<v,'particle must travel toward lower x'));
});
