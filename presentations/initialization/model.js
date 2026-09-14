(function(root){
  'use strict';
  const activate=(x,type,alpha=0.1)=>type==='tanh'?Math.tanh(x):type==='relu'?Math.max(0,x):type==='leaky'?Math.max(alpha*x,x):x;
  function weightVariance(init,nIn,nOut,sigma=1,alpha=0){return init==='xavier'?2/(nIn+nOut):init==='he'?2/((1+alpha*alpha)*nIn):init==='random'?sigma*sigma:0;}
  function moments(v,activation,alpha=0.1){
    if(activation==='linear')return {mean:0,q:v,variance:v,gain:1,saturation:0};
    if(activation==='relu'||activation==='leaky'){
      const a=activation==='leaky'?alpha:0,mean=(1-a)*Math.sqrt(v/(2*Math.PI)),q=(1+a*a)*v/2;
      return {mean,q,variance:Math.max(0,q-mean*mean),gain:(1+a*a)/2,saturation:0};
    }
    // Deterministic Gaussian midpoint quadrature, independent of the display samples.
    let q=0,gain=0,saturation=0,mass=0;
    for(let i=0;i<800;i++){const x=-8+(i+.5)*.02,p=Math.exp(-x*x/2),a=Math.tanh(x*Math.sqrt(v));mass+=p;q+=p*a*a;gain+=p*(1-a*a)**2;if(Math.abs(a)>.95)saturation+=p;}
    return {mean:0,q:q/mass,variance:q/mass,gain:gain/mass,saturation:saturation/mass};
  }
  function propagate({init='xavier',activation='linear',nIn=128,nOut=128,depth=10,sigma=1,alpha=.1}={}){
    let q=1;const rows=[{layer:0,preVariance:1,q:1,variance:1,mean:0,gradientGain:1,saturation:0}];
    // nIn and nOut describe a repeated width-pair thought experiment, not a fixed chain.
    const wv=weightVariance(init,nIn,nOut,sigma,activation==='leaky'?alpha:0);
    for(let layer=1;layer<=depth;layer++){
      const preVariance=nIn*wv*q,m=moments(preVariance,activation,alpha);
      rows.push({layer,preVariance,...m,gradientGain:nOut*wv*m.gain});q=m.q;
    }return {rows,wv,multiplier:nIn*wv};
  }
  function random(seed){let state=seed>>>0;return()=>{state=(1664525*state+1013904223)>>>0;return (state+.5)/4294967296;};}
  function normalSamples(seed,count){const rng=random(seed),out=[];for(let i=0;i<count;i++)out.push(Math.sqrt(-2*Math.log(rng()))*Math.cos(2*Math.PI*rng()));return out;}
  function symmetry(c=0,depth=3,perturb=false){
    let h=[1,2],rows=[];
    for(let l=0;l<depth;l++){let next=[];for(let i=0;i<5;i++)next.push(Math.tanh(h.reduce((s,x,j)=>s+(c+(perturb?.08*Math.sin((i+1)*17+(j+1)*31+l):0))*x,0)));rows.push(next);h=next;}return rows;
  }
  const api={activate,weightVariance,moments,propagate,normalSamples,symmetry};if(typeof module!=='undefined')module.exports=api;else root.InitModel=api;
})(typeof window==='undefined'?globalThis:window);
