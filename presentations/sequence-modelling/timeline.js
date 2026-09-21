/* Deterministic teaching player. Motion and dwell share one cancellable clock. */
(function(root){
 function createPlayer(steps,render,options={}){
  const request=options.request||requestAnimationFrame,cancel=options.cancel||cancelAnimationFrame;
  const reduced=options.reduced||(()=>false),baseTransition=options.transition||1400,hold=options.hold||4600;
  const state={index:0,progress:1,playing:false,speed:1,checkpoint:false};
  const motion=()=>steps[state.index].transition||baseTransition;
  let handle=null,last=null,elapsed=motion(),destroyed=false;
  const emit=()=>{state.checkpoint=!!steps[state.index].checkpoint&&state.progress===1;render({...state});};
  function clear(){if(handle!==null)cancel(handle);handle=null;last=null;}
  function queue(){if(!destroyed&&handle===null)handle=request(tick);}
  function tick(t){handle=null;if(destroyed)return;if(last===null)last=t;elapsed+=(t-last)*state.speed;last=t;state.progress=Math.min(1,elapsed/motion());
   if(state.progress===1&&steps[state.index].checkpoint&&state.playing){state.playing=false;}
   if(state.playing&&elapsed>=motion()+hold){if(state.index===steps.length-1){state.playing=false;}else{state.index++;elapsed=0;state.progress=0;}}
   emit();if(state.playing||state.progress<1)queue();else last=null;
  }
  function set(index,animate){clear();state.playing=false;state.index=Math.max(0,Math.min(steps.length-1,index));state.progress=animate&&!reduced()?0:1;elapsed=state.progress*motion();emit();if(state.progress<1)queue();}
  const api={state,play(){if(destroyed)return;if(reduced()){set(Math.min(steps.length-1,state.index+1),false);return;}clear();if(state.index===steps.length-1&&state.progress===1){state.index=0;state.progress=1;elapsed=motion();}else if(steps[state.index].checkpoint&&state.progress===1){state.index++;state.progress=0;elapsed=0;}state.playing=true;emit();queue();},
   pause(){clear();state.playing=false;emit();},next(){set(state.index+1,true);},previous(){set(state.index-1,false);},restart(){set(0,false);},
   seek(position){clear();state.playing=false;const v=Math.max(0,Math.min(steps.length-1,Number(position)));state.index=Math.ceil(v);state.progress=v===Math.floor(v)?1:v-Math.floor(v);elapsed=state.progress*motion();emit();},
   speed(value){state.speed=Math.max(.25,Math.min(3,Number(value)));emit();},destroy(){clear();destroyed=true;state.playing=false;}
  };emit();return api;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={createPlayer};else root.SequenceTimeline={createPlayer};
})(typeof window!=='undefined'?window:this);
