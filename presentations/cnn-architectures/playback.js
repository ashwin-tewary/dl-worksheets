(function(root){
  'use strict';
  function createPlayer(count,render,options={}) {
    const schedule=options.schedule||((fn)=>setTimeout(fn,5500));
    const cancel=options.cancel||clearTimeout;
    const reducedMotion=options.reducedMotion||(()=>false);
    const state={index:0,playing:false};
    let timer=null;
    function stop(){if(timer!==null)cancel(timer);timer=null;state.playing=false;}
    function emit(){render({...state});}
    function queue(){timer=schedule(()=>{timer=null;if(!state.playing)return;state.index=Math.min(count-1,state.index+1);if(state.index===count-1)state.playing=false;emit();if(state.playing)queue();});}
    const player={state,play(){stop();if(state.index===count-1)state.index=0;if(reducedMotion()){state.index=Math.min(count-1,state.index+1);emit();return;}state.playing=true;emit();queue();},pause(){stop();emit();},next(){stop();state.index=Math.min(count-1,state.index+1);emit();},previous(){stop();state.index=Math.max(0,state.index-1);emit();},restart(){stop();state.index=0;emit();}};
    emit();return player;
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createPlayer};
  root.LecturePlayback={createPlayer};
})(typeof window!=='undefined'?window:globalThis);
