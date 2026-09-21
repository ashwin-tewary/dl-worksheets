# Original sequence-modelling figures

All figures are original vector drawings generated from the worksheet's deterministic numerical examples. No external image assets or fonts. Numeric values are SVG text, not rasterized pixels.

- [01-order.svg](01-order.svg): Three numbered binary frames. Reverse their order to reverse motion; the time-averaged image stays unchanged.
- [02-tasks.svg](02-tasks.svg): One-hot inputs feed recurrent states. This exported frame shows one review label after the final state; the worksheet also shows token tags and shifted next-token targets.
- [03-state.svg](03-state.svg): The third tanh update for inputs [1,0,1], input weight 1, recurrent weight 0.5, bias 0 and initial state 0. Values displayed to three decimals.
- [04-unroll.svg](04-unroll.svg): Four uses of one parameter bank. With input width 3, hidden width 2 and output width 2 there are 18 parameters, including biases.
- [05-memory.svg](05-memory.svg): A clue passes through 20 zero-input linear updates with recurrent weight 0.8. The final state is approximately 0.011529; this is not an accuracy.
- [06-gradient.svg](06-gradient.svg): Backward sensitivity through 20 linear links of derivative 0.8. The vertical axis is logarithmic. The footer supplies separate scalar parameter-gradient clipping examples; the plotted path is never clipped.

Regenerate with `node presentations/sequence-modelling/build-assets.cjs` from the repository root. The gallery is suitable for projection, print or importing figures into slides. Downloaded frames contain self-contained SVG styles.
