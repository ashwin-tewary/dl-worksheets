# Lecture design: From words to meaning

## Intent and delivery
Create `presentations/text-representations/` in ashwin-tewary/dl-worksheets, with a collection card and README entry. Standalone HTML, CSS and JavaScript, matching the existing cream/green editorial theme; no model downloads or build step. Intended for students meeting sequence modelling for the first time. Instructor-led, approximately 100–120 minutes including practice, with a suggested break after embeddings. This duration is a proposed default.

## Opening: why numbers are not enough
Begin with “dog bites person” versus “person bites dog”: identical words, different events. Then “good” versus “excellent”: different tokens, related meanings. Keep both puzzles visible as the lecture's unresolved questions. Set objectives: choose token units, compute a count vector and TF–IDF weights, trace an embedding lookup and a CBOW prediction, explain what GloVe learns, and select an application with a defensible evaluation.

Explain sequence, timestep, vocabulary, token ID, vector and context using a running miniature corpus. Token IDs are addresses, not quantities or semantic distances. Distinguish document representations from a sequence of token vectors.

## Required format in each lesson
1. Textual hook with an accompanying visual puzzle.
2. Explainer diagram exposing the limitation.
3. Plain-language solution and an analogy with its limits.
4. Formula with every symbol defined and a worked numerical example.
5. A guided animated walkthrough followed by a controllable experiment.
6. At least two understanding checks, with answers and worked reasoning.
7. Clearly marked foldable detail for derivations, edge cases and additional examples.

## Seven lessons

### 1. Tokenization: decide what one step means
Compare word, character and illustrative subword segmentations of the same input, including punctuation and an unfamiliar word. Animate text → boundaries → tokens → IDs. Explain that the displayed subword rule is a teaching example, not a real BPE tokenizer. Include a small learned-merge BPE walkthrough with a displayed training corpus, pair frequencies, deterministic tie breaking and merge table. Formula: tokenize(x) = (t1,…,tL), IDs = vocabulary lookup; E lookup comes later. Controls change sample and segmentation; compare sequence length and vocabulary tradeoffs. Discuss unknown tokens, casing, multilingual text, padding versus unknown tokens, attention masks, and fitting preprocessing on training data.

### 2. Bag of Words: count evidence, lose order
Animate increments into a labeled vocabulary/count table. Compare the two reversed sentences and show the identical resulting vector. Formula xj = sum over tokens of indicator(token = vocabulary[j]). Let students edit/select a document and switch counts/binary presence. Show sparsity, vocabulary size, unknown handling and how n-grams recover some local order while increasing dimensionality. Do not remove negation casually.

### 3. TF–IDF: common is not always informative
Use a fully displayed three-document corpus. Animate counts → document frequency → IDF → product. Adopt one explicit convention: raw-count TF, smoothed IDF = ln((N+1)/(df+1))+1; no automatic vector normalization. Every number in the table is visible and recomputed. Toggle a repeated word versus a word added to another document to distinguish TF from DF. Detail alternative conventions, optional L2 normalization, zero vectors, and training-only fitting. Explain TF–IDF is still order blind.

### 4. Word embeddings: learn useful coordinates
Contrast one-hot vectors with a small, explicitly hand-designed embedding matrix. Animate token ID → selected row → sequence matrix. Display full dimensions and readable values. Formula e_t = E[id_t], E in R^(V×d), plus cosine similarity with a zero-norm guard. A two-dimensional labeled semantic map is illustrative, not a projection of a claimed trained model; show computed similarities from its actual vectors. Explain dimensions need not have human labels and static embeddings give “bank” one row regardless of context. Embeddings preserve order only when their sequence is retained; averaging discards it.

### 5. CBOW: use neighbours to learn a missing word
Animate context selection → row lookup → mean → output scores → softmax → target loss → an actual gradient update. Formula h = mean(context embeddings), z = Uh+b, p = softmax(z), loss = −ln p(target). Keep separate input and output matrices visible with shapes. A tiny full-softmax training example supports exact arithmetic; detail negative sampling as a different training objective used for scalability. Controls change window/example, step updates and reset. Distinguish context aggregation from a sequence model, and CBOW from skip-gram.

### 6. GloVe: learn from the corpus-wide neighbourhood
Animate a symmetric fixed-window co-occurrence matrix with a declared counting convention, then select one nonzero pair and compute its objective term. Formula J = sum f(Xij)(wi·wtilde_j + bi + btilde_j − ln Xij)^2 with standard piecewise weighting. Show target/context vectors and biases separately. Compute X from the displayed corpus rather than inventing counts. Explain zero-count pairs are omitted, local windows create global corpus statistics, and final embedding conventions vary. Contrast GloVe's weighted log-count regression with CBOW's predictive objective; neither guarantees perfect analogies.

### 7. Applications: use proximity with care
Show semantic retrieval with selectable query vectors and ranked cosine scores. Use explicitly illustrative vectors and lexical-overlap comparisons without claiming learned performance. Demonstrate sentence averaging and an order/negation failure; include a polysemy example and bias/domain mismatch discussion. Formula document vector = mean of token vectors, score = cosine(query, document). Cover classification, nearest neighbours, recommendation and semantic search, with evaluation on held-out data. Bridge to the next lesson: a sequence model can use ordered token embeddings and context, while pooling cannot recover discarded order.

## Shared numerical specification
Use one exported data module for corpus, ordered vocabulary and initial matrices, consumed by visuals, numerical models and tests. Freeze the corpus and conventions before writing questions. CBOW uses a declared small learning rate and simultaneous gradients from the pre-update state. GloVe uses radius-one windows, both directions, unit weights, no crossing document boundaries, and explicitly declared weighting constants. Every scene caption identifies its dataset and convention. This is a standalone foundations lecture; link existing sequence-modelling and gated-RNN sheets as follow-on material without requiring prior completion.

## Teaching and interaction assets
Seven narrated, preplanned sequences with Play/Pause, Step, Replay, speed and timeline scrubbing; prediction pauses before key reveals. No automatic playback on page load. Reduced-motion preference changes transitions while preserving all states. Accessible text equivalents and table captions. Numerical matrices retain labels and readable numbers at projection size; horizontal scroll on small screens. All core teaching visuals are original HTML/SVG, with references and inspiration credited rather than copied third-party images.

At least 16 checks including an opening prediction, two per lesson, and a synthesis task. Numerical checks use tolerances; conceptual checks include worked reasoning. Browser-local answer persistence has a graceful fallback when storage is unavailable. Include print styles, instructor guide with pacing/answers, storyboard narration and a printable student handout. No grading or personal-data collection.

## Sources to verify during implementation
Stanford GloVe paper and project; original word2vec paper; Stanford information retrieval text for weighting; official tokenizer documentation; Polo Club Transformer Explainer as visual-interaction inspiration. Credit the existing transfer-learning worksheet as a design reference.

## Verification and publication
Test numerical functions against hand-computed examples, including repeated words, document-frequency changes, cosine zero vectors, stable softmax and gradient direction. Test playback reset/step/scrub, controls, answer feedback and saved answers. Inspect desktop and mobile rendering, reduced motion and print. Run repository local-link checks and existing affected checks. Commit only the new worksheet and directory/documentation changes, then push to the repository's existing default branch as requested; report an authentication or branch-policy blocker accurately if encountered.
