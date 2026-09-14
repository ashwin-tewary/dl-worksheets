# Deep Learning · Presentation & Practice Sheets

Interactive material for in-lecture teaching and practice—not laboratory assignments.

**[Open the collection](https://ashwin-tewary.github.io/dl-worksheets/)**

## Lecture presentation sheets

Instructor-led pages with theory, live plots, textbook figures, and discussion questions.

- [Regularisation](https://ashwin-tewary.github.io/dl-worksheets/presentations/regularisation/) — L2, L1, dropout, batch normalisation, and early stopping.

## Practice sheets

Use during lectures or for independent revision. These are formative activities, not graded assessments.

- [Generalisation](https://ashwin-tewary.github.io/dl-worksheets/practice/generalisation/) — underfit, overfit, bias–variance, and double descent; click-to-fill calculations.
- [Regularisation](https://ashwin-tewary.github.io/dl-worksheets/practice/regularisation/) — worked numerical examples with definitions and textbook references.
- [Weight initialization](https://ashwin-tewary.github.io/dl-worksheets/practice/initialization/) — symmetry, random scaling, Xavier, and He; interactive 3D visuals, guided layer animations, eleven checks, and browser-local progress.

The classification describes the primary use: practice sheets can also be projected and discussed in class. The initialization sheet reports learning progress, not a grade. Its numerical model is an ensemble approximation, and its terrain/bowl scenes are explicitly labeled metaphors.

## Repository layout

```text
index.html                         Collection directory
presentations/regularisation/      Generated presentation sheet
practice/generalisation/           Generated practice sheet
practice/regularisation/           Generated practice sheet
practice/initialization/           Editable standalone HTML, CSS, JS, and tests
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

Initialization is standalone: edit `practice/initialization/index.html`, `styles.css`, `model.js`, or `app.js`. It needs no build step or external JavaScript runtime. Fonts have system fallbacks. To run its numerical and interaction tests:

```bash
cd practice/initialization
npm ci
npm test
```

Preview the collection from the repository root with `python3 -m http.server 8000`, then visit `http://localhost:8000/`. GitHub Pages publishes `main` from the repository root; the `.nojekyll` file is retained.

### Existing links

These old addresses redirect to their canonical location and preserve query strings and section anchors:

| Existing URL | Canonical sheet |
| --- | --- |
| `lab_regularisation.html` | `presentations/regularisation/` |
| `worksheet_generalisation.html` | `practice/generalisation/` |
| `worksheet_regularisation.html` | `practice/regularisation/` |

The legacy `lab_` URL remains solely for backward compatibility. Figures remain at `figs/` so existing figure links continue to work. Original internal section IDs and JavaScript selectors remain unchanged to preserve behavior and deep links.

The original click-to-fill sheets include glossary bubbles and print support. The initialization sheet includes explanations, playback controls, reduced-motion support, and locally saved progress. Progress from the separate private Sites preview does not transfer across origins to GitHub Pages.
