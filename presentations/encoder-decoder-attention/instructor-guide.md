# Encoder–decoder & attention: instructor guide

Open [the worksheet](index.html) from a local HTTP server or GitHub Pages. No model download, build or network connection is needed after saving the repository. This is sequence-modelling chapter 03, but its first lesson introduces the necessary RNN ideas for students arriving fresh. Familiarity with vectors, multiplication and addition is sufficient for the main path.

## Intention and pacing

The narrative question is: “Can a decoder learn where to look instead of asking one summary to retain every detail?” Do not name attention as the answer before students propose a fix for the closed notebook. The opening parcel exercise creates a concrete retrieval need. It is an analogy, not a brain model.

Allow 100–120 minutes including discussion:

| Minutes | Activity | Learning evidence |
| --- | --- | --- |
| 0–8 | Closed notebook; ask what would help | Students propose access to source evidence |
| 8–28 | Encoder–decoder and shifted targets | Distinguish source and target clocks; BOS/EOS |
| 28–43 | Fixed context and scalar sensitivity | Explain fixed width without claiming a word limit |
| 43–65 | Score → softmax → weighted sum | Compute one complete context vector |
| 65–85 | Bahdanau | Trace projections, tanh and v; check dimensions |
| 85–105 | Luong | Compare dot/general and decoder ordering |
| 105–120 | Synthesis and design challenge | Label full route and propose an evaluation |

For 75 minutes: spend 10 minutes each on the opening/encoder and bottleneck; 20 on the shared recipe; 15 on additive; 15 on multiplicative; 5 on the exit. Assign foldouts and the remaining checks for revision. Do not rush the weighted-sum arithmetic to fit every foldout into class.

## Projecting the animations

Every player starts paused. Play advances through six preplanned beats, with a prediction stop at beat 3. Ask for an answer before Continue. Back and Next provide manual control; individual beat buttons and the scrubber jump directly. Speed changes motion and dwell. Moving diagrams use travelling signal dots on arrows; this motion is illustrative, not wall-clock model execution. Only one player runs at a time; hidden/off-screen players pause. Reduced-motion settings replace playback with stable steps.

Controls sit above each diagram. On a phone, scroll the diagram horizontally rather than shrinking numbers. Tables provide text/numerical equivalents. Download any frame as SVG. [The asset gallery](assets/gallery.html) includes five reusable final frames, and [the storyboards](storyboard-guide.md) list every narration and prediction stop.

## Five planned demonstrations

1. **Encoder:** Follow the three source states, final context and BOS. At the stop, ask what starts generation. Then compare teacher forcing and inference: the inference example deliberately feeds `tu`, a scripted first mistake, into the next step. No trained translation model is running. Encoder scalars are computed from tanh(x + 0.5h), x = [1, 0.5, −0.5]. Decoder states/probabilities are conceptual.
2. **Bottleneck:** Start with length 3 and retention 0.5. Predict the difference between final states from first inputs +1 and −1. Reveal, increase length to 12, and inspect the exact trajectory. Try retention 1.0. Discuss why shrinkage here does not imply a literal state word count or establish a real translation error rate. Finish by keeping all intermediate notes.
3. **Recipe:** Start at q = [1,0], H = [[1,0],[0,1],[1,1]]. Scores [1,0,1] give weights about [0.4223188,0.1553624,0.4223188], context [0.8446376,0.5776812]. Have students compute the first coordinate before revealing the context. Switch target presets, lower temperature, then mask the third position as PAD. Distinguish normalization by row from normalization by column.
4. **Bahdanau:** Use identity Wq/Wh, b = [0,0], v = [1,−1]. With q = [1,0], scores are [tanh(2),0,tanh(2)−tanh(1)] ≈ [0.9640276,0,0.2024334]. The table shows all preactivations and tanh outputs. Ask why context width is encoder width rather than scoring width. Show the previous-state query before the decoder update.
5. **Luong:** Set q = [1,1]. Dot gives [1,1,2]; general with Wa = diag(1,2) gives [1,2,3]. Switch to [1,0], for which the scorers happen to agree. Ask why that agreement does not imply identical functions. Show update → attend → combine → vocabulary head.

## Answers and discussion

All eighteen checks have inline worked reasoning. Numerical tolerance is 0.002; fractions such as 1/3 are accepted. Checks count correct responses, not proof of mastery; ask students to explain. Changing an answer invalidates the previous correct marker. Answers and design notes save in this browser when storage is available. The export button downloads JSON; reset asks before clearing. No student data is uploaded. Print uses the final frame of each player; open desired theory/answer foldouts before printing to include them.

Answer key in order: 1 false; 2 je; 3 three rows; 4 eight coordinates; 5 shrinkage under the toy recurrence only; 6 a fresh information route; 7 second coordinate 3; 8 1/3; 9 no; 10 five rows; 11 previous state; 12 four coordinates; 13 score 2; 14 mix and use an output head; 15 no; 16 zero; 17 Bahdanau attend/update versus Luong update/attend; 18 only a statement about displayed source weights.

For the design challenge, require a complete information route, not just the word “attention.” Reward dimensionally correct matrices, shifted teacher-forcing inputs, masked source padding, distinct source and vocabulary softmaxes, and a held-out negation-omission comparison. Discuss that a visually pleasing map does not establish translation correctness.

## Misconceptions to catch

- Longer sequences use more recurrent steps, not new recurrent weights at every position.
- The baseline final context and per-step attention context have different information routes; attention contexts remain fixed-width vectors.
- “Additive” describes a score network. All forms mix values using a weighted sum.
- Attention weights sum to one over valid source positions for each target step. They are not target-token probabilities.
- Source states are contextual representations, not bare word IDs; no linguistic meaning is assigned to toy coordinate axes.
- Dot needs matching widths; learned general and additive projections can handle unequal widths.
- Classic Bahdanau and Luong differ in both their usual scorer and decoder ordering. Later implementations can recombine these choices.
- Soft attention does not require separately annotated alignments; end-to-end prediction loss supplies gradients.
- This is recurrent encoder–decoder attention, not Transformer self-attention. Classical Luong dot scores here have no √d divisor.

## Editing and verification

`build-page.py` contains all static lesson prose and questions. `model.js` holds pure numerical operations; `storyboards.js` narrations; `scenes.js` original SVGs; `app.js` controls, tables and checks. Shared stylesheet/timeline paths must remain intact when copying offline.

```bash
python3 build-page.py
node build-assets.cjs
npm ci
npm test
```

From the repository root, also run `python3 scripts/check_links.py`. For local preview, serve that root with `python3 -m http.server 8000`. Reference papers and visual inspiration are attributed at the bottom of the worksheet; figures are original, with no copied third-party artwork.
