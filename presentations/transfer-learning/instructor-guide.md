# Transfer learning — Borrow. Adapt. See further.

Instructor guide · 75–90 minutes · companion to `index.html`

## Intention and suspense

“You have 120 labelled images: 40 images of each of three leaf species. A pretrained ResNet-18 already exists. What must you relearn?” Reveal the 11.18-million-parameter count, but do not present small data as an automatic failure or transfer as a guaranteed success. Ask students what can be reused. Keep a second puzzle unresolved: a label determined by two distant marks may require more than a local view. Return to this when motivating ViTs.

Students should leave able to choose a first transfer experiment, count head parameters, trace frozen versus trainable updates, audit augmentation semantics and explain global patch interactions with their costs.

## Animated teaching route

The main demonstration in each section is now a planned animation. Present the [lecture sheet](index.html) directly, and use [the storyboard guide](storyboard-guide.md) for every narration beat, calculation, and prediction pause. The older live calculators are retained under “Explore the values yourself.” Start with the animation, collect predictions at its automatic pause, then open the calculator for variations.

## Preparation

Open the worksheet in a current browser. No model download or backend is required. For reliable local preview, serve the repository root with `python3 -m http.server 8000` and open `/presentations/transfer-learning/`. The downloadable bundle includes its shared styles. In the extracted bundle, open `worksheet/index.html` or serve the bundle root and visit `/worksheet/`. Internet access only supplies optional Google Fonts; system fonts are the fallback.

Project the original SVGs from `assets/gallery.html` or import individual SVGs into slides. Every numerical matrix includes visible values. The figure numbered 04 uses pixel identifiers 1–16 to make rearrangement easy to trace; the live augmentation lab uses synthetic grayscale intensities 0–9. Neither is a real leaf photograph. The feature-extraction lab intentionally reduces the three-class mission to a two-class, two-feature arithmetic example.

Ask for a prediction before touching a control. Allow 30 seconds individually, 60 seconds with a partner, then reveal the reasoning. The worksheet offers typed answers saved in the current browser, answer download, and a print view. Each learning section follows hook → problem visual → explanation and analogy → formula → interactive experiment → questions. Detailed theory is in “Go deeper” folds. Keep these collapsed until they resolve a question.

## Teaching route

| Segment | Minutes | What to do |
|---|---:|---|
| Mission and fair evaluation | 8 | Establish 120 images, a pretrained model, and the distant-marks puzzle. |
| Pretrained models | 12 | Replace the head; change class count while backbone size stays fixed. |
| Feature extraction | 15 | Predict channel means, calculate logits, then inspect probabilities. |
| Freezing | 15 | Toggle groups and take an SGD step; identify weights that do not move. |
| Augmentation | 13 | Flip the pixels, switch to arrow labels, and reject the invalid pair. |
| CNN limitations → ViT | 14 | Grow receptive fields, then compare patch counts and pair costs. |
| Exit synthesis | 8 | Propose a baseline and justify one follow-up using validation evidence. |

Default: 85 minutes. For 75 minutes use 6, 10, 13, 13, 12, 13, 8 minutes. For 90 minutes add 2 minutes to BatchNorm discussion and 3 minutes to the CNN/ViT comparison.

## 1. Pretrained models

**Hook:** The old model's 1,000 labels cannot name our three species. Is its representation useless? **Visual:** source head mismatched to target labels. **Analogy:** an experienced photographer learning a new catalogue. **Formula:** `ŷ = gφ(fθ*(x))`; linear head `W ∈ R^(C×d)`, `b ∈ R^C`, so `Cd+C` parameters.

**Live sequence:** Start with 3 classes (1,539 head parameters), move to 12 (6,156), and return to 3. Ask what changed. The backbone has 11,176,512 learned parameters; the three-class total is 11,178,051. These torchvision-style ResNet-18 counts include BatchNorm affine parameters, not its running-statistic buffers. The original 1,000-class head has 513,000 parameters.

**Fold when needed:** pretrained preprocessing is part of the checkpoint contract; source-task bias and domain mismatch can reduce transfer. Early edges/later parts are an intuition rather than guaranteed channel semantics.

**Transition:** We can keep the representation, but how does the new head read it?

## 2. Feature extraction

**Hook:** Can the target task learn without changing convolutional weights? **Visual:** raw pixels need comparable coordinates. **Analogy:** an observer hands description cards to a new curator. **Formula:** global average pooling `z_c = Σ A_ijc/(HW)`, then `s = Wz+b` and `p=softmax(s)`.

**Exact worksheet example:** channel maps `[[1,3],[2,2]]` and `[[0,2],[4,2]]` yield `[2,2]`. With `W=[[1,-0.5],[-0.5,1]]`, `b=[1,1]`, logits are `[2,2]`, giving `[0.5,0.5]`. Choose “More evidence for class A”: the means are `[3,1]`, logits `[3.5,0.5]`, and class A probability is about 95.3%. Choose class B to reverse it. These are hand-designed values, not trained or calibrated predictions. The SVG uses the balanced case.

