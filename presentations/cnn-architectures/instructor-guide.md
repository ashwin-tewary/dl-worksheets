# CNN Architectures: Depth, Scale & Efficiency

A 75–90 minute lecture worksheet after basic CNNs, backpropagation, and initialization. Open `index.html` directly in a browser, or serve the repository. It has no external scripts. It shares the CNN worksheet stylesheet, with optional Google Fonts and system fallbacks. Keep the shared stylesheet when distributing offline.

## Learning outcomes

Students should distinguish gradient magnitude from correlation; derive the residual Jacobian; trace shapes through a ResNet stage boundary; distinguish addition from channel concatenation; and compare full and depthwise separable convolution costs.

## Teaching sequence

| Minutes | Activity | Reveal / teaching move |
| --- | --- | --- |
| 0–7 | Opening mystery: “We doubled depth. Why no improvement?” | Ask students what they would measure. Keep gradient correlation unrevealed until someone proposes something beyond size. |
| 7–20 | Shattered gradients | Start at depth 4, increase to 32. Both synthetic traces retain RMS 1. Change magnitude to 0.05: correlation does not change. Explain that this is a controlled synthetic construction, not experimental evidence from a trained network. |
| 20–34 | Residual connections | At a = 0, compare plain and residual outputs/derivatives. Move to a = −1 to demonstrate cancellation. Derive I + J_F. Have pairs explain why a shortcut is helpful without claiming it guarantees stable gradients. |
| 34–47 | ResNet | Select stage transition with identity. Ask for a repair before choosing projection. Count 8,192 projection weights. Trace ResNet-18 and distinguish its basic blocks from bottleneck blocks. |
| 47–62 | Inception | Ask which receptive-field size detects a useful clue. Show parallel branches, then concatenate. At r = 96 calculate 129,024 weights. Increase to 176: reduction now costs 236,544, more than the direct 221,184. |
| 62–77 | Depthwise separable convolution | Compute 18,432 versus 2,336. Inspect all four positions in the exact toy example. Then select k = 1 or N = 1: the factorization can cost more. |
| 77–90 | Design challenge and synthesis | Pairs defend choices using shapes, formulas, and a limitation. Reveal the model argument only after discussion. |

For 75 minutes, assign the expanded theory and second discussion question in each section as revision. For a 50-minute session, split after ResNet and use Inception/depthwise as the next lesson.

## Model answers

1. **Shattering:** low correlation even at fixed RMS. Positive rescaling does not restore correlation.
2. **Residual:** F = 0 yields y = x before post-add activation. F = −x yields a zero derivative; cancellation remains possible.
3. **ResNet:** a 1 × 1, stride-2, 64-to-128 projection matches the transition. It uses 8,192 weights. ResNet-18 counts 1 stem + 16 block convolutions + 1 classifier.
4. **Inception:** concatenate 64 + 128 + 32 + 32 channels to obtain 28 × 28 × 256. A standard 1 × 1 convolution mixes all input channels at each pixel.
5. **Depthwise:** 9 × 32 × 64 = 18,432; 9 × 32 + 32 × 64 = 2,336. Pointwise is the channel-mixing step. Fewer parameters/MACs do not ensure equal accuracy or proportional latency improvements.
6. **Exit challenge:** inspect nearby-input gradient correlation, consider residual paths with shape-compatible projections, use parallel multi-scale branches and concatenate them, and factor the costly convolution. 73,728 versus 8,768 weights; about 8.41× fewer.

### Exact matrix answers

Residual input [[2,1],[0,3]], correction a times input, output (1+a) times input. No post-add activation in this demo.

Depthwise input A is [[1,2,3],[4,5,6],[7,8,9]], B is [[9,8,7],[6,5,4],[3,2,1]]. Each uses an all-ones 2 × 2 filter with valid padding and stride 1. A′ = [[12,16],[24,28]], B′ = [[28,24],[16,12]]. Pointwise weights [1,−1] give [[−16,−8],[8,16]]. These demonstration dimensions are independent of the larger cost calculator.

## Misconceptions to listen for

