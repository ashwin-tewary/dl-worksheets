# Animated teaching sequences

Use the [lecture presentation sheet](index.html). The guided animations are embedded in their corresponding learning sections. Each scene starts paused. **Play** animates a transition, leaves reading time, and stops automatically at the prediction beat. **Continue** reveals the next mechanism. **Next / Back**, **Replay**, speed, direct beat buttons, and the timeline give manual control. **Download frame** saves the currently visible SVG for a slide.

At 1×, ordinary transitions take 1.4 seconds and ordinary beats dwell for 4.6 seconds. Pixel flips take 4.2 seconds so students can follow the values; patch separation and token formation take 2.2 and 2.6 seconds. Prediction beats wait indefinitely for the instructor. Reduced motion uses stable manual steps. Starting a player pauses the others; leaving a scene or hiding the tab pauses it.

## Borrow the eyes. Replace the dictionary.

Follow the same learned filters into a new task.

Architecture diagram; the small filter values illustrate reused weights, not an extracted ResNet checkpoint.

### 01 · Start with a source task

A pretrained CNN has already learned filters. Its original head turns those features into scores for 1,000 source labels.

**Board calculation:** Image → learned backbone → 1,000 source scores

### 02 · Keep the learned numbers

Look at the numbered filter inside the backbone. Reusing a checkpoint means carrying learned parameter values forward.

**Board calculation:** The same θ* will initialize the target backbone.

### 03 · A new task arrives — prediction pause

Our 120 leaf images have three species labels. The existing visual vocabulary may help, but the old label dictionary does not answer this task. Predict: which part should we replace?

**Board calculation:** PREDICT · Keep the backbone, the head, or both?

### 04 · Detach the old head

The 1,000-class head leaves the pipeline. Watch what stays: the learned filter values are unchanged.

**Board calculation:** Remove 512 × 1,000 + 1,000 = 513,000 head parameters.

### 05 · Attach a new three-class head

A new head arrives with three outputs. It starts without knowledge of the leaf labels and must be trained.

**Board calculation:** New head: 512 × 3 + 3 = 1,539 parameters.

### 06 · Run the target image through

The signal still passes through the reused backbone. Freezing is a later choice about updates; it does not remove this computation.

**Board calculation:** x → fθ*(x), a 512-feature vector → three task scores

### 07 · Choose what gets to learn

Begin by training the new head. Validate that baseline, then decide whether adapting some pretrained layers is useful.

**Board calculation:** Reuse is a starting hypothesis. Validation decides whether it helps.

## Watch four numbers become one feature.

Accumulate, average, combine, then normalize.

Exact two-channel, two-class toy example. Features are hand-designed; no real leaf model runs here.

### 01 · Read the two feature maps

Each channel contains four responses. Predict each channel mean before we move a single value.

**Board calculation:** Channel 1: [1, 3, 2, 2] · Channel 2: [0, 2, 4, 2]

### 02 · Collect the first cell

The highlighted cells send their values to separate accumulators. Channels are pooled independently.

**Board calculation:** S₁ = 1 · S₂ = 0 · collected 1 of 4 cells

### 03 · Add the second cell

Move across the first row. The accumulator keeps what was already collected.

**Board calculation:** S₁ = 1 + 3 = 4 · S₂ = 0 + 2 = 2

### 04 · Add the third cell

Move down to the next row. Spatial positions disappear from this summary; channel identity remains.

**Board calculation:** S₁ = 4 + 2 = 6 · S₂ = 2 + 4 = 6

### 05 · Finish the sums — predict the means — prediction pause

Both sums are 8. We collected four values from each channel. What goes into the feature vector?

**Board calculation:** PREDICT · z₁ = 8 / 4 = ? · z₂ = 8 / 4 = ?

### 06 · Divide and build the vector

Each sum is divided by the number of spatial positions. The two means travel into their vector slots.

**Board calculation:** z = [8/4, 8/4] = [2, 2]

### 07 · Apply the new head

Each row of W reads both features. Bias is added once per class. Follow each contribution to its class score.

**Board calculation:** W = [[1, −0.5], [−0.5, 1]], b = [1, 1] → scores [2, 2]

### 08 · Normalize the scores

Equal logits give equal softmax probabilities. A different head could read the same features differently.

**Board calculation:** pA = e²/(e²+e²) = 0.5 · pB = 0.5

## Two passes. One update policy.

The forward route stays alive even when weights are locked.

One representative scalar per group; fixed illustrative gradients, plain SGD. This is an update demonstration, not a training simulation.

### 01 · Lock the backbone, unlock the head

All representative weights start at 2. Only the new head is trainable. Locks refer to parameters, not to whether a layer executes.

**Board calculation:** Trainable groups: head only · ηhead = 0.1

### 02 · Send the image forward

Follow the green signal through early layers, later layers and the head. A frozen group still computes features.

**Board calculation:** Forward computation: early → late → head → loss

### 03 · The loss asks for a change — prediction pause

The loss has been evaluated. Predict: with the backbone frozen, which displayed weights may move?

**Board calculation:** PREDICT · wearly = 2, wlate = 2, whead = 2 — what changes?

### 04 · Route the parameter gradient

The orange update signal targets the head. No parameter update is requested for the locked backbone groups in this baseline.

**Board calculation:** Illustrative head gradient: ∂L/∂whead = +0.6

### 05 · Take the head-only step

Only the head value changes. Compare its before and after values while the backbone stays exactly at 2.

**Board calculation:** whead = 2 − 0.1 × 0.6 = 1.940

### 06 · Now unlock the later group

Keep the early group fixed, but allow the later group to adapt. Use a smaller learning rate for its pretrained weights.

**Board calculation:** ηlate = 0.01 · illustrative gradient glate = −0.2

