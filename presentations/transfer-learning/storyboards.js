/* Planned lecture beats. Each checkpoint pauses autoplay BEFORE its answer. */
(function(root){
 const step=(title,narration,equation,checkpoint=false)=>({title,narration,equation,checkpoint});
 const stories={
 pretrained:{title:'Borrow the eyes. Replace the dictionary.',subtitle:'Follow the same learned filters into a new task.',note:'Architecture diagram; the small filter values illustrate reused weights, not an extracted ResNet checkpoint.',steps:[
 step('Start with a source task','A pretrained CNN has already learned filters. Its original head turns those features into scores for 1,000 source labels.','Image → learned backbone → 1,000 source scores'),
 step('Keep the learned numbers','Look at the numbered filter inside the backbone. Reusing a checkpoint means carrying learned parameter values forward.','The same θ* will initialize the target backbone.'),
 step('A new task arrives','Our 120 leaf images have three species labels. The existing visual vocabulary may help, but the old label dictionary does not answer this task. Predict: which part should we replace?','PREDICT · Keep the backbone, the head, or both?',true),
 step('Detach the old head','The 1,000-class head leaves the pipeline. Watch what stays: the learned filter values are unchanged.','Remove 512 × 1,000 + 1,000 = 513,000 head parameters.'),
 step('Attach a new three-class head','A new head arrives with three outputs. It starts without knowledge of the leaf labels and must be trained.','New head: 512 × 3 + 3 = 1,539 parameters.'),
 step('Run the target image through','The signal still passes through the reused backbone. Freezing is a later choice about updates; it does not remove this computation.','x → fθ*(x), a 512-feature vector → three task scores'),
 step('Choose what gets to learn','Begin by training the new head. Validate that baseline, then decide whether adapting some pretrained layers is useful.','Reuse is a starting hypothesis. Validation decides whether it helps.') ]},
 features:{title:'Watch four numbers become one feature.',subtitle:'Accumulate, average, combine, then normalize.',note:'Exact two-channel, two-class toy example. Features are hand-designed; no real leaf model runs here.',steps:[
 step('Read the two feature maps','Each channel contains four responses. Predict each channel mean before we move a single value.','Channel 1: [1, 3, 2, 2] · Channel 2: [0, 2, 4, 2]'),
 step('Collect the first cell','The highlighted cells send their values to separate accumulators. Channels are pooled independently.','S₁ = 1 · S₂ = 0 · collected 1 of 4 cells'),
 step('Add the second cell','Move across the first row. The accumulator keeps what was already collected.','S₁ = 1 + 3 = 4 · S₂ = 0 + 2 = 2'),
 step('Add the third cell','Move down to the next row. Spatial positions disappear from this summary; channel identity remains.','S₁ = 4 + 2 = 6 · S₂ = 2 + 4 = 6'),
 step('Finish the sums — predict the means','Both sums are 8. We collected four values from each channel. What goes into the feature vector?','PREDICT · z₁ = 8 / 4 = ? · z₂ = 8 / 4 = ?',true),
 step('Divide and build the vector','Each sum is divided by the number of spatial positions. The two means travel into their vector slots.','z = [8/4, 8/4] = [2, 2]'),
 step('Apply the new head','Each row of W reads both features. Bias is added once per class. Follow each contribution to its class score.','W = [[1, −0.5], [−0.5, 1]], b = [1, 1] → scores [2, 2]'),
 step('Normalize the scores','Equal logits give equal softmax probabilities. A different head could read the same features differently.','pA = e²/(e²+e²) = 0.5 · pB = 0.5') ]},
 freezing:{title:'Two passes. One update policy.',subtitle:'The forward route stays alive even when weights are locked.',note:'One representative scalar per group; fixed illustrative gradients, plain SGD. This is an update demonstration, not a training simulation.',steps:[
 step('Lock the backbone, unlock the head','All representative weights start at 2. Only the new head is trainable. Locks refer to parameters, not to whether a layer executes.','Trainable groups: head only · ηhead = 0.1'),
 step('Send the image forward','Follow the green signal through early layers, later layers and the head. A frozen group still computes features.','Forward computation: early → late → head → loss'),
 step('The loss asks for a change','The loss has been evaluated. Predict: with the backbone frozen, which displayed weights may move?','PREDICT · wearly = 2, wlate = 2, whead = 2 — what changes?',true),
 step('Route the parameter gradient','The orange update signal targets the head. No parameter update is requested for the locked backbone groups in this baseline.','Illustrative head gradient: ∂L/∂whead = +0.6'),
 step('Take the head-only step','Only the head value changes. Compare its before and after values while the backbone stays exactly at 2.','whead = 2 − 0.1 × 0.6 = 1.940'),
 step('Now unlock the later group','Keep the early group fixed, but allow the later group to adapt. Use a smaller learning rate for its pretrained weights.','ηlate = 0.01 · illustrative gradient glate = −0.2'),
 step('Send updates to two groups','The head receives its illustrative gradient again. The later group now also receives an update signal.','Δwlate = −0.01 × (−0.2) = +0.002 · Δwhead = −0.060'),
 step('Compare the next step','The later group moves upward because its gradient is negative. The head takes a second step. The early group stays frozen.','wearly = 2.000 · wlate = 2.002 · whead = 1.880') ]},
 augmentation:{title:'Move the pixels. Reconsider the label.',subtitle:'Track every value through a flip before trusting the training pair.',note:'Synthetic 4 × 4 images with intensities 0–9. Geometry moves values exactly; the shape is only a teaching illustration.',steps:[
 step('Split original examples first','The 120 originals are assigned to train, validation and test. Only training examples receive random augmentation in this baseline.','84 train · 18 validation · 18 test'),
 step('Make a new view of a training image','Copy the leaf pixels into a second view. It is still a view of the same original, not a new independent labelled example.','Original label: leaf species A'),
 step('Flip each row horizontally','Watch values move to mirrored columns. Rows stay fixed, and the text on a pixel remains upright.','x′[r,c] = x[r, 3−c] · each row reverses independently'),
 step('Pause at the label','The mirrored leaf may still be species A. Would this exact same operation be safe for every classification task?','PREDICT · Does a horizontal flip always preserve a label?',true),
 step('Change the task to arrow direction','Start again with a left-pointing arrow. This time the label is its direction, not its object category.','Input label: LEFT · allowed classes: LEFT / RIGHT'),
 step('Apply the identical flip','The pixels follow the same coordinate rule, but the arrow now points right. Keeping LEFT would create an incorrect training pair.','Transformed image: RIGHT · unchanged training label: LEFT → invalid'),
 step('Repair the training pair','For this task, either exclude the flip or deliberately change the target to RIGHT. Label preservation depends on what is being predicted.','A valid pair must keep the image and its target consistent.'),
 step('Add brightness and expose clipping','Add 3 to the flipped intensities. Sevens become 9, not 10, because the range is clipped. Check that evidence remains usable.','x″ = min(9, max(0, x′ + 3)) · 7 + 3 → 9'),
 step('Keep the evaluation boundary','Useful augmentation changes training views within justified limits. Validation and test retain their chosen consistent preprocessing.','More views ≠ more independent originals.') ]},
 context:{title:'From neighbouring pixels to distant evidence.',subtitle:'Grow a CNN’s reach, then follow a patch-attention route.',note:'Receptive-field geometry is exact. Patch tokens and scalar attention values are a separate hand-designed example, not a trained ViT.',steps:[
 step('Two marks, one question','The label depends on the two corner marks. We follow the input positions that can influence the central output.','7 × 7 image · orange corners hold value 9'),
 step('One local convolution','A 3 × 3, stride-1 convolution reaches a 3 × 3 input neighbourhood. Both distant marks are still outside it.','r₁ = 1 + (3−1) = 3'),
 step('Stack another local step','A second such layer grows the field to 5 × 5. Predict the next width, and whether it reaches both corners.','PREDICT · r₃ = 5 + (3−1) = ?',true),
 step('Three layers connect the corners','The theoretical field is now 7 × 7. A CNN can gather global context; coverage does not guarantee equal influence or useful learning.','r₃ = 7 · both marks are inside the theoretical field'),
 step('Try a different representation','For a separate 6 × 6 toy image, cut nine 2 × 2 patches. Gaps reveal the patch boundaries without changing pixel values.','9 patches × 4 pixels · flatten and project each patch'),
 step('Give each patch a token and a position','The patch groups become symbolic embeddings, then receive position information. Their displayed indices are identities, not embedding dimensions.','ti = E · vec(patchi) + positioni'),
 step('Let one token read every token','Follow messages from all nine tokens into query 5. Line thickness represents illustrative attention weights; the weights need not be equal.','a = [0.05, 0.05, 0.10, 0.10, 0.40, 0.05, 0.10, 0.05, 0.10]'),
 step('Combine the values','For scalar toy values V = [1,…,9], the weighted sum is 5.15. Global attention offers a direct route, not an automatic guarantee of good predictions.','output₅ = Σ aiVi = 5.15 · attention weights sum to 1'),
 step('Count the price of global connections','Return to a 224 × 224 image: 16 × 16 patches give 196 tokens. Full attention creates a score for each token pair per head.','196² = 38,416 scores · 32 × 32 patches: 49² = 2,401 · class token excluded') ]}
 };
 // Slow down motion that requires students to track individual pixel identities.
 stories.augmentation.steps[2].transition=4200;
 stories.augmentation.steps[5].transition=4200;
 stories.context.steps[4].transition=2200;
 stories.context.steps[5].transition=2600;
 if(typeof module!=='undefined'&&module.exports)module.exports=stories;else root.TransferStories=stories;
})(typeof window!=='undefined'?window:this);