**Fold when needed:** cross-entropy for label y is `−log p_y`. Train the new head while θ stays fixed. If distinct classes collapse to identical frozen vectors, a deterministic head cannot reconstruct the missing distinction. Cached features require fixed backbone behaviour and account for augmentation: one cached view does not represent fresh online transforms.

**Transition:** “Fixed” sounds inactive. What actually stops when a layer is frozen?

## 3. Layer freezing

**Hook:** If we freeze the backbone, how does information reach the head? **Visual:** the forward path remains active. **Analogy:** locked textbook chapters can still be read. **Formula:** `θ_l ← θ_l − η_l m_l ∇L`, where the mask is shorthand for a plain SGD update policy.

**Live sequence:** Start with only the head trainable. One step changes its representative scalar 2 → 1.940; both backbone scalars stay 2. Reset. Unfreeze layer2–4 and step: that representative scalar becomes 2.002 because its gradient is −0.2 and its learning rate is 0.01. Unfreeze everything: the early scalar changes to 1.996. The new head uses η=0.1 and gradient 0.6. The demonstration holds gradients fixed rather than recomputing a training loss. Freeze every group: all weights stay fixed although a forward pass remains possible.

**Counts:** stem + layer1: 157,504; layer2–4: 11,019,008; new three-class head: 1,539. The groupings are pedagogical rather than individual layers.

**Practical caveats:** `requires_grad_(False)` and `eval()` serve different purposes. BatchNorm running means/variances are buffers and can update in train mode. A parent `train()` call resets child modes; restore the frozen backbone's eval policy when appropriate. Restrict optimizer parameter groups to trainable parameters; when unfreezing, update them deliberately. Do not assume a zero gradient defeats weight decay or stale optimizer state. Do not detach a frozen middle layer if earlier trainable layers need gradients through it.

**Transition:** Even a sensible update policy cannot show the model variations absent from training.

## 4. Data augmentation

**Hook:** A mirrored leaf may have the same species; a mirrored left arrow changes direction. **Visual:** two tasks, one transform. **Analogy:** rehearse the same talk in different rooms without changing its subject. **Formula:** minimize the average expected loss under allowed transforms; preserving the original classification label is an assumption to verify.

**Live sequence:** Inspect original 4×4 values, apply a horizontal flip, then switch the task from species to left/right arrow direction. The warning should say left becomes right. Rotate the left arrow clockwise: it becomes up, outside the two-class label set. A right shift loses the last column. Add brightness and show clipping to `[0,9]`; changes compose geometry first, brightness second. Moderate leaf variation is only plausibly valid, not proven by our toy pixels.

**Supporting figure:** SVG 04 has values 1–16 rather than intensities 0–9. Its rows become `[4,3,2,1]`, `[8,7,6,5]`, `[12,11,10,9]`, `[16,15,14,13]`. Use this as a second exact indexing exercise, not as the live demo's input.

**Fold when needed:** split original images or related source groups before augmenting. Train/validation/test examples must not share augmented siblings. Use random training transforms and consistent evaluation preprocessing for this baseline. Deliberate test-time augmentation is separate. Augmented views are correlated, not new independent labelled data. Detection and segmentation need corresponding target transforms.

**Transition:** More views do not remove every architectural constraint. Return to the two distant marks.

## 5. CNN limitations and the motivation for ViT

**Hook:** How does one location combine two distant marks? **Visual:** the central local window misses both corner marks. **Analogy:** neighbour-to-neighbour messages versus a group discussion. **Formula:** `r_l=r_(l−1)+(k_l−1)j_(l−1)`, `j_l=j_(l−1)s_l`, with r₀=j₀=1 and dilation 1. Here `r=1+2L` for stride-1 3×3 layers.

**Live sequence:** At one layer, central theoretical coverage is 3×3. At three it becomes 7×7 and includes both corner marks. At five it is 11×11 and extends beyond the 7×7 input into padding. Coverage is not equal influence or proof of learned global reasoning. Then compare 16-pixel and 32-pixel patches on a separate 224×224 image: 196 vs 49 tokens; 38,416 vs 2,401 patch-to-patch scores per head. The four symbolic tokens in the live route illustrate connectivity, not the total token count. SVG 05 similarly shows nine illustrative patches.

**ViT preview:** flatten/project patches, add positions, then use `softmax(QKᵀ/√d_k)V` to mix content-dependent information. Full attention can connect distant tokens in one layer. A class token is excluded from our counts; original ViT with it has 197²=38,809 scores in the 16-pixel case. Score count is not total model FLOPs or memory.

