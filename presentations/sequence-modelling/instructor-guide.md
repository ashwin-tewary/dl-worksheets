# Remember what came before

An introductory lecture on sequential data, RNN unrolling and long-term dependencies.

Open [the worksheet](index.html), [the six SVG figures](assets/gallery.html), [the printable student handout](student-handout.html), or [the animation storyboard](storyboard-guide.md).

## Before class

Assume students have seen a dense layer, a matrix–vector product, an activation and the basic chain rule. Briefly recall those ideas when necessary; this is their first sequence-modelling lesson. No programming, framework, training run or model download is required.

Serve the repository root with `python3 -m http.server 8000`, then open `/presentations/sequence-modelling/`. The portable bundle also works by opening `worksheet/index.html` directly. All CSS, JavaScript and images are local. Browser storage can differ across origins or be unavailable under restrictive settings; answer export remains available. Open the page before class and check projection legibility. The SVG viewports scroll horizontally on phones to preserve numeral sizes.

Use Play for the guided route. The player automatically stops at a prediction checkpoint; Continue resumes it. Back/Next, replay, speed and scrubbing support instructor pacing. A player pauses when it leaves view or the tab is hidden. Reduced-motion mode uses discrete frames. “Download SVG frame” exports the current visual; the gallery contains stable reference frames.

## The intention and suspense

Start with the word **ORCHID**. Ask students to read it, then press Hide. Do not ask them to rehearse it deliberately. Promise to return to it at the end. This is a conversation hook, not an experiment equating human and RNN memory.

The lecture answers three nested questions:

1. What disappears if we ignore order?
2. How can one learned rule process a varying number of observations?
3. Does a path from the past guarantee that we can learn a distant dependency?

The opening bridge is parameter sharing: a CNN shares a detector over spatial positions; an RNN shares a state-update rule over time. Avoid implying that RNNs are the only way to model sequences.

## Timing

| Segment | Minutes | Core action |
|---|---:|---|
| Intention and memory challenge | 5 | Hide ORCHID; gather predictions about distant evidence. |
| 01: Order is information | 12 | Reverse the numerical frames; compare the unchanged mean. |
| 02: Inputs and targets | 12 | Switch output tasks and audit the available prefix. |
| 03: A running state | 16 | Trace three scalar updates; distinguish state from weights. |
| 04: Unroll the RNN | 18 | Change T and H; reverse the training arrows. |
| 05: Distant dependencies | 17 | Compare decay, growth and saturation on the same recurrence. |
| Exit synthesis | 5 | Design the sensor model, recall the word, motivate gates. |
| **Total** | **85** | |

For 60 minutes: 4 / 8 / 8 / 12 / 12 / 12 / 4. Keep the folds closed; assign questions 1.3, 2.3, 3.3 and the extended remedy table for revision. For 90 minutes, use the extra five for the numerical matrix update or exit experiment design.

## 01 — Order is information

**Hook:** “dog bites person” versus “person bites dog”. The same items can have different meaning in different orders.

**Mechanism:** The video uses three 3×3 binary frames. Their centre rows are [1,0,0], [0,1,0], [0,0,1]. Reverse the order to reverse direction. The average centre row is [⅓,⅓,⅓] either way; the other rows remain zero.

**Prediction pause:** Which properties change, and which remain? Expected: direction changes; the frame set and mean remain. Ask why a downstream classifier cannot recover direction from an identical summary.

**Analogy:** A bag of musical notes versus a melody. Clarify that some targets are intentionally order-invariant.

**Misconception to catch:** Flattening is not automatically the same as ignoring order. An ordered-window MLP can distinguish positions. Temporal CNNs can process sequences too. Recurrence is an architectural choice.

**Transition:** Once we preserve order, we still need to specify what should be predicted and when.

## 02 — Inputs and targets

**Hook:** One input, “not very good”, supports several tasks.

**Mechanism:** Switch among a final review label, aligned token tags and shifted next-token targets. The supplied tags are ADV, ADV, ADJ. These are teaching labels, not model predictions. In the next-token view, the targets are very, good, EOS.

**Encoding:** The displayed input vocabulary [not, very, good] has dimension d = 3. Explain that one-hot coordinates identify categories; token IDs are not meaningful magnitudes. EOS is an additional target category in the toy. Real language models generally put their special tokens in a unified vocabulary.

**Prediction pause:** After “very”, the next-token target is “good”. It has not been supplied as part of the prefix to that prediction. Contrast live prediction with offline tagging.

**Practical intuition in the fold:** Distinguish batch size, time length and feature width. Padding loss masks and valid-state selection serve different purposes. Future leakage can happen during preprocessing as well as inside a model.

**Transition:** What information does the prefix leave behind?

## 03 — A running state

