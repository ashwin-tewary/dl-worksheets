# Asset manifest

All five diagrams are original vector artwork created by OpenAI Codex for this transfer-learning lecture, 21 September 2026, from the requested educational brief. They were written directly as SVG for exact geometry and arithmetic. No third-party artwork, stock photography, icons, fonts, reference figures or trained model outputs are embedded or reproduced. Conceptual references are listed below; they are not image sources. Attribution is a provenance credit, not an assertion of rights over those references.

## Shared design and integration

- Canvas: **1100×560**, with responsive `viewBox="0 0 1100 560"`.
- Palette: warm cream `#f7f5ef`, dark green `#183c35`, teal `#12655b`, ochre `#bc783d`; pale green, pale sand and white support grouping.
- Typography: system Arial/Helvetica/sans-serif, **18 px minimum** in source coordinates. Scale to full slide width; avoid displaying the figures as small thumbnails when text must be read.
- Standalone SVGs: no scripts, remote resources or raster dependencies. Each supplies `<title>`, `<desc>` and `role="img"` with `aria-labelledby`.
- For HTML `<img>` integration, provide a meaningful `alt` attribute; embedded SVG descriptions are not consistently exposed through external image elements. Suggested alternative text appears in the table.
- All dataset counts, numeric pixel identifiers, feature maps, classifier weights, logits and receptive-field calculations are **schematic exact examples, not trained performance**. They do not report accuracy, calibrated confidence, a dataset measurement or a universal training prescription.

| File | Teaching purpose and exact content | Suggested alt text |
|---|---|---|
| `01-pretrained.svg` | Source and target routes share learned backbone weights; replace the source head with a three-class head for the illustrative 120-image target task. | Reuse a pretrained backbone and replace the source classifier with a new three-class target head. |
| `02-features.svg` | Channels `[[1,3],[2,2]]` and `[[0,2],[4,2]]` each average to 2. With `W=[[1,-0.5],[-0.5,1]]`, `b=[1,1]`, features `[2,2]` produce logits `[2,2]`. | Two channel maps average to features 2 and 2; an illustrated linear classifier gives class logits 2 and 2. |
| `03-freezing.svg` | The solid forward path through the frozen backbone stays active. The ochre optimizer route updates the head only. Distinguishes parameter freezing from BatchNorm mode. | The frozen backbone still computes features; only the trainable head receives parameter updates. |
| `04-augmentation.svg` | A 4×4 grid numbered 1–16 in row-major order is horizontally flipped by reversing each row exactly, using zero-based `X′[r,c]=X[r,3−c]`. Colour moves with values. | Original rows 1–4, 5–8, 9–12 and 13–16 are individually reversed by a horizontal flip; label meaning must remain valid. |
| `05-context.svg` | Three 3×3 stride-1 dilation-1 layers have theoretical receptive-field widths 3, 5 and 7. One global-attention query can mix all nine shown patch tokens. Edges show eligible connections, not equal weights. | Nested CNN receptive fields grow from 3 by 3 to 7 by 7, while a global-attention query connects to all nine patches. |

## Accuracy boundaries

Freezing does not bypass computation. With standard BatchNorm, disabling parameter gradients alone does not freeze running statistics. Augmentation must respect task labels; split originals or related groups before creating variants and use random augmentation only in training for this baseline. CNNs can learn global context; the theoretical receptive field is not the same as effective influence. ViTs are not always superior. The original ViT paper's title refers to its patch construction, not a required patch size for every vision transformer.

## Conceptual references

- [Official PyTorch transfer-learning tutorial](https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)
- [Official Keras transfer-learning guide](https://keras.io/guides/transfer_learning/)
- [Original ViT paper](https://arxiv.org/abs/2010.11929)
- [PyTorch autograd notes](https://docs.pytorch.org/docs/stable/notes/autograd.html)
- [PyTorch BatchNorm2d reference](https://docs.pytorch.org/docs/stable/generated/torch.nn.BatchNorm2d.html)
