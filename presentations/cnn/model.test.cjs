const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('./model.js');
const near=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);

test('worked 3×3 inner product is 1',()=>{
  near(M.innerProduct(M.WORKED.patch,M.WORKED.kernel),1);
  near(M.conv2d(M.WORKED.patch,M.WORKED.kernel)[0][0],1);
});

test('output size formula',()=>{
  assert.equal(M.outputSize(7,3,1,0),5);
  assert.equal(M.outputSize(7,3,2,0),3);
  assert.equal(M.outputSize(5,3,1,1),5);
  assert.equal(M.outputSize(224,11,4,2),55);
});

test('stride 2 visits every other origin',()=>{
  const pos=M.convPositions(7,7,3,2,0);
  assert.equal(pos.length,9);
  assert.deepEqual(pos.map(p=>[p.y,p.x]),[[0,0],[0,2],[0,4],[2,0],[2,2],[2,4],[4,0],[4,2],[4,4]]);
});

test('padding inserts zeros and restores size',()=>{
  const img=[[1,2],[3,4]],padded=M.pad2d(img,1);
  assert.deepEqual(padded,[
    [0,0,0,0],
    [0,1,2,0],
    [0,3,4,0],
    [0,0,0,0]
  ]);
  assert.equal(M.conv2d(img,M.KERNELS.identity,1,1).length,2);
});

test('max and average pooling on the demo patch',()=>{
  assert.deepEqual(M.pool2d(M.POOL_DEMO,2,2,'max'),[[4,2],[5,8]]);
  const avg=M.pool2d(M.POOL_DEMO,2,2,'avg');
  near(avg[0][0],2.25);near(avg[0][1],1);near(avg[1][0],2.25);near(avg[1][1],3.25);
});

test('feature-map parameter count',()=>{
  assert.equal(M.convParams(3,16,3,false),432);
  assert.equal(M.convParams(3,16,3,true),448);
});

test('receptive field of three stride-1 3×3 layers is 7',()=>{
  const rows=M.receptiveField([{k:3,s:1},{k:3,s:1},{k:3,s:1}]);
  assert.equal(rows.at(-1).rf,7);
  assert.equal(rows.at(-1).jump,1);
  const alex=M.receptiveField([{k:11,s:4,p:2}]);
  assert.equal(alex[1].rf,11);
  assert.equal(alex[1].jump,4);
});

test('three 3×3 layers match a 7×7 field with fewer weights',()=>{
  const s=M.stackVsLarge(3,3);
  assert.equal(s.kLarge,7);
  assert.equal(s.paramsSmall,27);
  assert.equal(s.paramsLarge,49);
});

test('a spatial shift of the input shifts a stride-1 same-padded feature map',()=>{
  const img=M.blobImage(7,2,1),k=M.KERNELS.identity;
  const a=M.conv2d(img,k,1,1),b=M.conv2d(M.shift2d(img,0,1),k,1,1);
  assert.deepEqual(b,M.shift2d(a,0,1));
});
