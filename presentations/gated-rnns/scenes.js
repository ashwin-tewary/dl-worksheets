/* Original vector teaching diagrams. No downloaded or generated raster artwork. */
(function(root){
 const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.GatedModel;
 const colors={ink:'#183c35',muted:'#586c62',teal:'#12655b',mint:'#dceadd',gold:'#e2b457',coral:'#b24a30',paper:'#fffefa',line:'#afc6b3'};
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const format=n=>Math.abs(n)>0&&Math.abs(n)<.001?n.toExponential(2):Number(n.toFixed(3)).toString();
 const text=(x,y,s,size=17,color=colors.ink,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-family="system-ui,sans-serif">${esc(s)}</text>`;
 function box(x,y,w,label,value,active=false,color=colors.teal){return `<rect x="${x}" y="${y}" width="${w}" height="75" rx="12" fill="${active?colors.mint:colors.paper}" stroke="${active?color:colors.line}" stroke-width="${active?2.5:1}"/>${text(x+w/2,y+25,label,14,colors.muted)}${text(x+w/2,y+55,value,23,color)}`;}
 function arrow(x1,y1,x2,y2,active=false,p=1,color=colors.teal){const x=x1+(x2-x1)*p,y=y1+(y2-y1)*p;return `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${active?color:colors.line}" stroke-width="${active?3:2}" marker-end="url(#arrow)"/>${active?`<circle cx="${x}" cy="${y}" r="6" fill="${color}"/>`:''}`;}
 const chip=(x,y,label,value)=>`<rect x="${x}" y="${y}" width="175" height="38" rx="8" fill="#f4e5d0"/>${text(x+87.5,y+25,`${label} = ${format(value)}`,16)}`;
 function recap(b,p,o){const hs=M.trace([1,0,0,-1],+o.weight),n=b===0?0:b===1?1:b<=3?2:b===4?3:4;let out=text(470,34,'ONE SHARED CELL RULE · FOUR DIFFERENT STATES',16,colors.teal);
 [1,0,0,-1].forEach((x,i)=>{const left=75+i*215;out+=box(left,105,155,`h${i+1}`,i<n?format(hs[i]):'?',i===n-1);out+=box(left,260,155,`input x${i+1}`,x);out+=arrow(left+77,258,left+77,184,i===n-1,p);if(i<3)out+=arrow(left+157,143,left+210,143,i===n-2,p);out+=text(left+77,370,`t = ${i+1}`,15);});
 return out+text(470,425,`h₀ = 0   ·   hₜ = tanh(xₜ + ${format(+o.weight)} hₜ₋₁)`,22);}
 function lstm(b,p,o){const s=M.lstm(o);let out=text(470,32,'CELL STATE: KEEP + WRITE',17,colors.teal);
 out+=box(30,85,165,'old cell cₜ₋₁',format(o.previous),b===0);
 out+=arrow(197,123,270,123,b===1,p);
 out+=box(275,85,180,'keep: f × old',b>=1?format(s.keep):'?',b===1);
 out+=arrow(457,123,515,123,b===4,p);
 out+=box(520,85,180,'add contributions',b>=4?format(s.cell):'predict',b===4);
 out+=arrow(702,123,752,123,b===4,p);
 out+=box(760,85,160,'new cell cₜ',b>=4?format(s.cell):'?',b>=4);
 out+=chip(278,190,'forget f',o.forget);
 out+=box(275,285,180,'write: i × g',b>=2?format(s.write):'?',b===2);
 out+=arrow(457,323,610,163,b===4,p,colors.coral);
 out+=chip(30,285,'candidate g',o.candidate)+chip(278,380,'input i',o.input);
 out+=arrow(207,323,270,323,b===2,p,colors.coral);
 out+=arrow(840,163,840,279,b>=5,p);
 out+=text(827,222,'tanh, then × o',15);
 out+=box(760,285,160,'exposed hₜ',b>=5?format(s.hidden):'?',b>=5);
 out+=chip(550,285,'output o',o.output);
 out+=text(470,457,b===3?'Predict: does a closed output gate erase stored memory?':'The memory route and exposed output are separate.',18);
 return out;}
 function highway(b,p,o){const L=+o.links,f=+o.forget,count=b<2?b:b<4?Math.min(5,L):b===4?Math.max(5,Math.ceil(p*L)):L;let out=text(470,30,'SURVIVING DIRECT-PATH SENSITIVITY · LOG SCALE',17,colors.teal);
 const xx=t=>95+760*t/L,yy=v=>v===0?375:80-Math.max(-5,Math.log10(v))*55;
 for(let k=0;k<=5;k++){const y=80+k*55;out+=`<path d="M95 ${y}H855" stroke="#d8e0d4"/>`+text(78,y+6,k===0?'1':`10⁻${["", "¹", "²", "³", "⁴", "⁵"][k]}`,15,colors.muted,'end');}
 out+=text(475,445,'Recurrent links from the initial state',16,colors.muted);
 [0,Math.round(L/2),L].forEach(t=>out+=text(xx(t),410,t,15));
 for(const [a,c] of [[.8,colors.coral],[f,colors.teal]]){const points=Array.from({length:Math.min(count,L)+1},(_,t)=>`${xx(t)},${yy(M.retention(a,t))}`).join(' ');out+=`<polyline points="${points}" fill="none" stroke="${c}" stroke-width="4"/>`;const t=Math.min(count,L);out+=`<circle cx="${xx(t)}" cy="${yy(M.retention(a,t))}" r="6" fill="${c}"/>`;}
 out+=text(220,57,'RNN: multiplier 0.8',16,colors.coral)+text(645,57,`LSTM direct route: f = ${format(f)}`,16,colors.teal);
 if(b>=4)out+=text(475,478,`At L = ${L}: RNN ${format(.8**L)} · LSTM ${format(f**L)}`,20);
 if(f===0)out+=text(655,375,'0 (off log scale)',15,colors.teal);
 return out;}
 function gru(b,p,o){const s=M.gru(o);let out=text(470,32,'RESET SHAPES THE PROPOSAL · UPDATE CHOOSES THE BLEND',17,colors.teal);
 out+=box(30,85,170,'old hₜ₋₁',format(o.previous),b===0);
 out+=arrow(202,123,515,123,b>=4,p);
 out+=box(520,85,175,'carry z × old',b>=4?format(s.keep):'?',b>=4);
 out+=arrow(697,123,755,190,b>=4,p);
 out+=box(760,180,160,'new hₜ',b>=4?format(s.hidden):'predict',b>=4);
 out+=arrow(115,163,115,278,b===1,p,colors.coral);
 out+=box(30,285,170,'reset r × old',b>=1?format(o.reset*o.previous):'?',b===1);
 out+=arrow(202,323,280,323,b===2,p,colors.coral);
 out+=box(285,285,200,'candidate tanh(x + r h)',b>=2?format(s.candidate):'?',b===2);
 out+=arrow(487,323,515,323,b>=4,p);
 out+=box(520,285,175,'write (1 − z) × h̃',b>=4?format(s.write):'?',b>=4);
 out+=arrow(697,323,755,252,b>=4,p);
 out+=chip(30,385,'reset r',o.reset)+chip(285,385,'input x',o.x)+chip(520,385,'update z',o.update);
 return out+text(470,464,'z = 1 retains old state; z = 0 takes the candidate.',19);}
 function bidirectional(b,p,o){const live=o.mode==='live',loan=o.ending==='loan',words=loan?['the','bank','approved','a','loan']:['the','bank','near','the','river'];const xs=[0,0,0,0,loan?-1:1],s=M.bidirectional(xs);let out=text(470,30,live?'LIVE PREFIX · ONLY TWO TOKENS AVAILABLE':'COMPLETE INPUT · TWO SEPARATE RECURRENT PASSES',17,colors.teal);
 const backCount=b<2?0:b===2?Math.max(1,Math.ceil(p*5)):5;
 words.forEach((word,i)=>{const x=35+i*182,available=!live||i<2;
 out+=box(x,75,150,`forward h${i+1}`,b>=1&&available?format(s.forward[i]):'—',b===1&&available);
 out+=box(x,210,150,`backward h${i+1}`,!live&&i>=5-backCount?format(s.backward[i]):'—',b===2&&i>=5-backCount,colors.coral);
 out+=box(x,332,150,`x${i+1} = ${available?xs[i]:'unseen'}`,available?word:'unseen',i===1);
 if(i<4){out+=arrow(x+152,112,x+178,112,b===1&&(!live||i===0),p);out+=arrow(x+178,248,x+152,248,b===2&&!live,p,colors.coral);}
 });
 if(b>=4&&!live){out+=`<rect x="211" y="68" width="161" height="224" rx="15" fill="none" stroke="${colors.gold}" stroke-width="4"/>`;out+=text(470,460,`At bank: [${format(s.forward[1])} ; ${format(s.backward[1])}] → a task-specific head`,22);}
 else out+=text(470,460,live?'No unseen suffix is fed into this live prediction.':'Same token position; different contextual views.',20);
 return out;}
 const renders={recap,lstm,highway,gru,bidirectional};
 function render(key,beat,progress,options){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 500" role="img" aria-label="${key} guided diagram, step ${beat+1}"><title>${key} · step ${beat+1}</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" fill="none" stroke="#12655b" stroke-width="1.5"/></marker></defs><rect width="940" height="500" fill="#fffefa" rx="12"/>${renders[key](beat,progress,options)}</svg>`.replaceAll('id="arrow"',`id="${key}-arrow"`).replaceAll('url(#arrow)',`url(#${key}-arrow)`);}
 const api={render,format};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GatedScenes=api;
})(typeof window!=='undefined'?window:globalThis);
