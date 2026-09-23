const {test}=require('node:test');
const assert=require('node:assert/strict');
let M={};try{M=require('./model.js');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('LSTM separates stored cell state from exposed hidden state',()=>{
 assert.equal(typeof M.lstm,'function');
 const s=M.lstm({previous:.8,forget:.75,input:.5,candidate:.4,output:.6});
 close(s.keep,.6);close(s.write,.2);close(s.cell,.8);close(s.hidden,.3984220621607095);
 const closed=M.lstm({previous:.8,forget:1,input:0,candidate:-1,output:0});
 close(closed.cell,.8);close(closed.hidden,0);
});
test('GRU reset changes only candidate; update uses the stated retention convention',()=>{
 assert.equal(typeof M.gru,'function');
 close(M.gru({previous:.8,x:.2,reset:0,update:1}).hidden,.8);
 close(M.gru({previous:.8,x:.2,reset:0,update:0}).hidden,.197375320224904);
 close(M.gru({previous:.8,x:.2,reset:.5,update:.75}).hidden,.734262391749509);
});
test('memory highway computes the direct path, including endpoints',()=>{
 assert.equal(typeof M.retention,'function');
 close(M.retention(.8,20),.011529215046068483);close(M.retention(.95,20),.3584859224085419);
 close(M.retention(0,20),0);close(M.retention(1,40),1);close(M.retention(.95,0),1);
});
test('bidirectional backward states are realigned to original token positions',()=>{
 assert.equal(typeof M.bidirectional,'function');
 const s=M.bidirectional([1,0,-1],.5);
 close(s.forward[0],.7615941559557649);close(s.backward[2],-.7615941559557649);
 close(s.forward[1],.3633994843890525);close(s.backward[1],-.3633994843890525);
 const a=M.bidirectional([0,0,0,0,1]),b=M.bidirectional([0,0,0,0,-1]);
 close(a.forward[1],b.forward[1]);assert.ok(a.backward[1]>0);assert.ok(b.backward[1]<0);
});
test('parameter counts use one bias per affine transform and no output head',()=>{
 assert.equal(typeof M.parameters,'function');
 assert.deepEqual(M.parameters(3,2),{rnn:12,lstm:48,gru:36,bilstm:96});
});
