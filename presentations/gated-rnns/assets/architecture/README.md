# Architecture image sources

These five locally served PNGs are focused figure excerpts from public Stanford University course PDFs, included beside commentary for teaching and comparison. They are not original worksheet artwork. Attribution does not imply that the source authors endorse this worksheet or grant a blanket reuse license; original rights remain with the respective authors/rightsholders. Follow the linked source terms for further reuse.

## CS231n: recurrent networks and LSTM

**Authors:** Fei-Fei Li, Justin Johnson and Serena Yeung. **Institution:** Stanford University. **Course:** CS231n, Lecture 10, 4 May 2017.

- `rnn.png`: [PDF page 25](https://cs231n.stanford.edu/slides/2017/cs231n_2017_lecture10.pdf#page=25), the unrolled RNN computational graph.
- `lstm.png`: [PDF page 98](https://cs231n.stanford.edu/slides/2017/cs231n_2017_lecture10.pdf#page=98), the LSTM cell and its equations. The source slide cites Hochreiter et al. (1997); the worksheet separately cites the original LSTM and forget-gate papers. Its g matches our candidate. The schematic omits bias terms.
- `memory-path.png`: [PDF page 100](https://cs231n.stanford.edu/slides/2017/cs231n_2017_lecture10.pdf#page=100), three LSTM cells with the direct memory/gradient route. The crop includes the cells and arrows, not the slide's headline. Our caption explicitly explains that forget factors still multiply the direct path.

## CS224n: GRU

**Authors of the notes:** Milad Mohammadi, Rohit Mundra, Richard Socher, Lisa Wang and Amita Kamath. **Course instructors credited in the document:** Christopher Manning and Richard Socher. **Institution:** Stanford University. **Document:** CS224n Lecture Notes, Part V: Language Models, RNN, GRU and LSTM, Winter 2019.

- `gru.png`: [Figure 12, PDF page 12](https://web.stanford.edu/class/cs224n/readings/cs224n-2019-notes05-LM_RNN.pdf#page=12). Focused crop of the gate/candidate/carry diagram; surrounding prose and top explanatory headings omitted. Symbols and connections are unchanged.
- Both this figure and our worksheet use z to retain the old hidden state. The figure uses reset after the recurrent projection; our interactive uses scalar weights, while our vector formula uses reset before the projection. The figure caption calls out this distinction so learners do not assume matrix-level equivalence.

## CS224N/Ling284: bidirectional architecture

**Author:** Christopher Manning. **Institution:** Stanford University. **Course:** CS224N/Ling284, Lecture 6: LSTM RNNs and Neural Machine Translation, Spring 2024.

- `bidirectional.png`: [PDF page 34](https://web.stanford.edu/class/archive/cs/cs224n/cs224n.1246/slides/cs224n-spr2024-lecture06-fancy-rnn.pdf#page=34). The forward and backward feature vectors, concatenations and sentence are retained; the slide heading and callout prose are outside the crop.
- Coloured dots denote feature coordinates, not measured values. The worksheet's following interactive provides the separate numerical example.

## Extraction record

`extraction.json` records each source URL, 1-based PDF page, SHA-256 of the downloaded PDF, crop rectangle in PDF points (top-left origin), render scale and image dimensions. The PNGs were rendered directly from those page regions with PyMuPDF at 3 pixels per point, without redrawing or changing diagram labels. The original full PDFs are linked, not committed. Captions outside the image restore source authorship and explain how to read each diagram.

The original interactive SVG assets in the parent folder retain their separate authorship; `build-assets.cjs` does not overwrite these source excerpts.
