# -*- coding: utf-8 -*-
from pathlib import Path
root = Path(__file__).resolve().parent
css_path = root / "_extracted.css"
if not css_path.exists():
    html0 = (root / "worksheet_generalisation.html").read_text(encoding="utf-8")
    css_path.write_text(html0.split("<style>", 1)[1].split("</style>", 1)[0], encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
extra = r"""
/* ---------- info bubbles on theory terms ---------- */
.termwrap{position:relative;display:inline;white-space:nowrap}
.term{border-bottom:1.2px dotted var(--amber);color:var(--ink);font-weight:650;cursor:pointer}
.ibub{
  display:inline-flex;align-items:center;justify-content:center;
  width:15px;height:15px;margin:0 1px 0 3px;padding:0;vertical-align:4px;
  border-radius:99px;border:1.3px solid var(--blue);background:#fff;
  color:var(--blue);font:700 9px/1 var(--sans);cursor:pointer;
}
.ibub:hover,.ibub.on{background:var(--blue);color:#fff}
.ibub:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
.bubble{
  position:absolute;z-index:90;left:0;top:calc(100% + 10px);
  width:min(380px,78vw);padding:12px 14px 12px;
  background:#fff;border:1.5px solid var(--creamb);border-radius:8px;
  box-shadow:0 12px 28px -12px rgba(22,33,61,.5);
  white-space:normal;text-align:left;font-weight:400;line-height:1.45;
}
.bubble.above{top:auto;bottom:calc(100% + 10px)}
.bubble .bt{font-family:var(--serif);color:var(--ink);font-size:18px;font-weight:700;margin:0 0 5px}
.bubble .bd{font-size:14.5px;color:var(--grey);margin:0;font-family:var(--sans)}
.bubble .bf{font-family:var(--serif);color:var(--ink);font-size:16px;margin:9px 0 0}
.bubble .bs{font-size:12.5px;color:var(--lgrey);margin:8px 0 0;font-style:italic}
.bmore{display:inline-block;margin-top:10px;background:none;border:0;padding:0;
  color:var(--amber);text-decoration:underline;cursor:pointer;font-size:13px;font-family:var(--sans)}
.card.navy .term{color:#fff;border-bottom-color:var(--creamb)}
.card.navy .ibub{border-color:var(--creamb);color:var(--creamb);background:transparent}
.card.navy .ibub.on,.card.navy .ibub:hover{background:var(--creamb);color:var(--ink)}
.gcard-ov{border:1.5px solid var(--rule);border-radius:6px;padding:12px 16px;margin:12px 0;background:#fff}
.gcard-ov.flash{border-color:var(--amber);background:#FFFBF3}
.gcard-ov .bt{font-family:var(--serif);color:var(--ink);font-size:20px;font-weight:700;margin:0 0 4px}
.gcard-ov .bd{font-size:15px;color:var(--grey);margin:0}
.gcard-ov .bf{font-family:var(--serif);color:var(--ink);font-size:17px;margin:8px 0 0}
.gcard-ov .bs{font-size:13px;color:var(--lgrey);margin:8px 0 0;font-style:italic}
.bookfig{margin:18px 0;border:1.5px solid var(--rule);border-radius:6px;overflow:hidden;background:#fff;max-width:920px}
.bookfig img{width:100%;display:block;background:#f7f8fa}
.bookfig .cap,figure.bookfig figcaption{font-size:13.5px;color:var(--lgrey);padding:10px 14px 12px;font-style:italic;line-height:1.45;margin:0}
.wsnav{font-size:14px;margin:0 0 8px}
.wsnav a{color:var(--blue)}
@media print{
  .ibub,.bubble,.bmore{display:none!important}
  .term{border-bottom:0;font-weight:700}
  .bookfig{break-inside:avoid}
}
"""

def build(out_name, parts, title, tb, eyebrow, h1, lede, cite):
    js = "\n".join(p.read_text(encoding="utf-8") for p in parts)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
{css}
{extra}
</style>
</head>
<body>
<div class="topbar">
  <div class="tb">
    <div class="tb-title">{tb}</div>
    <div class="tb-spacer"></div>
    <div class="pwrap">
      <div class="pbar" aria-hidden="true"><i id="pfill"></i></div>
      <div class="pnum" id="pnum">0 / 0 blanks filled</div>
      <div class="psec" id="psec"></div>
    </div>
    <button class="tbtn" id="refbtn" type="button">glossary</button>
  </div>
</div>
<div class="wrap">
  <p class="wsnav"><a href="index.html">all worksheets</a></p>
  <header class="mast">
    <div class="eyebrow">{eyebrow}</div>
    <h1>{h1}</h1>
    <p>{lede}</p>
  </header>
  <main id="doc"></main>
  <footer>
    <span class="fnote">Every value is rounded to 4 decimals at every step, so a calculator reproduces this sheet exactly.</span>
    <button class="dbtn" id="printbtn" type="button">print</button>
    <button class="dbtn" id="resetbtn" type="button">reset all</button>
  </footer>
  <div class="cite">{cite}</div>
</div>
<div class="overlay" id="ov" role="dialog" aria-modal="true" aria-label="Glossary of terms">
  <div class="ovbox">
    <button class="tbtn ovclose" id="ovclose" type="button">close</button>
    <div class="eyebrow">glossary</div>
    <h2 style="font-family:Cambria,Georgia,serif;color:#16213D;font-size:27px;margin:6px 0 4px">Terms used in this sheet</h2>
    <div id="ovbody"></div>
  </div>
</div>
<script>
"use strict";
{js}
</script>
</body>
</html>
"""
    out = root / out_name
    out.write_text(html, encoding="utf-8")
    print("wrote", out, "bytes", out.stat().st_size)

build(
    "worksheet_generalisation.html",
    [root / "ws_part_engine.js", root / "ws_part_content.js", root / "ws_part_ui.js"],
    "Generalisation · Worksheet · Underfit → Overfit → Bias–Variance → Double Descent",
    "Generalisation · Worksheet · Underfit → Overfit → Bias–Variance → Double Descent",
    "deep learning · generalisation",
    "Underfitting, Overfitting, and the Second Descent",
    "Why a small training loss is not the same as having learned the function, how bias and variance split the blame, and why interpolating models are not automatically useless. Fill every blank by clicking. Nothing here is scored. Dotted terms carry an <b>i</b> — open it.",
    """References: C. M. Bishop, <i>Pattern Recognition and Machine Learning</i> (2006), §§1.1 and 3.2;
    I. Goodfellow, Y. Bengio &amp; A. Courville, <i>Deep Learning</i> (2016), §§5.2–5.4 and ch. 7;
    C. M. Bishop &amp; H. Bishop, <i>Deep Learning: Foundations and Concepts</i> (2023), §§4.3 and 9.3.2;
    S. J. D. Prince, <i>Understanding Deep Learning</i> (2023/25), ch. 20.
    Double descent: Belkin et al. (2019); Nakkiran et al. (2020).""",
)

build(
    "worksheet_regularisation.html",
    [root / "reg_part_engine.js", root / "reg_part_content.js", root / "reg_part_ui.js"],
    "Regularisation · Worksheet · L2 → L1 → Dropout → Batch Norm → Early Stopping",
    "Regularisation · Worksheet · L2 → L1 → Dropout → BN → Early Stopping",
    "deep learning · regularisation",
    "Five ways to spend capacity more slowly",
    "L2 shrinks every weight, L1 deletes some of them, dropout deletes activations for a step, batch normalisation re-scales a minibatch, and early stopping deletes training time. Fill every blank by clicking. Nothing here is scored. Dotted terms carry an <b>i</b> — open it. Textbook figures are screenshots of the cited pages.",
    """References: C. M. Bishop, <i>Pattern Recognition and Machine Learning</i> (2006), §§1.1, 3.1.4, 5.5.2;
    I. Goodfellow, Y. Bengio &amp; A. Courville, <i>Deep Learning</i> (2016), ch. 7 and §8.7.1;
    C. M. Bishop &amp; H. Bishop, <i>Deep Learning: Foundations and Concepts</i> (2023), §§7.4.2 and ch. 9;
    S. J. D. Prince, <i>Understanding Deep Learning</i> (2023/25), ch. 9 and §11.4.
    Dropout: Srivastava et al. (2014). Batch normalisation: Ioffe &amp; Szegedy (2015).""",
)
