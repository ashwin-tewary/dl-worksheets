# Animation storyboards

Six beats per lesson. Beat 3 is an automatic prediction stop; Continue reveals the next operation. No autoplay on page load. Play/pause, back, next, replay, speed, scrub and SVG download are available in every player. Reduced motion advances stable steps.

## One reader. One writer. Different clocks.

Translation and outputs are scripted illustrations. Encoder values use the scalar recurrence shown; decoder states and vocabulary probabilities are conceptual.

1. **Read the source.** Each input token becomes a vector. A shared encoder cell updates its state; it has not produced a target token yet.
   Formula: hᵢ = Encoder(hᵢ₋₁, Eₓ(xᵢ))

2. **Carry the summary.** Follow the state through all three source positions. The final state summarizes the source in this baseline.
   Formula: c = h₃; s₀ = bridge(c)

3. **Predict the first input — PREDICTION STOP.** The source is finished. There is no previous translated word. What should the decoder receive first?
   Formula: Predict before continuing.

4. **Begin with BOS.** A special beginning-of-sequence token starts generation. The training illustration predicts je; inference mode illustrates a scripted first error, tu.
   Formula: BOS → decoder → first target prediction

5. **Feed the previous token.** Training can feed the correct previous target (teacher forcing). Inference feeds the model’s previous prediction. Toggle the mode and watch the changed input.
   Formula: p(y | x) = ∏ₜ p(yₜ | y<ₜ, x)

6. **Stop on EOS.** The decoder can produce a different number of tokens from the source. EOS marks completion; a maximum length is a practical fallback.
   Formula: je → t’aime → EOS

## A longer story. The same size notebook.

This is a scalar sensitivity experiment, not a word-capacity or translation-accuracy model. Width stays one; retention changes repeated state updates.

1. **Plant an early clue.** Compare sequences that differ only at the first scalar input: +1 versus −1. Later inputs are all zero.
   Formula: hᵢ = tanh(xᵢ + r hᵢ₋₁)

2. **Pass through more updates.** The initial difference passes through each recurrent update. Increase the sequence length and inspect both final states.
   Formula: Δ = |hₙ(+1) − hₙ(−1)|

3. **Predict the difference — PREDICTION STOP.** Will the final states be easier or harder to distinguish after more steps? Does a wider vector have a literal word limit?
   Formula: Make a prediction; then reveal.

4. **Inspect the final summary.** For this recurrence, the difference often shrinks. This illustrates a mechanism that can make early details hard to recover; it does not prove every RNN forgets.
   Formula: A fixed-width representation must serve every output step.

5. **Keep the intermediate notes.** Instead of exposing only hₙ, retain h₁ … hₙ. Give the decoder a route back to the source positions.
   Formula: Memory bank H = [h₁, …, hₙ]

6. **Ask a fresh question each time.** A different decoder query can retrieve a different weighted mixture. The retrieved context is still fixed-width, but its content changes per target step.
   Formula: cₜ = Σᵢ αₜᵢ hᵢ

## Score → normalize → mix. Repeat for the next word.

Hand-chosen two-dimensional states, not trained word meanings. Temperature is an experimental extension; the classical recipe uses T = 1. The mask treats the third row as padding.

1. **Ask with a query.** The decoder supplies a vector q. The source bank holds one contextual state per input position. Change the target-step preset to ask a different question.
   Formula: q ∈ ℝ²; hᵢ ∈ ℝ²

2. **Compare with each source.** A score is an unrestricted compatibility number. Here we start with the dot product, then learn two scoring families.
   Formula: eᵢ = qᵀhᵢ

3. **Predict the mixture — PREDICTION STOP.** Which positions receive more weight? Will attention copy only the largest-scoring state?
   Formula: Predict before normalizing.

4. **Normalize across source positions.** Softmax makes nonnegative weights that sum to one for THIS target step. Masked padding receives exactly zero.
   Formula: αᵢ = exp(eᵢ/T) / Σⱼ exp(eⱼ/T)

5. **Mix all valid states.** Multiply every coordinate of each source state by the same scalar weight. Add the resulting vectors, not the word IDs.
   Formula: c = α₁h₁ + α₂h₂ + α₃h₃

6. **Move to another target step.** Read one heatmap row per target step. A bright cell is a large weight, not a verified word correspondence or causal explanation.
   Formula: Rows: target steps. Columns: source positions.

## Bahdanau: learn how to compare.

Illustrative scorer: Wq = Wh = identity, b = [0,0], v = [1,−1]. The published architecture uses a bidirectional encoder; its annotations concatenate both directions.

1. **Start with the previous decoder state.** In the Bahdanau ordering, the previous decoder state sₜ₋₁ asks which source annotations are useful before the next state is formed.
   Formula: q = sₜ₋₁

2. **Project into a common space.** Separate learned matrices project query and source into the same attention width. Their original widths may differ.
   Formula: uᵢ = Wq q + Wh hᵢ + b

3. **Predict after adding — PREDICTION STOP.** The addition is only inside a learned score network. Are these sums already probabilities?
   Formula: No normalization has happened yet.

4. **Apply tanh and v.** Tanh bends each coordinate; learned v combines them into one real compatibility score for each source position.
   Formula: eᵢ = vᵀ tanh(uᵢ)

5. **Use the same attention recipe.** Normalize the scores across valid source positions, then mix the original encoder annotations. The scoring space is not the value space.
   Formula: αₜ = softmax(eₜ); cₜ = Σᵢ αₜᵢ hᵢ

6. **Update, then predict.** The new context helps form sₜ; a vocabulary head produces next-token probabilities. Attention weights themselves are not vocabulary probabilities.
   Formula: sₜ = Decoder(sₜ₋₁, Eᵧ(yₜ₋₁), cₜ)

## Luong: compare by multiplication.

Global attention over all valid source positions. Dot uses no scoring matrix; general uses Wa = [[1,0],[0,2]]. Neither is scaled by √d here.

1. **Update the decoder first.** Luong’s ordering first computes the current decoder state from the previous state and previous target input. This state supplies the query.
   Formula: sₜ = Decoder(sₜ₋₁, Eᵧ(yₜ₋₁)); q = sₜ

2. **Multiply and sum.** Dot scoring multiplies matching coordinates and sums. General scoring learns a matrix before the dot product. Toggle the scorer.
   Formula: dot: eᵢ = qᵀhᵢ; general: eᵢ = qᵀWa hᵢ

3. **Predict a ranking — PREDICTION STOP.** At q = [1,0], h₁ and h₃ tie under dot scoring. Does the word with the largest score become the next target automatically?
   Formula: Scores choose source evidence, not a vocabulary item.

4. **Normalize, then retrieve.** The normalization and weighted context are shared with additive attention. The scoring rule has changed, not the retrieval recipe.
   Formula: αₜ = softmax(eₜ); cₜ = Σᵢ αₜᵢ hᵢ

5. **Combine context and current state.** An attentional state joins the retrieved source evidence and the current decoder state. A vocabulary head follows.
   Formula: s̃ₜ = tanh(Wc [cₜ; sₜ]); p(yₜ) = softmax(Wo s̃ₜ + bo)

6. **Compare the two families.** Both are trainable, differentiable ways to read an encoder memory bank. Their familiar forms differ in score function and decoder ordering.
   Formula: Bahdanau: attend → update. Luong: update → attend.
