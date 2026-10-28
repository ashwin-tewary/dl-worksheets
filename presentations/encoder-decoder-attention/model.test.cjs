const {test}=require('node:test');const assert=require('node:assert/strict');
let M;try{M=require('./model.js')}catch{M={}}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('stable softmax normalizes large scores and ignores padding',()=>{assert.equal(typeof M.softmax,'function');const a=M.softmax([1000,1001,999],[true,true,false]);close(a[0],1/(1+Math.E));close(a[1],Math.E/(1+Math.E));assert.equal(a[2],0);});
test('all masked positions and bad temperature are rejected',()=>{assert.equal(typeof M.softmax,'function');assert.throws(()=>M.softmax([1],[false]));assert.throws(()=>M.softmax([1],null,0));});
test('dot scores give exact reference context',()=>{assert.equal(typeof M.attend,'function');const r=M.attend([1,0],[[1,0],[0,1],[1,1]],'dot');assert.deepEqual(r.scores,[1,0,1]);close(r.context[0],2*Math.E/(2*Math.E+1));close(r.context[1],(1+Math.E)/(2*Math.E+1));});
test('general score projects unequal encoder and decoder widths',()=>{assert.equal(typeof M.general,'function');close(M.general([1,2], [3,4,5], [[1,0,0],[0,1,1]]),21);assert.throws(()=>M.dot([1],[1,2]));});
test('additive score projects, applies tanh and then learned v',()=>{assert.equal(typeof M.additive,'function');close(M.additive([1,0],[0,1],[[1,0],[0,1]],[[1,0],[0,1]],[1,-1],[0,0]),0);close(M.additive([1],[2,3],[[2]],[[1,0]],[3],[0]),3*Math.tanh(4));});
test('weighted context mixes all state coordinates without argmax',()=>{assert.equal(typeof M.context,'function');assert.deepEqual(M.context([.25,.75],[[2,0],[0,4]]),[.5,3]);});
test('recurrence reuses one rule; final state width is independent of length',()=>{assert.equal(typeof M.encode,'function');const r=M.encode([1,0,0],.5);close(r[0],Math.tanh(1));close(r[2],Math.tanh(.5*Math.tanh(.5*Math.tanh(1))));});
test('teacher forcing is shifted while inference feeds predictions',()=>{assert.equal(typeof M.decoderInputs,'function');assert.deepEqual(M.decoderInputs(['je','t’aime','EOS'],true,['tu','aimes','EOS']),['BOS','je','t’aime']);assert.deepEqual(M.decoderInputs(['je','t’aime','EOS'],false,['tu','aimes','EOS']),['BOS','tu','aimes']);});
