/* Exact, deliberately small teaching models. Gates are supplied, not trained. */
(function(root){
 'use strict';
 function lstm({previous,forget,input,candidate,output}){
  const keep=forget*previous,write=input*candidate,cell=keep+write;
  return {keep,write,cell,hidden:output*Math.tanh(cell)};
 }
 // Reset-before-matrix GRU; scalar input/recurrent weights = 1, bias = 0.
 function gru({previous,x,reset,update}){
  const candidate=Math.tanh(x+reset*previous);
  return {candidate,keep:update*previous,write:(1-update)*candidate,hidden:update*previous+(1-update)*candidate};
 }
 function retention(f,links){return f**links;}
 function trace(inputs,weight=.5){let h=0;return inputs.map(x=>h=Math.tanh(x+weight*h));}
 function bidirectional(inputs,weight=.5){return {forward:trace(inputs,weight),backward:trace([...inputs].reverse(),weight).reverse()};}
 function parameters(d,H){const base=H*(d+H+1);return {rnn:base,lstm:4*base,gru:3*base,bilstm:8*base};}
 const api={lstm,gru,retention,trace,bidirectional,parameters};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GatedModel=api;
})(typeof window!=='undefined'?window:globalThis);