**Nuance:** CNNs can learn global context through depth, larger/dilated kernels, pooling and hybrid designs. Pooling can discard precise position. The theoretical receptive field differs from effective influence. ViT's weaker locality bias and quadratic full-attention cost are trade-offs; large-scale pretraining and recipe matter. Small target data does not make ViT automatically superior.

**Cliffhanger:** “We gave patches permission to talk. How do they decide whom to listen to?”

## Worksheet questions and worked answers

These match the visible worksheet, including its two-class feature toy and three-class overall mission.

### 1.1 A 512-feature backbone needs a 3-class linear head with bias. How many head parameters must be learned?

512 × 3 + 3 = 1,539. The old 1,000-class head is replaced; the pretrained backbone can still be reused.

### 1.2 A natural-image checkpoint performs poorly on a new domain. What would you check before discarding transfer learning?

Verify the expected preprocessing, labels and splits, then compare frozen features and selective fine-tuning on validation data. A domain mismatch may require different pretraining or more adaptation; transfer is not guaranteed.

### 2.1 Pool [[1,3],[2,2]] and [[0,2],[4,2]]. With W = [[1,−0.5],[−0.5,1]] and b = [1,1], what are the logits?

The means are [2,2]. The first score is 1×2 − 0.5×2 + 1 = 2; the second is −0.5×2 + 1×2 + 1 = 2. Softmax yields [0.5,0.5].

### 2.2 Two classes always produce identical frozen feature vectors. Can a deterministic head separate them perfectly?

No. Identical representations give the same deterministic output. The missing distinction must enter through better input information or a changed representation, for example fine-tuning suitable backbone layers.

### 3.1 A weight is 2, its gradient is 0.4, and η = 0.1. What is its value after a frozen step? After an unfrozen SGD step?

Frozen: 2. Unfrozen: 2 − 0.1×0.4 = 1.96. A fixed weight still participates in the forward computation.

### 3.2 You disabled parameter gradients but BatchNorm running statistics changed. Is this a contradiction?

No. Running statistics are buffers, not gradient-trained parameters. BatchNorm can update them in train mode. Choose train/eval modes intentionally; eval mode itself does not freeze parameter gradients.

### 4.1 An image row is [0,2,7,9]. Flip it horizontally, then add 2 and clip to [0,9]. What is the result?

Flip: [9,7,2,0]. Add and clip: [9,9,4,2]. The transform changes the pixels; whether the label remains valid depends on the task.

### 4.2 You generate five augmented views of every image, then randomly split the views. What goes wrong?

Views from one original can occur in both training and validation, causing leakage. Split original images or source groups first, and augment only the training portion. Five views are not five independent labelled images.

### 5.1 For three stride-1, 3 × 3 convolutions with no dilation, what is the theoretical receptive-field width? Does that guarantee equal influence from all covered pixels?

r = 1 + 2×3 = 7. No: theoretical coverage describes possible paths, while learned weights, activations, and data determine actual influence.

### 5.2 A 224 × 224 image uses 16 × 16 patches. Excluding a class token, how many tokens and pairwise attention scores are there per head?

(224/16)² = 196 patch tokens, and 196² = 38,416 scores per head. These are score counts, not total compute. A global attention route is available immediately, but useful relationships must still be learned.

### 6.1 Propose a first experiment and one follow-up if both training and validation accuracy remain poor. Name a leakage risk and explain whether you would immediately switch to a ViT.

Begin with source-aware splits, checkpoint-compatible preprocessing, a frozen backbone and a new 3-class head. Train on suitable augmented training views and compare validation results. If both training and validation are poor, first inspect labels and the pipeline, then test selective fine-tuning or a better-matched checkpoint. Keep augmented siblings in the same split. A ViT is a candidate if global relations or suitable pretraining justify it; the small dataset alone is not a reason to expect it to win.

## Exit synthesis and assessment

A strong answer proposes source-aware original splits, checkpoint-compatible preprocessing, a new three-class head and a frozen-backbone baseline. It adds label-preserving training augmentation, validates before selective fine-tuning, and reserves a held-out test for the final procedure. With only 120 images, acknowledge uncertainty. For persistently low training and validation performance, inspect the pipeline and labels before assuming architecture is the cause. For good training but weak validation, investigate overfitting, split mismatch and the adaptation strength.

Look for causal explanations: “frozen weights still compute,” “a head cannot recover information absent in the representation,” “a transform must preserve the task label,” and “global reach is not guaranteed useful learning.”

## Primary references

- [PyTorch transfer learning tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)
- [Keras transfer learning guide](https://keras.io/guides/transfer_learning/)
- [Torchvision ResNet-18](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.resnet18.html)
- [An Image is Worth 16×16 Words](https://arxiv.org/abs/2010.11929)

Original diagrams and numeric examples; no measured training outcomes are claimed. See `assets/asset-manifest.md` for credits and assumptions.
