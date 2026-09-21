# Sequence modelling — animation storyboard guide

Six teaching sequences. Each is embedded at its point of need in the [worksheet](index.html). Play stops automatically at the prediction checkpoint. Gather answers before choosing Continue. Back, Next, Replay, speed, scrub and SVG export are available. Reduced motion uses stable steps. Only one player runs at a time, and it pauses when offscreen or when the document is hidden.

Defaults are the reference examples below. Changing a control updates the diagram and numeric readout. Prediction prompts that specify numbers use their stated reference values; set those controls before posing that question. The two long-dependency players share settings.

## A film is more than its frames.

Reverse the journey. Keep every pixel. Watch the meaning change.

**Assumptions:** Synthetic 3 × 3 binary images. The bright pixel is 1; all other pixels are 0. Averaging is an example of an order-blind summary, not a property of all CNNs.

### 1. Meet the frames

One bright dot appears at three different positions. Every cell is numbered so we can track exactly what moves.

### 2. Read the first frame

At t = 1, you see a position. One image alone does not tell you the direction of motion.

### 3. Read in time order

The second frame supplies a change. Order turns positions into a journey. The moving marker traces the temporal connection.

### 4. Predict the reversal — STOP FOR PREDICTIONS

Before revealing the answer: if we reverse all three frames, which properties stay the same? Which one changes?

Calculation / board note: Same values + different order = ?

### 5. Reveal the journey

All three images are unchanged, but the direction reverses. Use “Reverse order” to compare the two journeys.

### 6. Lose the order

The time average is identical in both directions. Once an order-blind summary merges the two sequences, a downstream classifier cannot reconstruct their direction from that summary alone.

Calculation / board note: Mean centre row = [⅓, ⅓, ⅓] in either direction

## What should come out—and when?

One input stream can support three different prediction tasks.

**Assumptions:** Tokens and one-hot vectors are hand-written examples. Output labels are supplied teaching targets, not predictions from a trained language model. EOS marks the end of a sequence.

### 1. Name the task

First decide what you need to predict. A sequence label, a tag for each token and the next token require different target alignments.

### 2. Encode one token

A token becomes a vector before it enters the network. Here the vocabulary is [not, very, good]; the first input is [1, 0, 0].

Calculation / board note: Token IDs name categories; their numerical size is not meaning.

### 3. Keep the prefix honest

A causal model can use only the tokens already read. A faded future token belongs to the example but is not available to this prediction.

### 4. Predict the output positions — STOP FOR PREDICTIONS

Choose a task. Should an output appear at every step, or only after the final word? For next-token training, which token is the target after “very”?

Calculation / board note: Write down the input → target alignment.

### 5. Align the targets

A review label follows the final state. Token tags align with their input token. Next-token targets are shifted one place left: very, good, EOS.

### 6. Change the question

Switch the task and compare the output locations. The recurrent state update can stay the same while the readout and training targets change.

Calculation / board note: Sequence label: ŷ = g(hT) · token outputs: ŷt = g(ht)

## Read. Combine. Update.

Inspect the arithmetic inside one recurrent cell before expanding it through time.

**Assumptions:** A one-dimensional teaching RNN with input weight 1, recurrent weight w, bias 0 and h₀ = 0. The values are chosen, not learned. Tanh is the default; linear mode removes tanh for hand calculation.

### 1. Start with a clean notebook

Before reading anything, set h₀ = 0. This is the initial state, not a trainable weight in our example.

### 2. Bring in the new evidence

Read the current input xₜ. The earlier inputs are represented only through the previous state.

### 3. Combine old and new

Multiply the previous state by w, then add xₜ. This produces the pre-activation zₜ. In a full RNN these multiplications use matrices.

Calculation / board note: zₜ = xₜ + w hₜ₋₁

### 4. Predict before updating — STOP FOR PREDICTIONS

With linear mode, w = 0.5 and inputs [1, 0, 1], what will h₂ be? Does zero input force the state back to zero?

Calculation / board note: Use h₁ = 1; calculate h₂ before continuing.

### 5. Write the first state

Apply the chosen activation. Tanh keeps the state between −1 and 1; linear mode leaves z unchanged. The result is passed to the next step.

### 6. Zero input, nonzero memory

At the second step, x₂ = 0. The recurrent contribution can still be nonzero. Change w to 0 to remove that route from the past.

### 7. Read the third input

The last state depends on both the new input and the state carried forward. A state is a learned summary in a trained network; it is not a literal transcript.

Calculation / board note: Compare tanh and linear mode in the numeric trace below.

## One cell. Many uses.

Unfold the loop into a computation you can follow from left to right.

