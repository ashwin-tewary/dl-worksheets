# Deep Learning · Presentation & Practice Sheets

Interactive material for in-lecture teaching and practice—not laboratory assignments.

**[Open the collection](https://ashwin-tewary.github.io/dl-worksheets/)**

## Lecture presentation sheets

- [Transfer learning: borrow, adapt, see further](presentations/transfer-learning/) — five planned animated explainers plus interactive calculators covering pretrained models, feature extraction, freezing, augmentation, and CNN limitations motivating ViTs; foldable theory, eleven questions with reasoning, five original SVG figures, and an [instructor guide](presentations/transfer-learning/instructor-guide.md).

- [CNN architectures: depth, scale & efficiency](presentations/cnn-architectures/) — shattered gradients, residual connections, ResNet, Inception, and depthwise separable convolutions. Five guided animated walkthroughs, interactive calculators, numbered feature maps, ten discussion checks, a design challenge, and [instructor assets](presentations/cnn-architectures/instructor-guide.md).

Instructor-led pages with theory, live plots, textbook figures, and discussion questions.

- [Regularisation](https://ashwin-tewary.github.io/dl-worksheets/presentations/regularisation/) — L2, L1, dropout, batch normalisation, and early stopping.

- [Weight initialization](https://ashwin-tewary.github.io/dl-worksheets/presentations/initialization/) — symmetry, random scaling, Xavier, and He; interactive 3D visuals, guided layer animations, eleven checks, and browser-local progress.
- [Convolutional networks](https://ashwin-tewary.github.io/dl-worksheets/presentations/cnn/) — why CNNs, kernels, stride, padding, feature maps, pooling, receptive field, translation, AlexNet, and VGG; ten guided labs with a global Numbers / Images switch, a real handwritten-digit example, readable pixel matrices, foldable formulas and theory, smooth patch-by-patch playback, and typed checks.

## Practice sheets

Use during lectures or for independent revision. These are formative activities, not graded assessments.

- [Generalisation](https://ashwin-tewary.github.io/dl-worksheets/practice/generalisation/) — underfit, overfit, bias–variance, and double descent; click-to-fill calculations.
- [Regularisation](https://ashwin-tewary.github.io/dl-worksheets/practice/regularisation/) — worked numerical examples with definitions and textbook references.

The classification describes the primary use: practice sheets can also be projected and discussed in class. The initialization sheet reports learning progress, not a grade. Its numerical model is an ensemble approximation, and its terrain/bowl scenes are explicitly labeled metaphors.

## Repository layout

```text
index.html                         Collection directory
presentations/regularisation/      Generated presentation sheet
practice/generalisation/           Generated practice sheet
practice/regularisation/           Generated practice sheet
presentations/initialization/           Editable standalone HTML, CSS, JS, and tests
presentations/cnn/                      Editable standalone CNN lecture sheet
src/presentations/regularisation/  Presentation markup, styles, and interactions
src/practice/                      Shared theme and topic-specific source modules
scripts/                          Build and local-link verification tools
figs/                             Shared, attributed textbook figures
```

### Editing and rebuilding

Edit the corresponding files in `src/` for the original sheets, then rebuild:

```bash
python3 scripts/build.py
python3 scripts/check_links.py
```

The shared practice stylesheet is tracked explicitly as `src/practice/theme.css`; rebuilds do not extract CSS from generated HTML. Commit the rebuilt HTML alongside source changes because GitHub Pages serves the repository directly.

Initialization and the CNN sheet are standalone: edit `presentations/initialization/` or `presentations/cnn/` (`index.html`, `styles.css`, `model.js`, `app.js`). They need no build step or external JavaScript runtime. Fonts have system fallbacks. The CNN sheet keeps its image sample locally in `app.js` (UCI optical digits, CC BY 4.0, credited on the page), so its visuals work without external model or image downloads. Animated scans reveal each output after the calculation, with replay, pause, step, speed and timeline controls. Controls sit directly above each visual. Feature-map choices update a focused input/kernel/output view, translation and AlexNet compare one stage at a time, and receptive-field growth remains visible beyond the input boundary. On narrow screens, matrix jump buttons keep wide grids navigable. The larger clean image previews sit beside numbered matrices. Its Numbers / Images preference and typed answers are saved in the browser; questions retain their stated data in both modes. To run numerical and interaction tests:

```bash
cd presentations/initialization && npm ci && npm test
cd ../cnn && npm ci && npm test
```

Preview the collection from the repository root with `python3 -m http.server 8000`, then visit `http://localhost:8000/`. GitHub Pages publishes `main` from the repository root; the `.nojekyll` file is retained.

### Existing links

These old addresses redirect to their canonical location and preserve query strings and section anchors:

| Existing URL | Canonical sheet |
| --- | --- |
| `practice/initialization/` | `presentations/initialization/` |
| `lab_regularisation.html` | `presentations/regularisation/` |
| `worksheet_generalisation.html` | `practice/generalisation/` |
| `worksheet_regularisation.html` | `practice/regularisation/` |

The legacy `lab_` URL remains solely for backward compatibility. Figures remain at `figs/` so existing figure links continue to work. Original internal section IDs and JavaScript selectors remain unchanged to preserve behavior and deep links.

The original click-to-fill sheets include glossary bubbles and print support. The initialization sheet includes explanations, playback controls, reduced-motion support, and locally saved progress. Progress from the separate private Sites preview does not transfer across origins to GitHub Pages.

CNN architectures is also standalone: edit `presentations/cnn-architectures/` directly. Run its numerical checks with `node --test presentations/cnn-architectures/*.test.cjs`. No build step is required. The architecture sheet shares `presentations/cnn/styles.css` with the CNN foundation sheet; Google Fonts have system fallbacks.

Transfer learning is standalone HTML/CSS/JavaScript. It shares the CNN theme through `presentations/cnn-architectures/styles.css` and `presentations/cnn/styles.css`. Run exact numerical checks with `node --test presentations/transfer-learning/*.test.cjs`. Serve the repository root for local preview; no build or model download is needed.

The [transfer-learning lecture presentation sheet](presentations/transfer-learning/) embeds its animated demonstrations directly within each learning section, with an accompanying [storyboard guide](presentations/transfer-learning/storyboard-guide.md). Its five sequences move numbered pixels, accumulate features, trace forward and update signals, grow receptive fields, and connect patch tokens. Players provide prediction pauses, speed, scrubbing, stepping, reduced-motion support, and SVG frame downloads.
