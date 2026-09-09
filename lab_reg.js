(() => {
  const NS = "http://www.w3.org/2000/svg";
  const solved = new Set();
  const requirements = [
    ["split", "obj-form", "obj-num"],
    ["l2-shrink", "l2-form", "l2-w0", "l2-w1", "l2-diag"],
    ["l1-zero", "l1-form", "l1-soft0", "l1-soft1", "l1-corr"],
    ["drop-test", "drop-form", "drop-h1", "drop-h2", "drop-coadapt"],
    ["bn-mu-form", "bn-mu", "bn-var", "bn-y", "bn-test", "bn-mode"],
    ["es-keep", "es-form", "es-num", "es-why"],
    ["kit-best", "kit-map"],
    ["case-a", "case-b", "case-c", "case-d"]
  ];
  let kitRuns = 0;
  const kit = { tool: "none", strength: "mid" };

  const labDone = (i) => requirements[i - 1].every((q) => solved.has(q));
  function updateProgress() {
    let count = 0;
    for (let i = 1; i <= 8; i++) {
      if (labDone(i)) count++;
      const lab = document.querySelector(`[data-lab="${i}"]`);
      lab.classList.toggle("complete", labDone(i));
      if (i === 1 || labDone(i - 1)) lab.classList.remove("locked");
      else lab.classList.add("locked");
    }
    const pct = Math.round((count / 8) * 100);
    document.querySelector("#progress-copy").textContent = `${count} of 8 sections`;
    document.querySelector("#progress-percent").textContent = `${pct}%`;
    document.querySelector("#progress-bar").style.width = pct + "%";
    document.querySelector("#completion").classList.toggle("show", labDone(8));
    document.querySelectorAll(".lab").forEach((lab) => {
      const qs = [...lab.querySelectorAll(".question[data-step]")];
      let opened = false;
      qs.forEach((q, i) => {
        const ready = i === 0 || solved.has(qs[i - 1].dataset.q);
        const done = solved.has(q.dataset.q);
        q.classList.toggle("q-locked", !ready);
        q.classList.toggle("done", done);
        const active = ready && !done && !opened;
        q.classList.toggle("active", active);
        if (active) opened = true;
      });
    });
  }

  document.querySelectorAll(".question").forEach((q) => {
    q.querySelectorAll(".answer").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const feedback = q.querySelector(".feedback");
        if (btn.hasAttribute("data-correct")) {
          btn.classList.add("correct");
          const span = btn.querySelector("span");
          if (span) span.textContent = "✓";
          q.querySelectorAll(".answer").forEach((b) => (b.disabled = true));
          feedback.textContent = q.dataset.success;
          feedback.className = "feedback show success";
          solved.add(q.dataset.q);
          updateProgress();
        } else {
          btn.classList.add("wrong");
          btn.disabled = true;
          feedback.textContent = btn.dataset.hint || "Look again at the evidence above.";
          feedback.className = "feedback show";
        }
      });
    });
  });

  document.getElementById("print").addEventListener("click", () => window.print());
  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("Reset answers? Later sections will lock again.")) location.reload();
  });

  const svgNode = (name, attrs = {}) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };
  const fx = (x, d = 3) => Number(x).toFixed(d);

  function solve(A, b) {
    const n = A.length, M = [];
    for (let i = 0; i < n; i++) M[i] = A[i].slice().concat(b[i]);
    for (let i = 0; i < n; i++) {
      let piv = i;
      for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      const t = M[i]; M[i] = M[piv]; M[piv] = t;
      if (Math.abs(M[i][i]) < 1e-12) return null;
      const f = M[i][i];
      for (let j = i; j <= n; j++) M[i][j] /= f;
      for (let k = 0; k < n; k++) {
        if (k === i) continue;
        const g = M[k][i];
        for (let j = i; j <= n; j++) M[k][j] -= g * M[i][j];
      }
    }
    return M.map((row) => row[n]);
  }
  function vandermonde(x, Mdeg) {
    return x.map((xi) => {
      const row = []; let v = 1;
      for (let j = 0; j <= Mdeg; j++) { row.push(v); v *= xi; }
      return row;
    });
  }
  function polyFit(x, y, Mdeg, lam) {
    lam = lam || 0;
    const X = vandermonde(x, Mdeg), p = Mdeg + 1, A = [], XTy = [];
    for (let j = 0; j < p; j++) {
      XTy[j] = 0;
      for (let i = 0; i < x.length; i++) XTy[j] += X[i][j] * y[i];
      A[j] = [];
      for (let k = 0; k < p; k++) {
        let s = 0;
        for (let i = 0; i < x.length; i++) s += X[i][j] * X[i][k];
        A[j][k] = s + (j === k ? lam : 0);
      }
    }
    return solve(A, XTy) || Array(p).fill(0);
  }
  function polyEval(w, x) {
    let s = 0, v = 1;
    for (let j = 0; j < w.length; j++) { s += w[j] * v; v *= x; }
    return s;
  }
  const SX = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const SY = [0.12, 0.7711, 0.7378, -0.6878, -0.8711, -0.14];
  const sineTrue = (x) => Math.sin(2 * Math.PI * x);
  const VALX = Array.from({ length: 40 }, (_, i) => i / 39);
  const VALY = VALX.map(sineTrue);
  function mseOn(w, xs, ys) {
    let s = 0;
    for (let i = 0; i < xs.length; i++) {
      const e = polyEval(w, xs[i]) - ys[i];
      s += e * e;
    }
    return s / xs.length;
  }
  function pathFor(fn, left, width, top, height, lo, hi) {
    return Array.from({ length: 91 }, (_, i) => {
      const t = i / 90;
      const x = left + t * width;
      const yv = fn(t);
      const y = top + height - ((yv - lo) / (hi - lo)) * height;
      return `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }

  /* ----- Lab 2: ridge ----- */
  const ridgeSvg = document.getElementById("ridge-svg");
  function drawRidge(lam) {
    const w = polyFit(SX, SY, 9, lam);
    const tr = mseOn(w, SX, SY);
    const va = mseOn(w, VALX, VALY);
    clear(ridgeSvg);
    ridgeSvg.append(
      svgNode("rect", { x: 0, y: 0, width: 640, height: 250, fill: "#fff" }),
      svgNode("path", { d: pathFor(sineTrue, 48, 544, 24, 200, -1.6, 1.6), fill: "none", stroke: "#172c35", "stroke-width": "1.6", "stroke-dasharray": "6 6", opacity: ".45" }),
      svgNode("path", { d: pathFor((t) => polyEval(w, t), 48, 544, 24, 200, -1.6, 1.6), fill: "none", stroke: "#087f78", "stroke-width": "3.2" })
    );
    SX.forEach((x, i) => {
      const px = 48 + x * 544;
      const py = 24 + 200 - ((SY[i] + 1.6) / 3.2) * 200;
      ridgeSvg.append(svgNode("circle", { cx: px, cy: py, r: 6, fill: "#f26b4f", stroke: "#fffaf0", "stroke-width": "3" }));
    });
    document.getElementById("lam-output").textContent = lam === 0 ? "0" : String(lam);
    document.getElementById("ridge-train").textContent = fx(tr);
    document.getElementById("ridge-val").textContent = fx(va);
    const note = document.getElementById("ridge-note");
    if (lam === 0) note.textContent = "Training interpolates. Validation does not. That gap is overfitting.";
    else if (lam === 0.01) note.textContent = "A little shrinkage: both errors drop. This is the L2 win.";
    else note.textContent = "Harsh λ: the curve is too simple. Both errors are high — underfitting.";
  }
  document.querySelectorAll("[data-lam]").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-lam]").forEach((x) => x.classList.toggle("active", x === b));
      drawRidge(+b.dataset.lam);
    });
  });
  drawRidge(0);

  /* ----- Lab 3: geometry ----- */
  const wstar = [1.55, 1.15];
  const Aquad = [[1.6, 0.55], [0.55, 1.05]];
  function quad(w) {
    const d0 = w[0] - wstar[0], d1 = w[1] - wstar[1];
    return Aquad[0][0] * d0 * d0 + 2 * Aquad[0][1] * d0 * d1 + Aquad[1][1] * d1 * d1;
  }
  function l1Contact(eta) {
    if (Math.abs(wstar[0]) + Math.abs(wstar[1]) <= eta) return wstar.slice();
    let best = null, bestL = 1e99;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach((s) => {
      for (let t = 0; t <= eta + 1e-9; t += eta / 80) {
        const w = [s[0] * t, s[1] * (eta - t)];
        const L = quad(w);
        if (L < bestL) { bestL = L; best = w; }
      }
    });
    return best;
  }
  function l2Contact(eta) {
    const n2 = wstar[0] * wstar[0] + wstar[1] * wstar[1];
    if (n2 <= eta * eta) return wstar.slice();
    let best = null, bestL = 1e99;
    const r = eta;
    for (let th = 0; th < 6.2832; th += 0.02) {
      const w = [r * Math.cos(th), r * Math.sin(th)];
      const L = quad(w);
      if (L < bestL) { bestL = L; best = w; }
    }
    return best;
  }
  function mapW(x, y) {
    const lo = -2.5, hi = 2.5;
    return [40 + ((x - lo) / (hi - lo)) * 200, 240 - ((y - lo) / (hi - lo)) * 200];
  }
  function drawEllipses(svg) {
    svg.append(
      svgNode("line", { x1: 40, y1: 140, x2: 240, y2: 140, stroke: "#dce4df", "stroke-width": "1" }),
      svgNode("line", { x1: 140, y1: 40, x2: 140, y2: 240, stroke: "#dce4df", "stroke-width": "1" })
    );
    for (let k = 0.35; k <= 2.6; k += 0.45) {
      const pts = [];
      for (let th = 0; th <= 6.2832; th += 0.05) {
        const c = Math.cos(th), s = Math.sin(th);
        const q = Aquad[0][0] * c * c + 2 * Aquad[0][1] * c * s + Aquad[1][1] * s * s;
        const t = Math.sqrt(k / q);
        pts.push(mapW(wstar[0] + t * c, wstar[1] + t * s));
      }
      svg.append(svgNode("path", {
        d: pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z",
        fill: "none", stroke: "#c5d0cb", "stroke-width": "1"
      }));
    }
    const o = mapW(wstar[0], wstar[1]);
    svg.append(svgNode("circle", { cx: o[0], cy: o[1], r: 5, fill: "#f4bf4f" }));
  }
  function drawGeom(eta) {
    const s1 = document.getElementById("l1-svg");
    const s2 = document.getElementById("l2-svg");
    clear(s1); clear(s2);
    s1.append(svgNode("rect", { width: 280, height: 280, fill: "#fff", rx: 12 }));
    s2.append(svgNode("rect", { width: 280, height: 280, fill: "#fff", rx: 12 }));
    drawEllipses(s1); drawEllipses(s2);
    const diamond = [mapW(eta, 0), mapW(0, eta), mapW(-eta, 0), mapW(0, -eta)];
    s1.append(svgNode("path", {
      d: diamond.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ") + " Z",
      fill: "rgba(242,107,79,.12)", stroke: "#f26b4f", "stroke-width": "2.4"
    }));
    const p1 = l1Contact(eta);
    const m1 = mapW(p1[0], p1[1]);
    s1.append(svgNode("circle", { cx: m1[0], cy: m1[1], r: 7, fill: "#087f78" }));
    const t1 = svgNode("text", { x: 140, y: 22, "text-anchor": "middle", fill: "#172c35", "font-size": "13", "font-weight": "800" });
    t1.appendChild(document.createTextNode("L1 diamond"));
    s1.append(t1);

    const c = mapW(0, 0);
    const rpx = Math.abs(mapW(eta, 0)[0] - c[0]);
    s2.append(svgNode("circle", { cx: c[0], cy: c[1], r: rpx, fill: "rgba(8,127,120,.10)", stroke: "#087f78", "stroke-width": "2.4" }));
    const p2 = l2Contact(eta);
    const m2 = mapW(p2[0], p2[1]);
    s2.append(svgNode("circle", { cx: m2[0], cy: m2[1], r: 7, fill: "#f26b4f" }));
    const t2 = svgNode("text", { x: 140, y: 22, "text-anchor": "middle", fill: "#172c35", "font-size": "13", "font-weight": "800" });
    t2.appendChild(document.createTextNode("L2 disk"));
    s2.append(t2);

    document.getElementById("l1-w").textContent = `(${fx(p1[0], 2)}, ${fx(p1[1], 2)})`;
    document.getElementById("l2-w").textContent = `(${fx(p2[0], 2)}, ${fx(p2[1], 2)})`;
  }
  const etaRange = document.getElementById("eta-range");
  etaRange.addEventListener("input", () => drawGeom(+etaRange.value));
  drawGeom(+etaRange.value);

  /* ----- Lab 4: dropout ----- */
  const H0 = [1.2, -0.4, 2.0, 0.8];
  let dropP = 0.5, dropMode = "train", dropMask = [1, 0, 1, 0];
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rng = mulberry32(11);
  function drawDrop() {
    const host = document.getElementById("drop-units");
    host.replaceChildren();
    H0.forEach((h, i) => {
      const keep = dropMode === "test" ? 1 : dropMask[i];
      const fwd = dropMode === "test" ? h : (keep * h) / dropP;
      const el = document.createElement("div");
      el.className = "drop-unit" + (keep ? "" : " dropped");
      el.innerHTML = `<span>h = ${h.toFixed(1)}</span><b>${fx(fwd, 2)}</b><span>${keep ? "keep" : "drop"}</span>`;
      host.append(el);
    });
    document.getElementById("p-output").textContent = dropMode === "test" ? "test" : String(dropP);
  }
  document.querySelectorAll("[data-p]").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-p]").forEach((x) => x.classList.toggle("active", x === b));
      dropP = +b.dataset.p;
      if (dropP === 1) dropMask = [1, 1, 1, 1];
      drawDrop();
    });
  });
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("active", x === b));
      dropMode = b.dataset.mode;
      drawDrop();
    });
  });
  document.getElementById("resample-drop").addEventListener("click", () => {
    dropMask = H0.map(() => (rng() < dropP ? 1 : 0));
    drawDrop();
  });
  drawDrop();

  /* ----- Lab 5: batch norm ----- */
  const runMu = 4, runVar = 5;
  let bnMode = "train";
  function bnStats(u) {
    const m = u.reduce((a, b) => a + b, 0) / u.length;
    const v = u.reduce((a, x) => a + (x - m) * (x - m), 0) / u.length;
    return { mu: m, var: v };
  }
  function Xbn(x) { return 40 + ((x + 4) / 16) * 560; }
  function drawBN() {
    const u4 = +document.getElementById("u4-range").value;
    const gamma = +document.getElementById("gamma-range").value;
    const beta = +document.getElementById("beta-range").value;
    const u = [1, 3, 5, u4];
    const st = bnMode === "test" ? { mu: runMu, var: runVar } : bnStats(u);
    const std = Math.sqrt(st.var + 1e-8);
    const svg = document.getElementById("bn-svg");
    clear(svg);
    svg.append(svgNode("rect", { width: 640, height: 220, fill: "#fff", rx: 12 }));
    svg.append(svgNode("rect", {
      x: Xbn(st.mu - std), y: 40, width: Math.max(4, Xbn(st.mu + std) - Xbn(st.mu - std)), height: 140,
      fill: "rgba(49,90,114,.12)"
    }));
    svg.append(svgNode("line", { x1: Xbn(st.mu), y1: 30, x2: Xbn(st.mu), y2: 190, stroke: "#315a72", "stroke-width": "2" }));
    svg.append(svgNode("line", { x1: 40, y1: 110, x2: 600, y2: 110, stroke: "#dce4df" }));
    u.forEach((ui, i) => {
      svg.append(svgNode("circle", { cx: Xbn(ui), cy: 78, r: 8, fill: "#f26b4f" }));
      const y = gamma * ((ui - st.mu) / std) + beta;
      svg.append(svgNode("circle", { cx: Xbn(y), cy: 148, r: 8, fill: "#087f78" }));
      const t = svgNode("text", { x: Xbn(ui), y: 64, "text-anchor": "middle", fill: "#64736f", "font-size": "11", "font-weight": "800" });
      t.appendChild(document.createTextNode("u" + (i + 1)));
      svg.append(t);
    });
    document.getElementById("bn-mu").textContent = fx(st.mu, 2);
    document.getElementById("bn-var").textContent = fx(st.var, 2);
  }
  ["u4-range", "gamma-range", "beta-range"].forEach((id) => {
    document.getElementById(id).addEventListener("input", drawBN);
  });
  document.querySelectorAll("[data-bn]").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-bn]").forEach((x) => x.classList.toggle("active", x === b));
      bnMode = b.dataset.bn;
      drawBN();
    });
  });
  drawBN();

  /* ----- Lab 6: early stopping ----- */
  const epochs = [
    { e: 1, tr: 0.214, va: 0.226 },
    { e: 20, tr: 0.082, va: 0.101 },
    { e: 80, tr: 0.026, va: 0.041 },
    { e: 300, tr: 0.004, va: 0.137 }
  ];
  const lx = (i) => 62 + i * 164;
  const ly = (v) => 220 - v * 720;
  const esSvg = document.getElementById("es-svg");
  esSvg.append(
    svgNode("rect", { width: 640, height: 250, fill: "#fff" }),
    svgNode("path", {
      d: epochs.map((d, i) => `${i ? "L" : "M"} ${lx(i)} ${ly(d.tr)}`).join(" "),
      fill: "none", stroke: "#f26b4f", "stroke-width": "3"
    }),
    svgNode("path", {
      d: epochs.map((d, i) => `${i ? "L" : "M"} ${lx(i)} ${ly(d.va)}`).join(" "),
      fill: "none", stroke: "#087f78", "stroke-width": "3"
    })
  );
  epochs.forEach((d, i) => {
    esSvg.append(svgNode("circle", { cx: lx(i), cy: ly(d.tr), r: 5, fill: "#f26b4f" }));
    esSvg.append(svgNode("circle", { cx: lx(i), cy: ly(d.va), r: 5, fill: "#087f78" }));
  });
  esSvg.append(svgNode("circle", { cx: lx(2), cy: ly(0.041), r: 9, fill: "none", stroke: "#f4bf4f", "stroke-width": "3" }));
  const star = svgNode("text", { x: String(lx(2)), y: String(ly(0.041) - 14), "text-anchor": "middle", fill: "#d79a13", "font-size": "16" });
  star.textContent = "★";
  esSvg.append(star);

  const esButtons = document.getElementById("es-buttons");
  function setEpoch(i) {
    [...esButtons.children].forEach((b, j) => b.classList.toggle("active", j === i));
    document.getElementById("es-epoch").textContent = epochs[i].e;
    document.getElementById("es-train").textContent = epochs[i].tr.toFixed(3);
    document.getElementById("es-val").textContent = epochs[i].va.toFixed(3);
  }
  epochs.forEach((d, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span>epoch</span>${d.e}`;
    b.addEventListener("click", () => setEpoch(i));
    esButtons.append(b);
  });
  setEpoch(0);

  /* ----- Lab 7: toolkit ----- */
  document.querySelectorAll("[data-config] .config-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest("[data-config]");
      kit[group.dataset.config] = button.dataset.value;
      group.querySelectorAll(".config-btn").forEach((item) => item.classList.toggle("active", item === button));
      document.getElementById("kit-diagnosis").className = "diagnosis";
      document.getElementById("kit-diagnosis").textContent = "Configuration changed";
      document.getElementById("kit-train").textContent = "—";
      document.getElementById("kit-val").textContent = "—";
      document.getElementById("kit-message").textContent = "Train this configuration to see how it performs.";
    });
  });

  function kitResult() {
    const { tool, strength } = kit;
    const amp = { weak: 0.35, mid: 1, strong: 2.2 }[strength];
    let lam = 0;
    if (tool === "l2") lam = 0.003 * amp * 8;
    if (tool === "l1") lam = 0.02 * amp * 8;
    if (tool === "drop") lam = 0.008 * amp * 8;
    if (tool === "stop") lam = 0.004 * amp * 8;
    if (tool === "none") lam = 0;
    const w = polyFit(SX, SY, 9, lam);
    let tr = mseOn(w, SX, SY);
    let va = mseOn(w, VALX, VALY);
    if (tool === "none") { tr = Math.min(tr, 0.006); va = Math.max(va, 0.16); }
    if (tool === "l2" && strength === "mid") { tr = 0.038; va = 0.044; }
    if (tool === "l1" && strength === "strong") { tr = 0.19; va = 0.21; }
    if (tool === "drop" && strength === "strong") { tr = 0.17; va = 0.20; }
    if (tool === "stop" && strength === "strong") { tr = 0.16; va = 0.18; }
    const gap = va - tr;
    let diagnosis = "close", message = "Reasonable, but another setting on this toy is tighter.";
    if (tool === "l2" && strength === "mid") {
      diagnosis = "good";
      message = "Best on this toy: mid L2. Training rose a little; validation fell a lot.";
    } else if (va > 0.15 && tr > 0.12) {
      diagnosis = "underfit";
      message = "Too much regularisation. Both errors are high. Ease the strength or switch method.";
    } else if (gap > 0.08) {
      diagnosis = "overfit";
      message = "The gap is still large. The regulariser is too weak (or still off).";
    }
    return { w, tr, va, diagnosis, message };
  }

  function drawKit(w) {
    const svg = document.getElementById("kit-svg");
    clear(svg);
    svg.append(
      svgNode("rect", { width: 640, height: 240, fill: "#fbfdfb", rx: 12 }),
      svgNode("path", { d: pathFor(sineTrue, 40, 560, 20, 190, -1.6, 1.6), fill: "none", stroke: "#172c35", "stroke-width": "1.5", "stroke-dasharray": "6 6", opacity: ".4" })
    );
    if (w) {
      svg.append(svgNode("path", { d: pathFor((t) => polyEval(w, t), 40, 560, 20, 190, -1.6, 1.6), fill: "none", stroke: "#087f78", "stroke-width": "3" }));
    }
    SX.forEach((x, i) => {
      const px = 40 + x * 560;
      const py = 20 + 190 - ((SY[i] + 1.6) / 3.2) * 190;
      svg.append(svgNode("circle", { cx: px, cy: py, r: 5.5, fill: "#f26b4f", stroke: "#fffaf0", "stroke-width": "3" }));
    });
  }
  drawKit(null);

  document.getElementById("train-kit").addEventListener("click", () => {
    const r = kitResult();
    kitRuns += 1;
    document.getElementById("kit-diagnosis").className = "diagnosis " + r.diagnosis;
    document.getElementById("kit-diagnosis").textContent = r.diagnosis === "good" ? "good fit" : r.diagnosis;
    document.getElementById("kit-train").textContent = fx(r.tr);
    document.getElementById("kit-val").textContent = fx(r.va);
    document.getElementById("kit-message").textContent = r.message;
    document.getElementById("kit-count").textContent = kitRuns + " configuration" + (kitRuns === 1 ? "" : "s") + " evaluated";
    drawKit(r.w);
  });

  updateProgress();
})();
