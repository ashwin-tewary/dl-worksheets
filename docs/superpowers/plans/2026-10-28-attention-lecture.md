# Encoder–decoder and attention lecture

User request: deliver and push an instructor-led worksheet in the existing collection. Audience: first encounter with sequence modelling; no coding prerequisite. Use original numbered SVG diagrams, guided motion with prediction stops, and the existing offline theme/player.

## Lesson design
Use English “I love you” → French “je t’aime” as a running illustrative translation (token boundaries are teaching choices). Begin with order, vectors, recurrent state and variable input/output lengths. Build five six-part lessons: encoder–decoder, fixed-context bottleneck, score/softmax/weighted-sum recipe, Bahdanau additive scoring, Luong multiplicative scoring. Every lesson has a hook and problem visual, explanation/analogy, formula, animation/experiment and three checks with worked answers. End with three synthesis checks and a written design challenge. Never imply that toy states are trained embeddings, attention is guaranteed alignment, or a fixed vector has a literal word limit.

## Implementation and verification
1. Add numerical tests first: stable masked softmax, dot/general/additive scores, weighted contexts, unequal dimensions, recurrence and teacher-forcing inputs.
2. Implement a pure numerical module. Derive all visual numbers from it.
3. Author standalone static HTML/CSS and five original SVG storyboards. Reuse the existing sequence timeline, with pause/next/back/replay/speed/scrub, prediction stops and reduced motion. Add query, target position, scoring and mask controls. Store checks and notes locally; export JSON. Keep core prose available without JS.
4. Add actual DOM interaction tests, plus scene checks for finite SVG output. Review desktop/mobile in a browser, keyboard flow, overflow and print. Run local-link validation.
5. Add instructor pacing, storyboard and numerical answer guidance, source attribution and collection navigation. Commit only this task’s files and push to origin. Verify the remote commit and published route where available.

Choices made for this implementation: buildless HTML/JS, inherited collection colors and typography, five lessons in 100–120 minutes with a shorter 75-minute route in the guide. Original SVGs avoid external image dependencies. Classical recurrent attention is the scope; Transformer self-attention is a closing bridge only.
