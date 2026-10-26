# Seven guided storyboards

Every sequence has five numbered frames, manual step, play/pause, replay, timeline scrubbing and speed. A prediction stop appears between frames 2 and 3 when stepping or playing. Scrubbing can bypass it for review. Narration below supplements the visible frame text. All figures are original HTML/SVG and all numerical outputs use model.js.

## 1. Tokenization — choose the units
1. Show the raw string. Ask what one timestep should contain.
2. Separate tokens using the selected rule; compare character spaces with punctuation-separated words.
3. **Predict:** does a bigger ID have more meaning? Reveal the first-seen toy vocabulary IDs; explicitly reject the inference.
4. Switch to tiny BPE. Reveal learned pair merges and frequencies, one at a time. The first pair l+o occurs three times.
5. Compare resulting pieces and discuss sequence-length/vocabulary tradeoffs. Explain the boundary marker and the difference between learning and applying merges.

## 2. BoW — watch the bag forget
1. Read the sentence; fix coordinate order [dog,bites,person].
2. Reveal the dog count. Two occurrences should yield 2 in the repetition example.
3. **Predict:** will reversal change the final vector? Reveal the bites coordinate.
4. Reveal the person coordinate, including a zero when absent.
5. Put the two role reversals beside one another: [1,1,1] for both. Switch to binary presence, then explain which additional information it loses.

## 3. TF–IDF — make common clues less distinctive
1. Show three complete documents; ask students to identify ubiquitous versus selective terms.
2. Reveal the count table, with every vocabulary term labeled.
3. **Predict:** does repetition increase df? Reveal document frequencies; count presence only once per document.
4. Apply the stated natural-log smoothed IDF. Contrast 1, 1.288 and 1.693.
5. Multiply TF by IDF. Compare “repeat milk” with “spread milk”: one changes TF; the other changes corpus rarity.

## 4. Embeddings — from addresses to coordinates
1. Show orthogonal one-hot rows; cat and kitten have zero cosine.
2. Replace them with a labeled dense table. Emphasize hand-designed illustration.
3. **Predict:** is embedding width the vocabulary size? Reveal an ordered L×d sequence matrix and its dimensions.
4. Plot the same vectors; change the compared word and calculate cosine from the actual coordinates.
5. Ask about bank in two contexts. Distinguish static lookup, contextual encoding and order-blind pooling.

## 5. CBOW — one genuine update
1. Show context and observed target cat in the three-token vocabulary. Change the context window if desired.
2. Average input rows to h; the default is [.5,.5].
3. **Predict:** which probability should increase? Reveal separate output table U, biases and scores.
4. Show probability bars, exact softmax values and target loss.
5. Display g=p−onehot(cat), trace the backward correction, then press Train one step. Watch actual weights, probabilities and loss change; Reset weights restores the initial example. Repeated context IDs accumulate gradient contributions.

## 6. GloVe — corpus ledger to objective
1. Highlight target cat and its two neighbours in the first document. Explain sliding to every target and respecting document boundaries.
2. Reveal the fully aggregated, labeled target-by-context matrix.
3. **Predict:** what about zero counts? Select a pair; read its actual X entry.
4. Compare log X with dot product plus biases. Change the target bias and predict the residual's sign.
5. Apply the weighting and squared residual. Select a zero pair to demonstrate omission without ever evaluating log(0).

## 7. Applications — nearby is not enough
1. Show query kitten and its illustrative vector.
2. Read candidate vectors; identify related coordinates despite no exact token overlap.
3. **Predict:** does a high cosine guarantee relevance? Reveal descending similarity scores next to lexical-overlap counts.
4. Switch to document means and show excluded terms; an all-unknown document has no score.
5. Return to role reversal and negation. Select query good: inspect vectors for good, not and bad, the mean [.5,.05] for not good, and its misleading cosine .995 with good. A mean has no route to reconstruct order. Hand off ordered token vectors to the next lesson on sequence models.
