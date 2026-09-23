# Keep the clue. Read the context.

A 90–110 minute lecture worksheet introducing LSTM, GRU and bidirectional RNNs. The sequence-modelling foundation page is useful preparation, but this page includes its own beginner recap. Prerequisites: vectors, multiplication, addition and the idea of gradient descent. No coding or prior LSTM knowledge is assumed.

## Intent and lesson design

The user brief calls for detailed explanation, visual motivation, planned animation and understanding checks. Every learning section follows the same six steps: hook with a visual pair; problem diagram; explanation and analogy; formula with notation; guided interactive; practice with worked reasoning. Dense theory, matrix shapes, conventions and examples live in clearly labeled “Go deeper” disclosures.

The emotional thread is selective memory: plant a colour cue, introduce distracting arithmetic, ask which information should survive, and return to the cue at the end. The second thread is context: a clue can be distant in the past or later in a completed input. Cell design and reading direction solve different problems.

## Suggested pacing

| Minutes | Lesson | Teaching move |
|---|---|---|
| 0–7 | Mission | Hide BLUE; count backward; delay the recall question. |
| 7–20 | State through time | Contrast word order. Make learners trace a zero-input update. |
| 20–43 | LSTM | Keep/write/reveal. Predict c before showing h; close output without deleting memory. |
| 43–56 | Gradient route | Compare 0.8²⁰ and 0.95²⁰. Require one limitation alongside the numerical answer. |
| 56–75 | GRU | Announce the z-retains-old convention. Predict the displayed blend, then test r = 0, z = 1. |
| 75–94 | Bidirectional | Trace the backward pass, pair at bank, switch to live prefix. |
| 94–110 | Design and debrief | Fault tagging versus immediate alerts; recall BLUE; bridge to attention. |

For 90 minutes, leave deep theory disclosures for independent reading and shorten whole-class reporting. Each learner should still make the five animation predictions. Do not skip the causal-boundary discussion.

## How to run each animation

1. Begin at the first beat and read its question aloud.
2. Press Play; the player moves between diagram states and dwells for narration.
3. At the prediction beat it stops automatically. Let pairs commit to an answer.
4. Continue or Next reveals the mechanism. Beat buttons let you revisit a specific point.
5. Change one control and ask learners to explain the intervention, not merely report the new number.

LSTM presets: **Hide output** preserves c = 0.8 but makes h = 0. **Retain old memory** sets f = 1 and i = 0. GRU presets: **Reset candidate, retain state** sets r = 0 and z = 1, leaving h = 0.8. **Take new candidate** sets r = z = 0, producing tanh(0.2) ≈ 0.197. Bidirectional: change ending after the concatenation reveal, then switch to live prefix to remove unavailable suffix data.

Controls sit above the visual. Only one player runs at a time; players pause off-screen and when the tab becomes hidden. Reduced-motion mode reveals stable steps. Small screens keep diagrams horizontally scrollable instead of shrinking numbers beyond readability. SVG frame downloads preserve the current view.

## Numerical and conceptual answer key

1. 0.4. Zero input is not a state reset.
2. False. Parameters are shared over time.
3. Hidden state changes during ordinary inference.
4. c = 0.75 × 0.8 + 0.5 × 0.4 = 0.8.
5. h = 0. c remains 0.8.
6. f = 1, i = 0 preserves c exactly in the idealized example.
7. 0.5³ = 0.125 = 1/8.
8. No. The direct cell route is only one gradient path.
9. Gradient clipping limits large gradients.
10. z = 1 retains h = 0.8 under this worksheet's convention.
11. r = 0 removes old hidden-state input to the candidate; it does not necessarily erase final state.
12. 3 × 2 × (3 + 2 + 1) = 36 GRU recurrent parameters.
13. 2H = 8 concatenated features.
14. Tagging a completed sentence respects available context.
15. The backward pass is a recurrent forward computation over reversed input, not backpropagation.

Final design challenge: completed recordings can use bidirectional gated models; immediate alerts use only observed readings unless latency explicitly permits look-ahead. Compare cells on appropriate held-out recordings or machines, avoid window overlap/source leakage, and measure latency as well as predictive performance. Accept alternative architectures if students defend the information boundary and experiment.

## Misconceptions to catch

- c and h are different states, not two names for one vector.
- Gates are learned, input-dependent vectors; sliders manually supply one coordinate for explanation.
- Forget and input gates are independent. They need not sum to 1.
- Cell state is not bounded by tanh. Hidden state is bounded in the standard formulation shown.
- fᴸ isolates a direct path with fixed gates, not the full loss or parameter gradient.
- Our GRU z retains old state. Other notation can reverse its meaning.
- Reset-before and reset-after formulations differ for matrices and biases.
- Bidirectionality is independent of cell choice; a BiLSTM still uses LSTM cells.
- Reading backward is not differentiating backward, and it does not imply tied weights.
- A bidirectional encoder of observed history can be valid for forecasting; including the future target is the leakage.
- Fewer parameters does not automatically imply better accuracy or lower measured latency.

## Assets and attribution

Five original vector figures are in `assets/`; `assets/gallery.html` provides previews and downloads. `storyboard-guide.md` lists every planned beat, prompt and assumption. The worksheet cites the original LSTM, forget-gate, GRU and bidirectional papers and links to Dive into Deep Learning for further study. No copyrighted book scans or third-party images are embedded. There are no external runtime or font requests.

The final SVG figures are also an offline/no-JavaScript fallback. Print uses the final animation frames and suppresses controls. Open any desired theory disclosures before printing; answer disclosures remain under instructor control.

## Maintenance and verification

Edit `index.html`, `app.js`, `model.js`, `scenes.js`, `storyboards.js` and `styles.css` directly. The theme and deterministic timeline are shared with `../sequence-modelling/`; no changes to that worksheet are required. Regenerate assets after diagram/storyboard changes:

```sh
node presentations/gated-rnns/build-assets.cjs
cd presentations/gated-rnns
npm ci
npm test
```

From the repository root, run `python3 scripts/check_links.py`. Serve the repository root with `python3 -m http.server 8000` and open `/presentations/gated-rnns/`. The page also works via its local HTML file if the collection folders remain together. Answers are stored only in the browser under a worksheet-specific key and may be exported as text. Numeric answers accept decimal or fraction notation; changing an answer clears its previous success state.