### 07 · Send updates to two groups

The head receives its illustrative gradient again. The later group now also receives an update signal.

**Board calculation:** Δwlate = −0.01 × (−0.2) = +0.002 · Δwhead = −0.060

### 08 · Compare the next step

The later group moves upward because its gradient is negative. The head takes a second step. The early group stays frozen.

**Board calculation:** wearly = 2.000 · wlate = 2.002 · whead = 1.880

## Move the pixels. Reconsider the label.

Track every value through a flip before trusting the training pair.

Synthetic 4 × 4 images with intensities 0–9. Geometry moves values exactly; the shape is only a teaching illustration.

### 01 · Split original examples first

The 120 originals are assigned to train, validation and test. Only training examples receive random augmentation in this baseline.

**Board calculation:** 84 train · 18 validation · 18 test

### 02 · Make a new view of a training image

Copy the leaf pixels into a second view. It is still a view of the same original, not a new independent labelled example.

**Board calculation:** Original label: leaf species A

### 03 · Flip each row horizontally

Watch values move to mirrored columns. Rows stay fixed, and the text on a pixel remains upright.

**Board calculation:** x′[r,c] = x[r, 3−c] · each row reverses independently

### 04 · Pause at the label — prediction pause

The mirrored leaf may still be species A. Would this exact same operation be safe for every classification task?

**Board calculation:** PREDICT · Does a horizontal flip always preserve a label?

### 05 · Change the task to arrow direction

Start again with a left-pointing arrow. This time the label is its direction, not its object category.

**Board calculation:** Input label: LEFT · allowed classes: LEFT / RIGHT

### 06 · Apply the identical flip

The pixels follow the same coordinate rule, but the arrow now points right. Keeping LEFT would create an incorrect training pair.

**Board calculation:** Transformed image: RIGHT · unchanged training label: LEFT → invalid

### 07 · Repair the training pair

For this task, either exclude the flip or deliberately change the target to RIGHT. Label preservation depends on what is being predicted.

**Board calculation:** A valid pair must keep the image and its target consistent.

### 08 · Add brightness and expose clipping

Add 3 to the flipped intensities. Sevens become 9, not 10, because the range is clipped. Check that evidence remains usable.

**Board calculation:** x″ = min(9, max(0, x′ + 3)) · 7 + 3 → 9

### 09 · Keep the evaluation boundary

Useful augmentation changes training views within justified limits. Validation and test retain their chosen consistent preprocessing.

**Board calculation:** More views ≠ more independent originals.

## From neighbouring pixels to distant evidence.

Grow a CNN’s reach, then follow a patch-attention route.

Receptive-field geometry is exact. Patch tokens and scalar attention values are a separate hand-designed example, not a trained ViT.

### 01 · Two marks, one question

The label depends on the two corner marks. We follow the input positions that can influence the central output.

**Board calculation:** 7 × 7 image · orange corners hold value 9

### 02 · One local convolution

A 3 × 3, stride-1 convolution reaches a 3 × 3 input neighbourhood. Both distant marks are still outside it.

**Board calculation:** r₁ = 1 + (3−1) = 3

### 03 · Stack another local step — prediction pause

A second such layer grows the field to 5 × 5. Predict the next width, and whether it reaches both corners.

**Board calculation:** PREDICT · r₃ = 5 + (3−1) = ?

### 04 · Three layers connect the corners

The theoretical field is now 7 × 7. A CNN can gather global context; coverage does not guarantee equal influence or useful learning.

**Board calculation:** r₃ = 7 · both marks are inside the theoretical field

### 05 · Try a different representation

For a separate 6 × 6 toy image, cut nine 2 × 2 patches. Gaps reveal the patch boundaries without changing pixel values.

**Board calculation:** 9 patches × 4 pixels · flatten and project each patch

### 06 · Give each patch a token and a position

The patch groups become symbolic embeddings, then receive position information. Their displayed indices are identities, not embedding dimensions.

**Board calculation:** ti = E · vec(patchi) + positioni

### 07 · Let one token read every token

Follow messages from all nine tokens into query 5. Line thickness represents illustrative attention weights; the weights need not be equal.

**Board calculation:** a = [0.05, 0.05, 0.10, 0.10, 0.40, 0.05, 0.10, 0.05, 0.10]

### 08 · Combine the values

For scalar toy values V = [1,…,9], the weighted sum is 5.15. Global attention offers a direct route, not an automatic guarantee of good predictions.

**Board calculation:** output₅ = Σ aiVi = 5.15 · attention weights sum to 1

### 09 · Count the price of global connections

Return to a 224 × 224 image: 16 × 16 patches give 196 tokens. Full attention creates a score for each token pair per head.

**Board calculation:** 196² = 38,416 scores · 32 × 32 patches: 49² = 2,401 · class token excluded

## Instructor checks

- Pretraining: the nine schematic filter values remain unchanged while the head is replaced. They are not downloaded ResNet weights.
- Feature extraction: each channel sums to 8, averages to 2, and the stated head yields [2,2] logits and [0.5,0.5] probabilities.
- Freezing: scalar weight changes occur after the update signal arrives; gradients are fixed teaching values. The scenario shows two optimizer steps, not a real fitted model. BatchNorm buffers are outside this simulation.
- Augmentation: pixel rows remain fixed through the flip; text remains upright. The arrow counterexample uses exactly the same coordinate mapping as the leaf. Split counts refer to originals.
- CNN/ViT: 7×7 receptive-field geometry, a separate 6×6 patch illustration, and 224×224 attention-cost counts are explicitly labelled as different examples. The attention weights sum to 1; scalar values 1–9 give weighted output 5.15. Token IDs are not embeddings.

The calculators under each embedded player remain available for independent exploration; their settings do not change the planned example.
