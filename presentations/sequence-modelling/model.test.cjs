const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('./model.js');
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);

test('a state carries previous inputs, instead of treating steps independently',()=>{
 assert.deepEqual(M.trace([1,0,1],.5,'linear').map(s=>s.h),[1,.5,1.25]);
 assert.deepEqual(M.trace([1,0,1],0,'linear').map(s=>s.h),[1,0,1]);
});
test('tanh is applied after input and recurrent contributions are added',()=>{
 const t=M.trace([1,0,1],.5,'tanh');
 near(t[0].h,.7615941559557649); near(t[1].h,.3633994843890525);
 near(t[2].z,1.1816997421945263); near(t[2].h,.8279868269571344);
});
test('reversing ordered inputs can change the final state while sums agree',()=>{
 near(M.trace([1,0,0],.5,'linear').at(-1).h,.25);
 near(M.trace([0,0,1],.5,'linear').at(-1).h,1);
});
test('parameter count includes each bias once and is independent of time length',()=>{
 assert.equal(M.parameters(3,2,2),18);assert.equal(M.parameters(3,4,2),42);
});
test('linear sensitivity decays or grows across exactly the selected number of links',()=>{
 near(M.memoryChain(20,.8,'linear').at(-1).gradient,.011529215046068483);
 near(M.memoryChain(20,1.2,'linear').at(-1).gradient,38.33759992447472);
 near(M.memoryChain(0,.8,'linear').at(-1).gradient,1);
});
test('tanh backward sensitivity agrees with a finite difference of the forward path',()=>{
 const eps=1e-6;
 for(const w of [.5,1,1.3]) {
  const hi=M.memoryChain(8,w,'tanh',.7+eps).at(-1).h;
  const lo=M.memoryChain(8,w,'tanh',.7-eps).at(-1).h;
  near(M.memoryChain(8,w,'tanh',.7).at(-1).gradient,(hi-lo)/(2*eps),1e-7);
 }
});
test('large recurrent weight need not explode through saturated tanh',()=>{
 const last=M.memoryChain(20,1.3,'tanh').at(-1);
 assert.ok(last.h>.5); assert.ok(last.gradient<.01);
});
test('scalar clipping bounds magnitude, preserves sign, and does not boost small gradients',()=>{
 assert.equal(M.clipGradient(38,5),5);assert.equal(M.clipGradient(-38,5),-5);
 assert.equal(M.clipGradient(.0115,5),.0115);
});
