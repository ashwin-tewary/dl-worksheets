# From words to meaning — instructor guide

Open `index.html` through the collection or a local static server. No model, font or third-party image download is required. The page reuses the sequence-modelling stylesheet; keep that sibling directory when copying it. The separate student handout prints without the solutions.

## Pacing: 100–120 minutes

| Segment | Minutes | Teaching goal |
| --- | ---: | --- |
| Opening | 7 | Predict what identical word counts cannot tell us |
| Tokenization | 12 | Separate units, addresses and meaning; demonstrate learned merges |
| BoW | 10 | Count exactly; expose order loss |
| TF–IDF | 15 | Separate term frequency from document frequency |
| Embeddings | 14 | Lookup, shape and cosine; retain ordered rows |
| Optional break | 5 | Ask students to restate the unresolved order puzzle |
| CBOW | 17 | Trace a full prediction, loss and genuine update |
| GloVe | 15 | Trace windows to corpus counts to a weighted log-count error |
| Applications and exit | 15 | Choose representations and test their blind spots |

Suggested times sum to 110 minutes without the optional break. For a shorter session, leave derivations folded and assign applications/exit as follow-up; do not rush both training objectives into a single definition.

## How to run each animation

Ask the hook before reading the explanation. Use Play or Step. Each five-frame sequence pauses before its third frame for a prediction; Reveal and continue advances one frame, then the instructor can step or play again. Timeline scrubbing intentionally permits direct inspection. Replay resets the narrative; **Reset weights** separately restores CBOW's parameters. The speed selector changes automatic-frame duration. No scene autoplays on page load. Reduced-motion mode removes transitions without hiding any frame.

The colored numbered pathway highlights the current calculation; all results remain accessible in text and tables. Read one row aloud before advancing. Change one input at a time and ask students to predict the change. “Save my answers” exports browser-local responses to a text file; progress is formative rather than graded.

## Conventions and exact anchors

- Text tokenization lowercases and splits Unicode letters/numbers versus punctuation. Character mode includes spaces. The BPE teaching corpus is low, low, lower, each with ▁ as an end marker. Merges are l+o (3), lo+w (3), low+▁ (2). Tie breaking is deterministic serialized-pair order.
- Shared corpus: D1 `the cat likes milk`; D2 `the dog likes walks`; D3 `the cat likes walks`. Shared vocabulary order: the, cat, dog, likes, milk, walks. BoW's reversal exercise and CBOW use their own explicitly displayed miniature vocabularies.
- TF–IDF: raw counts × [ln((N+1)/(df+1))+1], natural log, no L2 normalization. IDFs in vocabulary order: [1, 1.287682, 1.693147, 1, 1.693147, 1.287682]. Repeating milk in D1 makes its weight 3.386294; adding milk to D2 lowers its IDF to 1.287682.
- Map/retrieval vectors are **hand-designed**, not learned: cat [1,.2], dog [.9,.3], milk [.2,1], walks [.3,.9], kitten [.95,.15]. Cosine of a zero vector is undefined. Retrieval averages known terms only and reports excluded tokens.
- Negation application vectors: good [1,0], not [0,.1], bad [−1,0]. Mean(not good)=[.5,.05], cosine with good≈.995037. Select query good to inspect this deliberately constructed failure. Lexical overlap counts distinct query tokens occurring in a candidate; here queries have one token.
- CBOW vocabulary: the, milk, cat. E = [[1,0],[0,1],[.2,.4]], U = [[.2,−.1],[−.3,.4],[.1,.2]], b = [0,0,0]. Initial h=[.5,.5], z=[.05,.05,.15], p≈[.322043,.322043,.355913], loss≈1.033069. Full softmax, learning rate .2; all gradients computed before the update. Context occurrences, including duplicate IDs, contribute separately. Training one pair does not establish generalization.
- GloVe: radius one, both directions, unit counts, no crossing document boundaries. X[the,cat]=2. For target/context vectors [1,0] and [0,1], biases .25 each, residual=.5−ln2≈−.193147, weight=(2/4)^.75≈.594604, loss≈.022182. Zero counts are omitted. xmax=4 is chosen for the tiny demonstration, not a recommended production default.

## Answer key and discussion

| Check | Answer | Reasoning to listen for |
| --- | --- | --- |
| 0.1 | Token order | Frequencies cannot identify agent and recipient |
| 1.1 | 4 | cats, comma, café, exclamation |
| 1.2 | No semantic inference | IDs are arbitrary addresses |
| 2.1 | 2 | Count both dog occurrences |
| 2.2 | No | Both reversal vectors are [1,1,1] |
| 3.1 | 1.693 | ln(4/2)+1 |
| 3.2 | TF only | A repeated term does not add a document |
| 4.1 | 1,280,000 | V×d, separate from the rest of the model |
| 4.2 | No | Static bank always selects the same row |
| 5.1 | .5 | Mean of the two first coordinates |
| 5.2 | Context → centre | Distinguish CBOW from skip-gram |
| 6.1 | 2 | One dog neighbour for each cat; reverse counts are separate |
| 6.2 | Undefined logarithm | Do not substitute log(0)=0 |
| 7.1 | No | Summation commutes |
| 7.2 | Held-out relevance judgments | Pretty maps are not application evaluation |
| 8.1 | Ordered token-vector matrix | Do not discard information before the sequence model |

For the exit task, accept multiple reasonable systems if they state input units, unknown/empty policies, a relevant held-out evaluation, and a limitation. A TF–IDF baseline plus embedding retrieval comparison is sensible. The role-sensitive system needs order-sensitive processing; static embedding lookup alone is insufficient. Ask for matched reversal examples and negation/ambiguity slices. Do not claim proximity guarantees truth or synonymy.

## Instructor cautions

Separate a **training objective** from a **representation** and a **downstream application**. CBOW and GloVe are ways to learn static vectors. An embedding table is not a contextual sequence model. Symmetric CBOW training can use both sides; causal prediction at inference must not peek at future inputs. Train vocabulary/IDF on training data only. Explain padding masks before averaging batched sequences.

## Verification

Run `npm ci && npm test` in this directory. Model tests pin arithmetic, repeated terms, zero vectors, BPE merges, co-occurrence boundaries, softmax stability and the loss decrease after a gradient step. DOM tests cover rendering, inputs, prediction stops, reset, checks and storage fallback. Run `python3 scripts/check_links.py` from the repository root. Serve that root with `python3 -m http.server 8000` for visual verification.