**Assumptions:** One recurrent layer, column-vector notation, input dimension d = 3 and output dimension C = 2. We count all weights and biases, including the output head; h₀ is fixed. Drawn time steps are not stacked recurrent layers.

### 1. A loop hides the schedule

The compact diagram says “reuse this cell”. Its loop does not show which state existed first.

### 2. Make two uses visible

Unrolling draws two applications of the same function. h₁ feeds h₂. The drawings share parameters, but their state values can differ.

### 3. Extend the time axis

Continue for T inputs. The same parameter bank is connected to every use. Each new step adds computation and a new state.

### 4. Predict the parameter count — STOP FOR PREDICTIONS

With d = 3, H = 2 and C = 2, we have 18 parameters. If T doubles, what happens to this count? What happens to the number of cell evaluations?

Calculation / board note: Parameters versus computation: make two predictions.

### 5. Finish the forward pass

A sequence-level loss can be attached to the final readout. Earlier states can influence it through the recurrent arrows.

### 6. Send credit backward

During training, the loss sends derivatives backward through the unrolled graph. This is backpropagation through time. Backward credit is not future information at inference.

### 7. Add into the same bank

Because every time step uses the same parameters, their gradient contributions accumulate into one update. Change T and H to separate time length from hidden width.

Calculation / board note: P = Hd + H² + H + CH + C

## Carry one clue through the gap.

Keep the first clue fixed. Add neutral steps. Measure its surviving influence.

**Assumptions:** Controlled scalar experiment: h₀ = +1, all subsequent inputs are 0. Neutral here means zero external input, not that the recurrent update stops. Magnitude is not classification accuracy; a small positive value still has a positive sign.

### 1. Plant the clue

Imagine the first word determines an answer much later. We isolate that clue as a scalar state h₀ = +1.

### 2. Insert a neutral step

No new evidence arrives: x = 0. Nevertheless, the recurrent transformation still changes the state.

### 3. Widen the gap

Every extra step inserts another transformation between the clue and the answer. The state width stays fixed.

### 4. Predict the effect — STOP FOR PREDICTIONS

In linear mode with w = 0.8, is the clue multiplied by 0.8 once or once per link? Predict the size after 20 links.

Calculation / board note: h₂₀ = 0.8²⁰ × h₀

### 5. Measure the state

The ending value is a forward quantity. Smaller magnitude can make a signal more fragile, but this display alone does not establish prediction failure.

### 6. Ask the learning question

Remembering a clue during a forward pass and learning to preserve it are connected but different questions. Next, send a unit sensitivity backward through these very same operations.

Calculation / board note: How much would the final state change if h₀ changed slightly?

## Can the correction reach the beginning?

Follow a unit sensitivity backward, multiplying one local derivative at a time.

**Assumptions:** We measure ∂hL/∂h₀ with inputs held fixed and seed ∂hL/∂hL = 1. This is one path of the chain rule, not the complete parameter gradient. The vertical axis is logarithmic so small and large magnitudes remain visible.

### 1. Seed the final sensitivity

Start at the final state with sensitivity 1. A loss would supply an additional derivative; here we isolate the recurrent path.

### 2. Cross one link backward

Multiply by the derivative of the last recurrent update. For a linear cell this is w. For tanh it is w(1 − hₜ²).

Calculation / board note: Jₜ = ∂hₜ/∂hₜ₋₁

### 3. Cross several links

The chain rule multiplies these local derivatives. Repeated factors below one shrink the result; repeated factors above one can grow it.

### 4. Predict before the reveal — STOP FOR PREDICTIONS

With 20 linear links, compare w = 0.8 and w = 1.2. Will doubling a clipping threshold bring back a vanished signal?

Calculation / board note: g₀ = J₁ J₂ … JL × 1

### 5. Read the returning signal

Try the Decay and Growth presets. Keep the displayed magnitude separate from model accuracy. The identity line at 1 is a reference, not a pass/fail threshold.

### 6. Test the tanh surprise

Try Saturation: w = 1.3 with tanh. The state can stay appreciable while the gradient becomes small. A weight above 1 alone does not prove explosion.

Calculation / board note: The derivative depends on both the weight and the activation.

### 7. Match the remedy to the problem

Clipping caps a large gradient without enlarging a small one. Truncation limits the training path. Gated memory creates paths that can preserve derivatives; it does not guarantee perfect recall.

## Presenter routine

1. Read the hook before touching the controls.
2. Let students predict individually, then compare with a neighbour.
3. Reveal one step; ask someone to narrate the arithmetic.
4. Change one control and ask which quantity should stay invariant.
5. Use a worked answer only after a student explains their reasoning.

For a 60-minute route, use the 85-minute guide's suggested cuts; do not omit the distinction between state, weight and gradient.