- “Shattering means gradients are tiny.” Ask students to compare the two readouts.
- “Skip connections always prevent vanishing.” Use a = −1 and mention post-add ReLU gates.
- “ResNet was invented to solve the 2017 shattering paper.” ResNet came first; this is a retrospective teaching sequence.
- “Addition and concatenation are interchangeable.” Ask which dimensions must match and which grow.
- “1 × 1 sees only one channel.” It sees one spatial position across all input channels.
- “Depthwise alone produces any desired number of channels.” With multiplier 1 it preserves the input channel count; pointwise sets the output count.
- “Fewer MACs equals the same speedup on my phone.” Device measurements include memory and kernel implementation.

## Presenting, printing, and saving

- Project at browser zoom suitable for the room. All image-matrix values are actual text, at least 17px on narrow screens.
- On phones, large architecture diagrams scroll within their figure to preserve readable labels.
- Theory and model answers are separate native disclosure controls. Keep answers closed while students predict.
- Print uses current disclosure states: open any theory or answers you want included. Current interactive readouts print as the numerical worked examples.
- Eleven response fields save locally when browser storage is available. “Download my responses” exports Markdown. No account, submission endpoint, grading, or data upload is involved.
- `assets/` contains five standalone SVGs suitable for slides. They contain original diagrams, not copied paper figures.

## Scientific model notes

The gradient plot deliberately constructs orthogonal zero-mean unit-RMS vectors u and v over 80 samples. Its traces are m·u and m·(ρu + sqrt(1−ρ²)v), where ρ = exp(−(depth−1)/8). Thus measured correlation equals ρ and RMS equals m. This isolates two concepts; it does not simulate ReLU activation gates or reproduce an experimental depth curve. The decay constant 8 is illustrative.

Cost calculations exclude biases, BN, activation costs, and memory access; use depth multiplier 1 and the same output area for the two convolutions. The worksheet shows original post-activation ResNet blocks and an original Inception-style module; variants differ.

## Sources

- Balduzzi et al. (2017), [The Shattered Gradients Problem](https://proceedings.mlr.press/v70/balduzzi17b.html).
- He et al. (2015/2016), [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385).
- He et al. (2016), [Identity Mappings in Deep Residual Networks](https://arxiv.org/abs/1603.05027).
- Szegedy et al. (2014/2015), [Going Deeper with Convolutions](https://arxiv.org/abs/1409.4842).
- Howard et al. (2017), [MobileNets](https://arxiv.org/abs/1704.04861).
- Chollet (2016/2017), [Xception](https://arxiv.org/abs/1610.02357).

## Verification

Run `node --test *.test.cjs` in this folder. Run `python3 scripts/check_links.py` at repository root. Browser checks should cover controls, disclosure panels, saved responses, and narrow layouts.

## Guided animation storyboards

Each section now includes a planned visual walkthrough before free exploration. Press Play for 5.5-second steps, Pause to discuss, or use Previous/Next. Restart returns to the initial prediction. Playback stops at the end, pauses when the page is hidden, and only one walkthrough can play at a time. Reduced-motion users advance manually without motion.

- **Shattered gradients (5 steps):** agreement → partial decorrelation → near-zero correlation at fixed RMS → reduced magnitude → motivation for a direct route. All traces remain explicitly synthetic.
- **Residual (5 steps):** copy input → compute edit → add → backpropagate contributions → cancellation counterexample.
- **ResNet (5 steps):** initial tensor → main-route downsampling → identity mismatch → projection → valid addition/ReLU.
- **Inception (5 steps):** fan-out → 1 × 1 branch → 3 × 3 branch → wider/pooling branches → channel concatenation. Sequential reveal is a teaching device; branches are parallel in the architecture.
- **Depthwise (7 steps):** separate inputs → top-left patch → top-right → bottom-left → bottom-right → pointwise mix at one position → completed mixed map.

The guided scenes use fixed teaching values independently of the free-exploration controls, so students can reproduce the same lecture sequence after experimenting.

## Worksheet structure

Matches the CNN foundation sheet: question → problem visual → idea → folded formula → guided walkthrough and free exploration → questions. Each learning section uses the same six numbered step labels. Architecture reference diagrams are in the expanded theory, after the problem has been introduced.
