const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');
test('pooling and classifier agree with hand calculation', () => {
 assert.deepEqual(M.pool([[[1,3],[2,2]],[[0,2],[4,2]]]), [2,2]);
 const r = M.classify([2,2]);
 assert.deepEqual(r.logits,[2,2]); assert.deepEqual(r.probabilities,[0.5,0.5]);
 assert.ok(Math.abs(M.classify([3,1]).probabilities[0] - 0.9525741268)<1e-9);
});
test('softmax remains finite for large logits',()=>{assert.deepEqual(M.softmax([10000,10000]),[0.5,0.5]);});
test('frozen layers execute but receive no SGD update',()=>{
 assert.equal(M.update(2,0.4,0.1,false),2);
 assert.equal(M.update(2,0.4,0.1,true),1.96);
 assert.equal(M.trainableCount([false,false,true]),1539);
 assert.equal(M.trainableCount([true,true,true]),11178051);
});
test('transform geometry and clipping are exact and do not mutate input',()=>{
 const x=[[0,1],[2,3]];
 assert.deepEqual(M.transform(x,'flip',0),[[1,0],[3,2]]);
 assert.deepEqual(M.transform(x,'rotate',0),[[2,0],[3,1]]);
 assert.deepEqual(M.transform(x,'shift',0),[[0,0],[0,2]]);
 assert.deepEqual(M.transform(x,'none',8),[[8,9],[9,9]]);
 assert.deepEqual(x,[[0,1],[2,3]]);
});
test('receptive field and patch counts use the stated architecture',()=>{
 assert.equal(M.receptiveField(1),3); assert.equal(M.receptiveField(3),7);
 assert.deepEqual(M.patchStats(224,16),{tokens:196,pairs:38416});
 assert.deepEqual(M.patchStats(224,32),{tokens:49,pairs:2401});
});
