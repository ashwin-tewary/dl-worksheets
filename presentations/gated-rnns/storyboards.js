(function(root){
 const beat=(title,narration,equation='',checkpoint=false)=>({title,narration,equation,checkpoint});
 const stories={
 recap:{title:'One clue. Many transformations.',subtitle:'Follow a state through time, then ask how an earlier input can affect a later decision.',note:'Scalar RNN: h₀ = 0, input weight 1, bias 0. The four supplied inputs are [1, 0, 0, −1]. This is an arithmetic demonstration, not a trained language model.',steps:[
 beat('Read one input','The same recurrent cell will read four inputs in order. xₜ is new evidence; hₜ₋₁ is the summary carried from the past.'),
 beat('Write the first state','Input 1 becomes tanh(1) ≈ 0.762. The state is a number here, and a vector in a real network.','h₁ = tanh(1 + w × 0)'),
 beat('Carry through a zero','Zero input does not freeze the state. The recurrent transformation still acts.','h₂ = tanh(w h₁)'),
 beat('Predict the next memory','At w = 0.5, will another zero keep h₃ equal to h₂? Explain before continuing.','Same input value does not imply the same hidden state.',true),
 beat('Watch the clue change','Each repeated transformation changes the old clue. Reducing the recurrent weight makes this route shrink more quickly.'),
 beat('Read conflicting evidence','The final input is −1. The same state must now mix an old clue with new evidence. We would like a learned way to keep, write or expose information selectively.','hₜ = tanh(Wₓxₜ + Wₕhₜ₋₁ + b)')
 ]},
 lstm:{title:'Keep. Write. Reveal.',subtitle:'Build a cell-state update one operation at a time; the two state outputs are different.',note:'One coordinate of a modern LSTM with forget gate, without peepholes or projection. Gate outputs are manually supplied to isolate the mechanism. Real gates are vectors computed from xₜ and hₜ₋₁. Boundary values 0 and 1 are idealized limits.',steps:[
 beat('Bring two kinds of state','The cell state c carries stored content. The hidden state h carries the exposed output. At this step cₜ₋₁ = 0.8.'),
 beat('Keep a fraction','The forget gate multiplies old memory. With f = 0.75, the retained contribution is 0.6.','retained = fₜ ⊙ cₜ₋₁'),
 beat('Prepare a signed proposal','The candidate g proposes new content; tanh allows negative as well as positive values. The input gate scales how much is written.','write = iₜ ⊙ gₜ'),
 beat('Predict the new cell','At the default settings, combine 0.75 × 0.8 and 0.5 × 0.4. Then predict what output gate 0 would do to c and h.','cₜ = retained + write',true),
 beat('Add into memory','The two contributions meet by addition. The new cell state is stored for the next time step. Unlike the hidden state, it is not bounded by tanh.','cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ gₜ'),
 beat('Expose only what is needed','Apply tanh to stored memory and multiply by the output gate. Closing this gate hides the current output without deleting the stored cell state.','hₜ = oₜ ⊙ tanh(cₜ)'),
 beat('Try an intervention','Set output to 0, then forget to 1 and input to 0. Track which state changes. These controls set gate outputs; training learns how to produce them.')
 ]},
 highway:{title:'Build a route for credit.',subtitle:'Compare repeated multiplication on two isolated paths. The plot uses a logarithmic scale.',note:'Controlled experiment: all write terms are zero, c₀ = h₀ = 1. The RNN comparison is linear with multiplier 0.8. LSTM gates are held constant, so the direct cell-state path has derivative fᴸ. This is not the full recurrent Jacobian or an accuracy measurement.',steps:[
 beat('Start with sensitivity one','A small change to the initial state has size 1 at the start. Trace how much of it survives along a chosen path.'),
 beat('Cross one recurrent link','The linear RNN multiplies by 0.8. The LSTM direct memory edge multiplies by the forget gate f.','RNN edge: 0.8 · direct LSTM edge: f'),
 beat('Cross five links','The chain rule multiplies local derivatives. A value near 1 can preserve more of this route over many steps.'),
 beat('Predict twenty links','Compare 0.8²⁰ with 0.95²⁰. Is a forget gate near 1 a promise that every LSTM gradient will survive?','Make a numerical prediction and a caveat.',true),
 beat('Measure the two paths','At 20 links and f = 0.95, the two sensitivities are about 0.0115 and 0.3585. Change f and length to see the exponential effect.','Direct cell path = ∏ fₜ; constant f gives fᴸ'),
 beat('Keep the caveat','Gates depend on the input and hidden state. Other gradient routes, saturation, and the readout also matter. LSTMs help with long dependencies; they do not guarantee perfect recall.')
 ]},
 gru:{title:'One state. Two gates.',subtitle:'First shape the candidate with reset, then blend it with the previous state.',note:'Scalar reset-before-matrix GRU: x = 0.2, hₜ₋₁ = 0.8, input/recurrent weights 1 and bias 0. Here z is the fraction of OLD state retained. Some references swap z and 1 − z; some frameworks place reset after the recurrent projection.',steps:[
 beat('Start with one state','GRU has no separate cell-state vector c. The previous hidden state supplies both carried memory and material for a candidate.'),
 beat('Reset the candidate route','The reset gate r scales old state only on the candidate branch. r = 0 makes the candidate ignore the previous state.','candidate = tanh(x + r hₜ₋₁)'),
 beat('Make a candidate','Combine the reset-filtered state with the input, then apply tanh. The separate carry route is still available.'),
 beat('Predict the update','Using the displayed settings, predict the new state from the old-state contribution and the candidate contribution. After the reveal, test r = 0 and z = 1 with the preset.','Reset affects the proposal; update chooses the blend.',true),
 beat('Blend old and proposed','z retains old state and 1 − z admits the candidate. At z = 1 the state is retained; at z = 0 it is fully replaced by the candidate.','hₜ = zₜ ⊙ hₜ₋₁ + (1 − zₜ) ⊙ h̃ₜ'),
 beat('Compare the trade-off','A GRU uses three affine transforms; an LSTM uses four. Fewer parameters at equal hidden width does not establish a universal accuracy or speed winner.')
 ]},
 bidirectional:{title:'Read both ways. Meet at the same word.',subtitle:'Finish the two passes, align their states, then concatenate at “bank”.',note:'The sentences motivate ambiguity; the numbers are a supplied toy encoding, not learned semantics. x = [0, 0, 0, 0, ±1], scalar tanh cells, recurrent weight 0.5, zero boundary states. The two directions use separate parameter sets (chosen equal here for simplicity).',steps:[
 beat('An unfinished sentence','After “the bank”, later context is still unavailable in a live stream. Many interpretations remain possible.'),
 beat('Read left to right','The forward state at bank sees only the prefix through bank. Changing later words cannot change this forward state.'),
 beat('Read right to left','With a completed sentence, a second recurrent network starts at the last word. Watch its states arrive in reverse order.'),
 beat('Predict the alignment','To label bank at position 2, should we pair its forward state with the backward state at bank, or with the last word?','Match original token positions, not processing order.',true),
 beat('Join the two views','Concatenate forward and backward states at the SAME position. H numbers in each direction give 2H features for the readout.','uₜ = [h→ₜ ; h←ₜ]'),
 beat('Enforce the information boundary','Switch to live-prefix mode. Unseen suffix inputs and backward states disappear. A bidirectional encoder of a completed input is valid; using the unknown next-token target as input is leakage.')
 ]}
 };
 stories.highway.steps[4].transition=3500;
 stories.bidirectional.steps[2].transition=3500;
 if(typeof module!=='undefined'&&module.exports)module.exports=stories;else root.GatedStories=stories;
})(typeof window!=='undefined'?window:globalThis);
