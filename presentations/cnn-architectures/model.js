/* Exact arithmetic helpers. The gradient illustration is explicitly synthetic. */
(function(root){
'use strict';
function costs(k,m,n,area=784){const standard=k*k*m*n,depthwise=k*k*m,pointwise=m*n,separable=depthwise+pointwise;return{standard,depthwise,pointwise,separable,ratio:separable/standard,standardMAC:standard*area,separableMAC:separable*area};}
function branch(r){return{direct:9*192*128,reduced:192*r+9*r*128};}
function residual(a,x=2){return{plain:a*x,residual:(1+a)*x,plainGradient:a,residualGradient:1+a};}
function shape(transition,projection){const output=transition?'28 × 28 × 128':'56 × 56 × 64';return{input:'56 × 56 × 64',output,shortcut:projection?output:'56 × 56 × 64',valid:!transition||projection,projectionWeights:projection?64*(transition?128:64):0};}
function gradient(depth,magnitude=1,n=80){const rho=Math.exp(-(depth-1)/8),a=[],b=[];for(let i=0;i<n;i++){const smooth=Math.SQRT2*Math.sin(2*Math.PI*i/n),noise=Math.SQRT2*Math.sin(2*Math.PI*17*i/n);a.push(magnitude*smooth);b.push(magnitude*(rho*smooth+Math.sqrt(1-rho*rho)*noise));}return{a,b,rho,rms:magnitude};}
function correlate(a,b){const ma=a.reduce((x,y)=>x+y,0)/a.length,mb=b.reduce((x,y)=>x+y,0)/b.length;let ab=0,aa=0,bb=0;for(let i=0;i<a.length;i++){ab+=(a[i]-ma)*(b[i]-mb);aa+=(a[i]-ma)**2;bb+=(b[i]-mb)**2;}return ab/Math.sqrt(aa*bb);}
function conv2(a){return[0,1,3,4].map(i=>a[i]+a[i+1]+a[i+3]+a[i+4]);}
const api={costs,branch,residual,shape,gradient,correlate,conv2};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.CNN=api;
})(typeof window!=='undefined'?window:globalThis);
