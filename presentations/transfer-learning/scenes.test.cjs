const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('./scenes'),stories=require('./storyboards');
test('every planned beat renders finite geometry at start, middle and end',()=>{
 for(const [name,s] of Object.entries(stories))for(let i=0;i<s.steps.length;i++)for(const p of [0,.5,1]){const svg=S.render(name,i,p);assert.ok(svg.startsWith('<svg'));assert.ok(!/NaN|undefined|Infinity/.test(svg));}
});
test('motion changes scene geometry rather than only the narrative',()=>{for(const [name,i] of [['pretrained',3],['features',2],['freezing',1],['augmentation',2],['context',2]]){const start=S.render(name,i,0).replace(/data-progress="[^"]+"/,''),end=S.render(name,i,1).replace(/data-progress="[^"]+"/,'');assert.notEqual(start,end);}});
test('frame results agree with the teaching calculations',()=>{
 assert.match(S.render('pretrained',4),/1,539/);assert.match(S.render('features',5),/8 ÷ 4 = 2/);assert.match(S.render('features',7),/50%/);
 assert.match(S.render('freezing',4),/1.940/);assert.match(S.render('freezing',7),/2.002/);assert.match(S.render('freezing',7),/1.880/);
 assert.match(S.render('augmentation',5),/INVALID/);assert.match(S.render('augmentation',6),/label: RIGHT/);
 assert.match(S.render('context',3),/7 × 7/);assert.match(S.render('context',8),/38,416/);
 assert.ok(Math.abs(S.attentionWeights.reduce((a,b)=>a+b,0)-1)<1e-12);assert.ok(Math.abs(S.attentionSum()-5.15)<1e-12);
});