**Hook:** Two sequences end “The code is ___”, but their earlier instructions say 7 and 9. Current input alone cannot distinguish them.

**Mechanism:** hₜ = tanh(Wₓxₜ + Wₕhₜ₋₁ + bₕ), followed by a readout. Use the running-notebook analogy, while emphasizing that the trained representation is distributed and not a literal text summary.

**Set the checkpoint example deliberately:** Choose Linear, w = 0.5, h₀ = 0 and inputs [1,0,1]. The state sequence is [1,0.5,1.25]. At x₂ = 0, earlier evidence still contributes.

Restore Tanh at w = 0.5: states are approximately [0.761594, 0.363399, 0.827987]. Input weights are 1 and biases 0 in this one-dimensional demonstration. Setting w = 0 removes dependence on the previous state.

**Optional matrix calculation:** Wₓ = [[1,0,−1],[0,1,1]], Wₕ = [[0.5,0],[0,0.5]], x = [1,0,0]ᵀ, previous state [0.2,−0.1]ᵀ. The new pre-activation is [1.1,−0.05]ᵀ; tanh gives approximately [0.800499,−0.049958]ᵀ.

**Misconception to catch:** State changes at inference; weights change when training updates them. Reset state between independent examples. Detaching a training graph and resetting a numerical state are different operations.

**Transition:** The feedback loop is compact, but it conceals the order of operations.

## 04 — Unrolling

**Hook:** Does twice the sentence length need twice as many networks?

**Mechanism:** Expand the recurrent loop. Every drawn cell is an application of the same function with shared θ. States and inputs differ. Time steps are not stacked layers.

**Parameter arithmetic:** d = 3, H = 2, C = 2 gives 6 + 4 + 2 + 4 + 2 = 18. T = 4, 8 or 100 all use the same 18 parameters. At H = 4, the count is 12 + 16 + 4 + 8 + 2 = 42. This includes the output head and both biases; the initial state is fixed.

**Prediction pause:** Separate parameter count from cell evaluations. Standard full BPTT usually stores activations across the unroll; do not claim constant training memory just because parameters are shared.

**Backward pass:** Show the coral arrows. They carry training derivatives, not future observations to the causal inference model. Contributions to the same parameter add. Within a single path, local derivatives multiply. Use Q4.3 to distinguish those operations.

**Transition:** Unrolling reveals exactly how long the route from a late error to an early computation can become.

## 05 — Long-term dependencies

**Hook:** The singular “key” controls “is”, despite nearby plural distractors. “Long” refers to intervening processing steps, not a universal forgetting threshold.

**Two demonstrations, same controls:** First watch the state carry a clue through zero-input updates. Then follow a unit sensitivity backward. Both use h₀ = 1 and the same selected length, weight and activation.

| Preset | Rule, 20 links | Final state | ∂h₂₀/∂h₀ |
|---|---|---:|---:|
| Decay | Linear, w = 0.8 | 0.011529 | 0.011529 |
| Growth | Linear, w = 1.2 | 38.337600 | 38.337600 |
| Saturation | Tanh, w = 1.3 | 0.752059 | 0.00000405243 |

The linear state and sensitivity happen to coincide because h₀ = 1 and all inputs are zero. This is a property of this controlled example, not a general identity. The tanh case separates them.

**Prediction pause:** Students often add 20 × 0.8. Ask them to trace two links first, then generalize the repeated multiplication.

**Precision:** The logarithmic plot shows a unit-seeded state sensitivity, not the full parameter gradient. It multiplies local derivatives in backward traversal order. For tanh, each derivative is w(1 − hₜ²); w greater than 1 alone does not diagnose explosion. A small state is not automatically a lost bit: sign can persist.

**Remedies:** Clipping is a brake on large gradients. The animation supplies separate parameter-gradient examples g = 38 and g = 0.0115; at threshold 5 these become 5 and 0.0115. These are given example parameter gradients, not the computed state sensitivity. Clipping accumulated parameter gradients does not retroactively change the sensitivity path. Truncated BPTT limits credit assignment even when numerical states carry across chunks. LSTM/GRU gates create ways to retain information. Attention can provide shorter connections. These are motivations for later lessons, not fully taught mechanisms here.

**Do not infer vanishing gradients from poor accuracy alone.** Check representation, data coverage, labels and preprocessing as well.

## Exit discussion

The sensor task needs order. A sensible design reads per-minute features and emits a binary decision after the last valid input, retaining whether an early warning has occurred and whether it has been followed by a fault. An explicit finite-state baseline is a useful comparator.

Ask students to name two reasons that increasing the gap might reduce performance, then propose a controlled experiment. Good answers vary the gap while holding other evidence constant, inspect gradient magnitudes over time, verify target alignment, and compare models or a simple event-state baseline.

