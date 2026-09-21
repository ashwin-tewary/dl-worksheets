(function(root){
 'use strict';
 const beat=(title,narration,equation='',checkpoint=false)=>({title,narration,equation,checkpoint});
 const stories={
  order:{title:'A film is more than its frames.',subtitle:'Reverse the journey. Keep every pixel. Watch the meaning change.',note:'Synthetic 3 × 3 binary images. The bright pixel is 1; all other pixels are 0. Averaging is an example of an order-blind summary, not a property of all CNNs.',steps:[
   beat('Meet the frames','One bright dot appears at three different positions. Every cell is numbered so we can track exactly what moves.'),
   beat('Read the first frame','At t = 1, you see a position. One image alone does not tell you the direction of motion.'),
   beat('Read in time order','The second frame supplies a change. Order turns positions into a journey. The moving marker traces the temporal connection.'),
   beat('Predict the reversal','Before revealing the answer: if we reverse all three frames, which properties stay the same? Which one changes?','Same values + different order = ?',true),
   beat('Reveal the journey','All three images are unchanged, but the direction reverses. Use “Reverse order” to compare the two journeys.'),
   beat('Lose the order','The time average is identical in both directions. Once an order-blind summary merges the two sequences, a downstream classifier cannot reconstruct their direction from that summary alone.','Mean centre row = [⅓, ⅓, ⅓] in either direction')
  ]},
  tasks:{title:'What should come out—and when?',subtitle:'One input stream can support three different prediction tasks.',note:'Tokens and one-hot vectors are hand-written examples. Output labels are supplied teaching targets, not predictions from a trained language model. EOS marks the end of a sequence.',steps:[
   beat('Name the task','First decide what you need to predict. A sequence label, a tag for each token and the next token require different target alignments.'),
   beat('Encode one token','A token becomes a vector before it enters the network. Here the vocabulary is [not, very, good]; the first input is [1, 0, 0].','Token IDs name categories; their numerical size is not meaning.'),
   beat('Keep the prefix honest','A causal model can use only the tokens already read. A faded future token belongs to the example but is not available to this prediction.'),
   beat('Predict the output positions','Choose a task. Should an output appear at every step, or only after the final word? For next-token training, which token is the target after “very”?','Write down the input → target alignment.',true),
   beat('Align the targets','A review label follows the final state. Token tags align with their input token. Next-token targets are shifted one place left: very, good, EOS.'),
   beat('Change the question','Switch the task and compare the output locations. The recurrent state update can stay the same while the readout and training targets change.','Sequence label: ŷ = g(hT) · token outputs: ŷt = g(ht)')
  ]},
  state:{title:'Read. Combine. Update.',subtitle:'Inspect the arithmetic inside one recurrent cell before expanding it through time.',note:'A one-dimensional teaching RNN with input weight 1, recurrent weight w, bias 0 and h₀ = 0. The values are chosen, not learned. Tanh is the default; linear mode removes tanh for hand calculation.',steps:[
   beat('Start with a clean notebook','Before reading anything, set h₀ = 0. This is the initial state, not a trainable weight in our example.'),
   beat('Bring in the new evidence','Read the current input xₜ. The earlier inputs are represented only through the previous state.'),
   beat('Combine old and new','Multiply the previous state by w, then add xₜ. This produces the pre-activation zₜ. In a full RNN these multiplications use matrices.','zₜ = xₜ + w hₜ₋₁'),
   beat('Predict before updating','With linear mode, w = 0.5 and inputs [1, 0, 1], what will h₂ be? Does zero input force the state back to zero?','Use h₁ = 1; calculate h₂ before continuing.',true),
   beat('Write the first state','Apply the chosen activation. Tanh keeps the state between −1 and 1; linear mode leaves z unchanged. The result is passed to the next step.'),
   beat('Zero input, nonzero memory','At the second step, x₂ = 0. The recurrent contribution can still be nonzero. Change w to 0 to remove that route from the past.'),
   beat('Read the third input','The last state depends on both the new input and the state carried forward. A state is a learned summary in a trained network; it is not a literal transcript.','Compare tanh and linear mode in the numeric trace below.')
  ]},
  unroll:{title:'One cell. Many uses.',subtitle:'Unfold the loop into a computation you can follow from left to right.',note:'One recurrent layer, column-vector notation, input dimension d = 3 and output dimension C = 2. We count all weights and biases, including the output head; h₀ is fixed. Drawn time steps are not stacked recurrent layers.',steps:[
   beat('A loop hides the schedule','The compact diagram says “reuse this cell”. Its loop does not show which state existed first.'),
   beat('Make two uses visible','Unrolling draws two applications of the same function. h₁ feeds h₂. The drawings share parameters, but their state values can differ.'),
   beat('Extend the time axis','Continue for T inputs. The same parameter bank is connected to every use. Each new step adds computation and a new state.'),
   beat('Predict the parameter count','With d = 3, H = 2 and C = 2, we have 18 parameters. If T doubles, what happens to this count? What happens to the number of cell evaluations?','Parameters versus computation: make two predictions.',true),
   beat('Finish the forward pass','A sequence-level loss can be attached to the final readout. Earlier states can influence it through the recurrent arrows.'),
   beat('Send credit backward','During training, the loss sends derivatives backward through the unrolled graph. This is backpropagation through time. Backward credit is not future information at inference.'),
   beat('Add into the same bank','Because every time step uses the same parameters, their gradient contributions accumulate into one update. Change T and H to separate time length from hidden width.','P = Hd + H² + H + CH + C')
  ]},
  memory:{title:'Carry one clue through the gap.',subtitle:'Keep the first clue fixed. Add neutral steps. Measure its surviving influence.',note:'Controlled scalar experiment: h₀ = +1, all subsequent inputs are 0. Neutral here means zero external input, not that the recurrent update stops. Magnitude is not classification accuracy; a small positive value still has a positive sign.',steps:[
   beat('Plant the clue','Imagine the first word determines an answer much later. We isolate that clue as a scalar state h₀ = +1.'),
   beat('Insert a neutral step','No new evidence arrives: x = 0. Nevertheless, the recurrent transformation still changes the state.'),
   beat('Widen the gap','Every extra step inserts another transformation between the clue and the answer. The state width stays fixed.'),
   beat('Predict the effect','In linear mode with w = 0.8, is the clue multiplied by 0.8 once or once per link? Predict the size after 20 links.','h₂₀ = 0.8²⁰ × h₀',true),
   beat('Measure the state','The ending value is a forward quantity. Smaller magnitude can make a signal more fragile, but this display alone does not establish prediction failure.'),
   beat('Ask the learning question','Remembering a clue during a forward pass and learning to preserve it are connected but different questions. Next, send a unit sensitivity backward through these very same operations.','How much would the final state change if h₀ changed slightly?')
  ]},
  gradient:{title:'Can the correction reach the beginning?',subtitle:'Follow a unit sensitivity backward, multiplying one local derivative at a time.',note:'We measure ∂hL/∂h₀ with inputs held fixed and seed ∂hL/∂hL = 1. This is one path of the chain rule, not the complete parameter gradient. The vertical axis is logarithmic so small and large magnitudes remain visible.',steps:[
   beat('Seed the final sensitivity','Start at the final state with sensitivity 1. A loss would supply an additional derivative; here we isolate the recurrent path.'),
   beat('Cross one link backward','Multiply by the derivative of the last recurrent update. For a linear cell this is w. For tanh it is w(1 − hₜ²).','Jₜ = ∂hₜ/∂hₜ₋₁'),
   beat('Cross several links','The chain rule multiplies these local derivatives. Repeated factors below one shrink the result; repeated factors above one can grow it.'),
   beat('Predict before the reveal','With 20 linear links, compare w = 0.8 and w = 1.2. Will doubling a clipping threshold bring back a vanished signal?','g₀ = J₁ J₂ … JL × 1',true),
   beat('Read the returning signal','Try the Decay and Growth presets. Keep the displayed magnitude separate from model accuracy. The identity line at 1 is a reference, not a pass/fail threshold.'),
   beat('Test the tanh surprise','Try Saturation: w = 1.3 with tanh. The state can stay appreciable while the gradient becomes small. A weight above 1 alone does not prove explosion.','The derivative depends on both the weight and the activation.'),
   beat('Match the remedy to the problem','Clipping caps a large gradient without enlarging a small one. Truncation limits the training path. Gated memory creates paths that can preserve derivatives; it does not guarantee perfect recall.')
  ]}
 };
 stories.memory.steps[4].transition=6000;
 stories.gradient.steps[4].transition=6000;
 if(typeof module!=='undefined'&&module.exports)module.exports=stories;else root.SequenceStories=stories;
})(typeof window!=='undefined'?window:globalThis);
