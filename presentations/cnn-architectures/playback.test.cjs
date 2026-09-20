const {test}=require('node:test');
const assert=require('node:assert/strict');
let createPlayer;try{({createPlayer}=require('./playback.js'));}catch{}
function setup(reduced=false){assert.equal(typeof createPlayer,'function','playback controller exists');let task=null;const frames=[];const player=createPlayer(3,s=>frames.push({...s}),{reducedMotion:()=>reduced,schedule:fn=>(task=fn,1),cancel:()=>{task=null;}});return{player,frames,tick(){const fn=task;task=null;fn?.();},pending:()=>!!task};}
test('play advances and stops at the last scene without looping',()=>{const s=setup();s.player.play();s.tick();assert.equal(s.player.state.index,1);s.tick();assert.equal(s.player.state.index,2);assert.equal(s.player.state.playing,false);assert.equal(s.pending(),false);});
test('pause cancels playback and manual navigation stays paused',()=>{const s=setup();s.player.play();s.player.pause();s.tick();assert.equal(s.player.state.index,0);s.player.next();assert.equal(s.player.state.index,1);assert.equal(s.pending(),false);s.player.previous();assert.equal(s.player.state.index,0);s.player.previous();assert.equal(s.player.state.index,0);});
test('restart cancels timers and resets the first frame',()=>{const s=setup();s.player.play();s.tick();s.player.restart();assert.equal(s.player.state.index,0);assert.equal(s.player.state.playing,false);assert.equal(s.pending(),false);});
test('reduced motion advances one step with no automatic timer',()=>{const s=setup(true);s.player.play();assert.equal(s.player.state.index,1);assert.equal(s.player.state.playing,false);assert.equal(s.pending(),false);});
