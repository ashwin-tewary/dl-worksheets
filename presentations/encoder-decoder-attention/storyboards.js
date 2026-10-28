(function(root){
 const beat=(title,narration,equation='',checkpoint=false)=>({title,narration,equation,checkpoint});
 const stories={
 encoder:{title:'One reader. One writer. Different clocks.',note:'Translation and outputs are scripted illustrations. Encoder values use the scalar recurrence shown; decoder states and vocabulary probabilities are conceptual.',steps:[
 beat('Read the source','Each input token becomes a vector. A shared encoder cell updates its state; it has not produced a target token yet.','hᵢ = Encoder(hᵢ₋₁, Eₓ(xᵢ))'),
 beat('Carry the summary','Follow the state through all three source positions. The final state summarizes the source in this baseline.','c = h₃; s₀ = bridge(c)'),
 beat('Predict the first input','The source is finished. There is no previous translated word. What should the decoder receive first?','Predict before continuing.',true),
 beat('Begin with BOS','A special beginning-of-sequence token starts generation. The training illustration predicts je; inference mode illustrates a scripted first error, tu.','BOS → decoder → first target prediction'),
 beat('Feed the previous token','Training can feed the correct previous target (teacher forcing). Inference feeds the model’s previous prediction. Toggle the mode and watch the changed input.','p(y | x) = ∏ₜ p(yₜ | y<ₜ, x)'),
 beat('Stop on EOS','The decoder can produce a different number of tokens from the source. EOS marks completion; a maximum length is a practical fallback.','je → t’aime → EOS')
 ]},
 bottleneck:{title:'A longer story. The same size notebook.',note:'This is a scalar sensitivity experiment, not a word-capacity or translation-accuracy model. Width stays one; retention changes repeated state updates.',steps:[
 beat('Plant an early clue','Compare sequences that differ only at the first scalar input: +1 versus −1. Later inputs are all zero.','hᵢ = tanh(xᵢ + r hᵢ₋₁)'),
 beat('Pass through more updates','The initial difference passes through each recurrent update. Increase the sequence length and inspect both final states.','Δ = |hₙ(+1) − hₙ(−1)|'),
 beat('Predict the difference','Will the final states be easier or harder to distinguish after more steps? Does a wider vector have a literal word limit?','Make a prediction; then reveal.',true),
 beat('Inspect the final summary','For this recurrence, the difference often shrinks. This illustrates a mechanism that can make early details hard to recover; it does not prove every RNN forgets.','A fixed-width representation must serve every output step.'),
 beat('Keep the intermediate notes','Instead of exposing only hₙ, retain h₁ … hₙ. Give the decoder a route back to the source positions.','Memory bank H = [h₁, …, hₙ]'),
 beat('Ask a fresh question each time','A different decoder query can retrieve a different weighted mixture. The retrieved context is still fixed-width, but its content changes per target step.','cₜ = Σᵢ αₜᵢ hᵢ')
 ]},
 recipe:{title:'Score → normalize → mix. Repeat for the next word.',note:'Hand-chosen two-dimensional states, not trained word meanings. Temperature is an experimental extension; the classical recipe uses T = 1. The mask treats the third row as padding.',steps:[
 beat('Ask with a query','The decoder supplies a vector q. The source bank holds one contextual state per input position. Change the target-step preset to ask a different question.','q ∈ ℝ²; hᵢ ∈ ℝ²'),
 beat('Compare with each source','A score is an unrestricted compatibility number. Here we start with the dot product, then learn two scoring families.','eᵢ = qᵀhᵢ'),
 beat('Predict the mixture','Which positions receive more weight? Will attention copy only the largest-scoring state?','Predict before normalizing.',true),
 beat('Normalize across source positions','Softmax makes nonnegative weights that sum to one for THIS target step. Masked padding receives exactly zero.','αᵢ = exp(eᵢ/T) / Σⱼ exp(eⱼ/T)'),
 beat('Mix all valid states','Multiply every coordinate of each source state by the same scalar weight. Add the resulting vectors, not the word IDs.','c = α₁h₁ + α₂h₂ + α₃h₃'),
 beat('Move to another target step','Read one heatmap row per target step. A bright cell is a large weight, not a verified word correspondence or causal explanation.','Rows: target steps. Columns: source positions.')
 ]},
 additive:{title:'Bahdanau: learn how to compare.',note:'Illustrative scorer: Wq = Wh = identity, b = [0,0], v = [1,−1]. The published architecture uses a bidirectional encoder; its annotations concatenate both directions.',steps:[
 beat('Start with the previous decoder state','In the Bahdanau ordering, the previous decoder state sₜ₋₁ asks which source annotations are useful before the next state is formed.','q = sₜ₋₁'),
 beat('Project into a common space','Separate learned matrices project query and source into the same attention width. Their original widths may differ.','uᵢ = Wq q + Wh hᵢ + b'),
 beat('Predict after adding','The addition is only inside a learned score network. Are these sums already probabilities?','No normalization has happened yet.',true),
 beat('Apply tanh and v','Tanh bends each coordinate; learned v combines them into one real compatibility score for each source position.','eᵢ = vᵀ tanh(uᵢ)'),
 beat('Use the same attention recipe','Normalize the scores across valid source positions, then mix the original encoder annotations. The scoring space is not the value space.','αₜ = softmax(eₜ); cₜ = Σᵢ αₜᵢ hᵢ'),
 beat('Update, then predict','The new context helps form sₜ; a vocabulary head produces next-token probabilities. Attention weights themselves are not vocabulary probabilities.','sₜ = Decoder(sₜ₋₁, Eᵧ(yₜ₋₁), cₜ)')
 ]},
 multiplicative:{title:'Luong: compare by multiplication.',note:'Global attention over all valid source positions. Dot uses no scoring matrix; general uses Wa = [[1,0],[0,2]]. Neither is scaled by √d here.',steps:[
 beat('Update the decoder first','Luong’s ordering first computes the current decoder state from the previous state and previous target input. This state supplies the query.','sₜ = Decoder(sₜ₋₁, Eᵧ(yₜ₋₁)); q = sₜ'),
 beat('Multiply and sum','Dot scoring multiplies matching coordinates and sums. General scoring learns a matrix before the dot product. Toggle the scorer.','dot: eᵢ = qᵀhᵢ; general: eᵢ = qᵀWa hᵢ'),
 beat('Predict a ranking','At q = [1,0], h₁ and h₃ tie under dot scoring. Does the word with the largest score become the next target automatically?','Scores choose source evidence, not a vocabulary item.',true),
 beat('Normalize, then retrieve','The normalization and weighted context are shared with additive attention. The scoring rule has changed, not the retrieval recipe.','αₜ = softmax(eₜ); cₜ = Σᵢ αₜᵢ hᵢ'),
 beat('Combine context and current state','An attentional state joins the retrieved source evidence and the current decoder state. A vocabulary head follows.','s̃ₜ = tanh(Wc [cₜ; sₜ]); p(yₜ) = softmax(Wo s̃ₜ + bo)'),
 beat('Compare the two families','Both are trainable, differentiable ways to read an encoder memory bank. Their familiar forms differ in score function and decoder ordering.','Bahdanau: attend → update. Luong: update → attend.')
 ]}
 };
 if(typeof module!=='undefined'&&module.exports)module.exports=stories;else root.AttentionStories=stories;
})(typeof window!=='undefined'?window:this);
