(function(root){
  'use strict';

  function zeros(h,w){return Array.from({length:h},()=>Array(w).fill(0));}
  function clone(img){return img.map(row=>row.slice());}
  function shape(img){return {h:img.length,w:img[0].length};}

  function pad2d(img,p){
    if(!p)return clone(img);
    const {h,w}=shape(img),out=zeros(h+2*p,w+2*p);
    for(let i=0;i<h;i++)for(let j=0;j<w;j++)out[i+p][j+p]=img[i][j];
    return out;
  }

  function outputSize(h,k,s,p){return Math.floor((h+2*p-k)/s)+1;}

  function conv2d(img,kernel,stride=1,pad=0){
    const padded=pad2d(img,pad),k=kernel.length,H=outputSize(padded.length,k,stride,0),W=outputSize(padded[0].length,k,stride,0),out=zeros(H,W);
    for(let i=0;i<H;i++)for(let j=0;j<W;j++){
      let sum=0;
      for(let u=0;u<k;u++)for(let v=0;v<k;v++)sum+=padded[i*stride+u][j*stride+v]*kernel[u][v];
      out[i][j]=sum;
    }
    return out;
  }

  function convPositions(h,w,k,stride=1,pad=0){
    const H=outputSize(h,k,stride,pad),W=outputSize(w,k,stride,pad),pos=[];
    for(let i=0;i<H;i++)for(let j=0;j<W;j++)pos.push({i,j,y:i*stride-pad,x:j*stride-pad,oy:i,ox:j});
    return pos;
  }

  function patchAt(img,y,x,k,pad=0){
    const padded=pad2d(img,pad),py=y+pad,px=x+pad,patch=zeros(k,k);
    for(let u=0;u<k;u++)for(let v=0;v<k;v++)patch[u][v]=padded[py+u][px+v];
    return patch;
  }

  function innerProduct(a,b){
    let s=0;for(let i=0;i<a.length;i++)for(let j=0;j<a[0].length;j++)s+=a[i][j]*b[i][j];
    return s;
  }

  function pool2d(img,k=2,stride=2,kind='max'){
    const {h,w}=shape(img),H=outputSize(h,k,stride,0),W=outputSize(w,k,stride,0),out=zeros(H,W);
    for(let i=0;i<H;i++)for(let j=0;j<W;j++){
      let acc=kind==='max'?-Infinity:0;
      for(let u=0;u<k;u++)for(let v=0;v<k;v++){
        const val=img[i*stride+u][j*stride+v];
        acc=kind==='max'?Math.max(acc,val):acc+val;
      }
      out[i][j]=kind==='max'?acc:acc/(k*k);
    }
    return out;
  }

  function shift2d(img,dy,dx){
    const {h,w}=shape(img),out=zeros(h,w);
    for(let i=0;i<h;i++)for(let j=0;j<w;j++){
      const y=i-dy,x=j-dx;
      if(y>=0&&y<h&&x>=0&&x<w)out[i][j]=img[y][x];
    }
    return out;
  }

  function blobImage(n=7,row=2,col=2,size=3,peak=4){
    const img=zeros(n,n);
    for(let i=0;i<size;i++)for(let j=0;j<size;j++)img[row+i][col+j]=1;
    img[row+Math.floor(size/2)][col+Math.floor(size/2)]=peak;
    return img;
  }

  const KERNELS={
    identity:[[0,0,0],[0,1,0],[0,0,0]],
    blur:[[1,1,1],[1,1,1],[1,1,1]].map(r=>r.map(v=>v/9)),
    edgex:[[-1,0,1],[-1,0,1],[-1,0,1]],
    edgey:[[-1,-1,-1],[0,0,0],[1,1,1]],
    sharpen:[[0,-1,0],[-1,5,-1],[0,-1,0]]
  };

  function convParams(cin,cout,k,bias=false){return cout*cin*k*k+(bias?cout:0);}

  function receptiveField(layers){
    let rf=1,jump=1,rows=[{layer:0,rf:1,jump:1,k:1,s:1,p:0}];
    layers.forEach((L,i)=>{
      rf=rf+(L.k-1)*jump;
      jump=jump*L.s;
      rows.push({layer:i+1,rf,jump,k:L.k,s:L.s,p:L.p||0});
    });
    return rows;
  }

  function stackVsLarge(kSmall=3,n=3){
    const kLarge=1+(kSmall-1)*n;
    return {kLarge,paramsSmall:n*kSmall*kSmall,paramsLarge:kLarge*kLarge,rf:kLarge};
  }

  const WORKED={
    patch:[[1,2,0],[0,1,2],[3,0,1]],
    kernel:[[1,0,-1],[1,0,-1],[1,0,-1]],
    product:1
  };

  const POOL_DEMO=[[1,3,2,0],[4,1,0,2],[2,2,8,1],[0,5,1,3]];

  const api={zeros,clone,shape,pad2d,outputSize,conv2d,convPositions,patchAt,innerProduct,pool2d,shift2d,blobImage,KERNELS,convParams,receptiveField,stackVsLarge,WORKED,POOL_DEMO};
  if(typeof module!=='undefined')module.exports=api;else root.CNNModel=api;
})(typeof window==='undefined'?globalThis:window);