Return to **ORCHID**. Invite a discussion of rehearsal, retrieval cues and human memory without equating them to a scalar RNN. End with: “Can a network learn when to leave the notebook alone?”

## Reading

- [Dive into Deep Learning — RNNs](https://d2l.ai/chapter_recurrent-neural-networks/rnn.html): recurrence and shared parameters.
- [Dive into Deep Learning — BPTT](https://d2l.ai/chapter_recurrent-neural-networks/bptt.html): the unrolled training graph.
- [Pascanu et al., 2013](https://proceedings.mlr.press/v28/pascanu13.html): gradient propagation and clipping.

## Worked answers

The complete worksheet questions and their reasoning follow, generated from the same prompts as the student page.

<!-- GENERATED ANSWERS -->

### 1.1 / CALCULATE

Average the centre rows [1,0,0], [0,1,0], [0,0,1]. What is the first cell of the mean row? A fraction is fine.

(1 + 0 + 0) / 3 = ⅓ ≈ 0.333. Reversing the frame order cannot change this average.

### 1.2 / REASON

Which representation necessarily loses the distinction between our two directions?

The time-averaged image is identical. Ordered frames preserve the trajectory, even if a model might fail to use it.

### 1.3 / CHALLENGE THE CLAIM

“Only RNNs can learn order.” Could an MLP on a fixed, ordered window distinguish [1,0] from [0,1]?

Yes. The positions are different inputs to the MLP. Recurrence provides parameter sharing and a way to process varying sequence lengths; it is not the only way to use order.

### 2.1 / ENCODE

Our input vocabulary is [not, very, good]. How many coordinates does each one-hot input vector have?

3 coordinates. This is d, the input feature dimension. The number of tokens in another sentence can change without changing this vocabulary dimension.

### 2.2 / ALIGN

For next-token training on “not very good”, the model has just read “very”. What is its target?

The target is “good”. Predicting “very” from an input that already includes “very” is a different and potentially trivial alignment. “negative” belongs to the review-label task.

### 2.3 / AUDIT

At noon, a live forecast predicts the 1 pm temperature. May the input include the actual 1 pm measurement?

No. That observation is unavailable at noon. Using it would leak future information and make the evaluation unlike real use.

### 3.1 / CALCULATE

For the linear toy hₜ = xₜ + 0.5hₜ₋₁, h₀ = 0 and inputs [1,0,1], what is h₂?

h₁ = 1 + 0.5 × 0 = 1. h₂ = 0 + 0.5 × 1 = 0.5. A zero input does not erase an existing state. Next, h₃ = 1 + 0.5 × 0.5 = 1.25.

### 3.2 / DISTINGUISH

During an ordinary inference pass, which can change from one time step to the next?

The hidden state changes. The weights are reused; they change when we perform training updates, not just because a new input arrives.

### 3.3 / ADD THE NONLINEARITY

Using tanh, h₀ = 0, x₁ = 1, input weight 1, recurrent weight 0.5 and bias 0, what is h₁ to three decimals?

h₁ = tanh(1) ≈ 0.762. The next states are about 0.363 and 0.828. Keep unrounded intermediate values when calculating.

### 4.1 / COUNT

For d = 3, H = 2 and C = 2, how many parameters are in the recurrent layer plus output head, including biases?

2×3 + 2×2 + 2 + 2×2 + 2 = 18. The recurrent matrix is counted once because it is shared.

### 4.2 / CHANGE LENGTH

The same model now reads T = 100 steps instead of T = 4. How many trainable parameters does it have?

Still 18. There are now 100 cell evaluations; compute and usual full-BPTT activation storage grow with the unroll.

### 4.3 / FOLLOW CREDIT

Two time steps contribute gradients 0.2 and 0.3 to the same weight, with the loss scaling already included. What gradient updates that weight?

Add them: 0.2 + 0.3 = 0.5. Along a single dependency path, the chain rule multiplies local derivatives. At shared-parameter uses, the resulting contributions add. Both operations occur in BPTT.

### 5.1 / CALCULATE

For 20 linear recurrent links with derivative 0.8 each, what fraction of a unit sensitivity reaches the beginning? Give a decimal.

0.8²⁰ ≈ 0.011529, or about 1.15% of the unit seed. It is not 20 × 0.8. The chain rule multiplies along the path.

### 5.2 / CHOOSE A REMEDY

Can clipping a gradient of 0.0115 at threshold 5 restore it to 1?

No. It stays 0.0115. Clipping reduces gradients larger than the threshold; it does not amplify smaller ones.

### 5.3 / EXPLAIN THE SURPRISE

With tanh and w = 1.3, why can the returning sensitivity still become small?

tanh saturation makes 1 − hₜ² small. Multiplying those factors with w at each step can yield a small total derivative even when w is above 1. The full path matters.
