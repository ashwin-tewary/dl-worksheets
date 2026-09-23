# Gated RNNs · planned animation storyboards

Each animation follows a fixed narrative. Controls: play/pause, back/next, replay, speed, scrub, beat selection and SVG export. Beat 4 pauses before calculation results; Continue resumes. Reduced-motion users get stable steps. No animation autoplays on page load.

## 1. One clue. Many transformations.

Follow a state through time, then ask how an earlier input can affect a later decision.

Scalar RNN: h₀ = 0, input weight 1, bias 0. The four supplied inputs are [1, 0, 0, −1]. This is an arithmetic demonstration, not a trained language model.

1. **Read one input.** The same recurrent cell will read four inputs in order. xₜ is new evidence; hₜ₋₁ is the summary carried from the past.
2. **Write the first state.** Input 1 becomes tanh(1) ≈ 0.762. The state is a number here, and a vector in a real network. Rule: h₁ = tanh(1 + w × 0)
3. **Carry through a zero.** Zero input does not freeze the state. The recurrent transformation still acts. Rule: h₂ = tanh(w h₁)
4. **Predict the next memory — PREDICTION PAUSE.** At w = 0.5, will another zero keep h₃ equal to h₂? Explain before continuing. Rule: Same input value does not imply the same hidden state.
5. **Watch the clue change.** Each repeated transformation changes the old clue. Reducing the recurrent weight makes this route shrink more quickly.
6. **Read conflicting evidence.** The final input is −1. The same state must now mix an old clue with new evidence. We would like a learned way to keep, write or expose information selectively. Rule: hₜ = tanh(Wₓxₜ + Wₕhₜ₋₁ + b)

## 2. Keep. Write. Reveal.

Build a cell-state update one operation at a time; the two state outputs are different.

One coordinate of a modern LSTM with forget gate, without peepholes or projection. Gate outputs are manually supplied to isolate the mechanism. Real gates are vectors computed from xₜ and hₜ₋₁. Boundary values 0 and 1 are idealized limits.

1. **Bring two kinds of state.** The cell state c carries stored content. The hidden state h carries the exposed output. At this step cₜ₋₁ = 0.8.
2. **Keep a fraction.** The forget gate multiplies old memory. With f = 0.75, the retained contribution is 0.6. Rule: retained = fₜ ⊙ cₜ₋₁
3. **Prepare a signed proposal.** The candidate g proposes new content; tanh allows negative as well as positive values. The input gate scales how much is written. Rule: write = iₜ ⊙ gₜ
4. **Predict the new cell — PREDICTION PAUSE.** At the default settings, combine 0.75 × 0.8 and 0.5 × 0.4. Then predict what output gate 0 would do to c and h. Rule: cₜ = retained + write
5. **Add into memory.** The two contributions meet by addition. The new cell state is stored for the next time step. Unlike the hidden state, it is not bounded by tanh. Rule: cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ gₜ
6. **Expose only what is needed.** Apply tanh to stored memory and multiply by the output gate. Closing this gate hides the current output without deleting the stored cell state. Rule: hₜ = oₜ ⊙ tanh(cₜ)
7. **Try an intervention.** Set output to 0, then forget to 1 and input to 0. Track which state changes. These controls set gate outputs; training learns how to produce them.

## 3. Build a route for credit.

Compare repeated multiplication on two isolated paths. The plot uses a logarithmic scale.

Controlled experiment: all write terms are zero, c₀ = h₀ = 1. The RNN comparison is linear with multiplier 0.8. LSTM gates are held constant, so the direct cell-state path has derivative fᴸ. This is not the full recurrent Jacobian or an accuracy measurement.

1. **Start with sensitivity one.** A small change to the initial state has size 1 at the start. Trace how much of it survives along a chosen path.
2. **Cross one recurrent link.** The linear RNN multiplies by 0.8. The LSTM direct memory edge multiplies by the forget gate f. Rule: RNN edge: 0.8 · direct LSTM edge: f
3. **Cross five links.** The chain rule multiplies local derivatives. A value near 1 can preserve more of this route over many steps.
4. **Predict twenty links — PREDICTION PAUSE.** Compare 0.8²⁰ with 0.95²⁰. Is a forget gate near 1 a promise that every LSTM gradient will survive? Rule: Make a numerical prediction and a caveat.
5. **Measure the two paths.** At 20 links and f = 0.95, the two sensitivities are about 0.0115 and 0.3585. Change f and length to see the exponential effect. Rule: Direct cell path = ∏ fₜ; constant f gives fᴸ
6. **Keep the caveat.** Gates depend on the input and hidden state. Other gradient routes, saturation, and the readout also matter. LSTMs help with long dependencies; they do not guarantee perfect recall.

## 4. One state. Two gates.

First shape the candidate with reset, then blend it with the previous state.

Scalar reset-before-matrix GRU: x = 0.2, hₜ₋₁ = 0.8, input/recurrent weights 1 and bias 0. Here z is the fraction of OLD state retained. Some references swap z and 1 − z; some frameworks place reset after the recurrent projection.

1. **Start with one state.** GRU has no separate cell-state vector c. The previous hidden state supplies both carried memory and material for a candidate.
2. **Reset the candidate route.** The reset gate r scales old state only on the candidate branch. r = 0 makes the candidate ignore the previous state. Rule: candidate = tanh(x + r hₜ₋₁)
3. **Make a candidate.** Combine the reset-filtered state with the input, then apply tanh. The separate carry route is still available.
4. **Predict the update — PREDICTION PAUSE.** Using the displayed settings, predict the new state from the old-state contribution and the candidate contribution. After the reveal, test r = 0 and z = 1 with the preset. Rule: Reset affects the proposal; update chooses the blend.
5. **Blend old and proposed.** z retains old state and 1 − z admits the candidate. At z = 1 the state is retained; at z = 0 it is fully replaced by the candidate. Rule: hₜ = zₜ ⊙ hₜ₋₁ + (1 − zₜ) ⊙ h̃ₜ
6. **Compare the trade-off.** A GRU uses three affine transforms; an LSTM uses four. Fewer parameters at equal hidden width does not establish a universal accuracy or speed winner.

## 5. Read both ways. Meet at the same word.

Finish the two passes, align their states, then concatenate at “bank”.

The sentences motivate ambiguity; the numbers are a supplied toy encoding, not learned semantics. x = [0, 0, 0, 0, ±1], scalar tanh cells, recurrent weight 0.5, zero boundary states. The two directions use separate parameter sets (chosen equal here for simplicity).

1. **An unfinished sentence.** After “the bank”, later context is still unavailable in a live stream. Many interpretations remain possible.
2. **Read left to right.** The forward state at bank sees only the prefix through bank. Changing later words cannot change this forward state.
3. **Read right to left.** With a completed sentence, a second recurrent network starts at the last word. Watch its states arrive in reverse order.
4. **Predict the alignment — PREDICTION PAUSE.** To label bank at position 2, should we pair its forward state with the backward state at bank, or with the last word? Rule: Match original token positions, not processing order.
5. **Join the two views.** Concatenate forward and backward states at the SAME position. H numbers in each direction give 2H features for the readout. Rule: uₜ = [h→ₜ ; h←ₜ]
6. **Enforce the information boundary.** Switch to live-prefix mode. Unseen suffix inputs and backward states disappear. A bidirectional encoder of a completed input is valid; using the unknown next-token target as input is leakage.

