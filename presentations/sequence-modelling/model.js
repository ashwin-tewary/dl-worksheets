/* Exact, deterministic teaching examples. No trained weights or predictions. */
(function(root){
 'use strict';
 function trace(inputs,weight=.5,activation='tanh',initial=0){
  let h=initial;
  return inputs.map((x,i)=>{const previous=h,z=x+weight*previous;h=activation==='linear'?z:Math.tanh(z);return {t:i+1,x,previous,z,h,derivative:weight*(activation==='linear'?1:1-h*h)};});
 }
 function parameters(d,H,C){return H*d+H*H+H+C*H+C;}
 function memoryChain(length,weight=.8,activation='linear',initial=1){
  let gradient=1;
  return [{t:0,h:initial,gradient:1,derivative:1},...trace(Array.from({length},()=>0),weight,activation,initial).map(s=>({...s,gradient:(gradient*=s.derivative)}))];
 }
 function clipGradient(value,limit){return Math.sign(value)*Math.min(Math.abs(value),limit);}
 const api={trace,parameters,memoryChain,clipGradient};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SequenceModel=api;
})(typeof window!=='undefined'?window:globalThis);
