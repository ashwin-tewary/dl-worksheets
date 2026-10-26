# Text representations implementation plan

> Implement inline using superpowers:executing-plans. User approved the design and requested creation and push.

**Goal:** Seven complete introductory visual lessons, integrated into the collection.
**Architecture:** Standalone page; pure numerical module; shared guided player; original HTML/SVG teaching figures.
**Tech stack:** HTML/CSS, browser JavaScript, Node test runner.
**Spec:** ../specs/2026-10-26-text-representations-design.md

## Constraints and review focus
No external runtime downloads. Readable numeric tables. Distinguish toy vectors from learned results. Explicit TF–IDF and co-occurrence conventions. Handle empty documents, unknown tokens, zero-norm cosine, repeated terms, paused/reset animations, disabled storage and narrow screens.

## Tasks
- [x] Numerical foundations: model.js exports tokenization, BPE merges, counts, tfidf, cosine, CBOW forward/update, co-occurrence and GloVe term. Write model.test.cjs, observe failure, implement and pass. Pin exact arithmetic and gradient descent behavior.
- [x] Lesson content: index.html, styles.css, instructor-guide.md and storyboard-guide.md. Seven hook/problem/explanation/formula/lab/questions sequences; opening and exit challenge; at least 16 checks and detailed worked answers.
- [x] Interactions: app.js uses the model for every displayed calculation; reusable playback with prediction stop, replay/step/speed/scrub. Per-lesson controls, saved answers, export and print. DOM tests exercise playback, recalculation and feedback.
- [x] Deliverables: printable student-handout.html; README and collection card. Verify source links and primary references.
- [x] Verify numerical/DOM tests, repository links, desktop/mobile/reduced motion/print; review diff, commit and push default branch. Report evidence and any unverified deployment.

## Verification ledger

Numerical tests initially failed with the absent model module; then 8/8 passed. DOM verification expanded to 18 combined tests. Additional regression tests reproduced invalid JSON storage and missing lexical/negation comparison before their fixes; 18/18 pass after fixes. Independent review checked models/content and found the application demonstration gap, now covered numerically. Desktop and 390px mobile browser checks passed without page overflow. Root link check passes across 15 pages. All 124 tests pass across initialization (14), CNN (25), CNN architectures (12), transfer learning (16), sequence modelling (27), gated RNNs (12) and text representations (18). Existing suites were run from their own directories because initialization tests resolve model files relative to cwd.
