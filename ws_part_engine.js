"use strict";
function nota(sym,sup,sub){
  var s = "<i>" + sym + "</i>";
  if(sup !== "" && sup !== undefined && sup !== null){ s += "<sup>[" + sup + "]</sup>"; }
  if(sub !== "" && sub !== undefined && sub !== null){
    s += (sup ? "<span class=\"nsep\">&nbsp;</span>" : "") + "<sub>" + sub + "</sub>";
  }
  return "<span class=\"nota\">" + s + "</span>";
}
var MACRO = {
  alpha : "<span class=\"nota\"><i>α</i></span>",
  beta  : "<span class=\"nota\"><i>β</i></span>",
  lam   : "<span class=\"nota\"><i>λ</i></span>",
  mu    : "<span class=\"nota\"><i>μ</i></span>",
  sigma : "<span class=\"nota\"><i>σ</i></span>",
  eps   : "<span class=\"nota\"><i>ε</i></span>",
  theta : "<span class=\"nota\"><i>θ</i></span>",
  Eloss : "<span class=\"nota\"><i>E</i></span>",
  yhat  : "<span class=\"nota\"><i>ŷ</i></span>",
  fbar  : "<span class=\"nota\"><i>f̄</i></span>"
};
function termHTML(id, display){
  var g = GLOSS[id];
  if(!g){ return "<span class=\"term\">" + (display || id) + "</span>"; }
  var label = display || g.term;
  return "<span class=\"termwrap\" data-term=\"" + id + "\">" +
    "<span class=\"term\">" + label + "</span>" +
    "<button type=\"button\" class=\"ibub\" aria-expanded=\"false\" aria-label=\"About " + g.term + "\">i</button>" +
    "</span>";
}
/* Longest phrases first so “bias–variance” is not split into bias + variance. */
var TERM_PATTERNS = [
  {id:"bias_variance", re:/bias[–-]variance(?:\s+trade-?offs?)?/gi},
  {id:"generalisation_gap", re:/generali[sz]ation gap/gi},
  {id:"interpolation_threshold", re:/interpolation threshold/gi},
  {id:"hypothesis_class", re:/hypothesis classes?/gi},
  {id:"effective_parameters", re:/effective parameters?/gi},
  {id:"irreducible_error", re:/irreducible error/gi},
  {id:"expected_risk", re:/expected risk/gi},
  {id:"training_loss", re:/training loss/gi},
  {id:"validation_set", re:/validation sets?/gi},
  {id:"weight_decay", re:/weight decay/gi},
  {id:"early_stopping", re:/early stopping/gi},
  {id:"mse", re:/mean squared error/gi},
  {id:"least_squares", re:/least squares/gi},
  {id:"inductive_bias", re:/inductive bias/gi},
  {id:"double_descent", re:/double descent/gi},
  {id:"test_loss", re:/test loss/gi},
  {id:"overparameterised", re:/overparameteri[sz]ed/gi},
  {id:"hyperparameters", re:/hyperparameters?/gi},
  {id:"underfitting", re:/underfitting/gi},
  {id:"overfitting", re:/overfitting/gi},
  {id:"generalisation", re:/generali[sz]ation/gi},
  {id:"interpolation", re:/interpolation/gi},
  {id:"memorisation", re:/memori[sz]ation/gi},
  {id:"regularisation", re:/regulari[sz]ation/gi},
  {id:"capacity", re:/\bcapacity\b/gi},
  {id:"variance", re:/\bvariances?\b/gi},
  {id:"bias", re:/\bbiase?s?\b/gi}
];
function linkTerms(html){
  if(!html || typeof GLOSS === "undefined"){ return html; }
  var held = [];
  html = String(html).replace(/<span class="termwrap"[\s\S]*?<\/button><\/span>/g, function(m){
    held.push(m);
    return "@@TERM" + (held.length - 1) + "@@";
  });
  html = html.replace(/(<[^>]+>)|([^<]+)/g, function(all, tag, text){
    if(tag){ return tag; }
    var out = text;
    TERM_PATTERNS.forEach(function(p){
      if(!GLOSS[p.id]){ return; }
      out = out.replace(p.re, function(m){ return termHTML(p.id, m); });
    });
    return out;
  });
  return html.replace(/@@TERM(\d+)@@/g, function(_, n){ return held[+n]; });
}
function M(s, opts){
  opts = opts || {};
  s = String(s).replace(/\{\{\s*slot\s*\}\}|\{\s*slot\s*\}/g, "\uE000SLOT\uE001");
  s = s.replace(/\{([^|{}]*)\|([^|{}]*)\|([^|{}]*)\}/g,
        function(all,sym,sup,sub){ return nota(sym,sup,sub); });
  s = s.replace(/\{t:([a-z0-9_]+)\}/g, function(all, id){ return termHTML(id); });
  s = s.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g,
        function(all,k){ return Object.prototype.hasOwnProperty.call(MACRO,k) ? MACRO[k] : all; });
  if(opts.link !== false){ s = linkTerms(s); }
  if(opts.slotHTML){ s = s.split("\uE000SLOT\uE001").join(opts.slotHTML); }
  return s;
}
function mk(tag,cls,html){
  var e = document.createElement(tag);
  if(cls){ e.className = cls; }
  if(html !== undefined && html !== null){ e.innerHTML = M(html); }
  return e;
}
function each(list, fn){ Array.prototype.forEach.call(list, fn); }
function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffleWith(rand, arr){
  var out = arr.slice(), i, j, t;
  for(i = out.length - 1; i > 0; i--){
    j = Math.floor(rand() * (i + 1));
    t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}
function R(x, d){
  d = (d === undefined) ? 4 : d;
  var p = Math.pow(10, d);
  return Math.round((x + 0) * p) / p;
}
function mean(a){
  var s = 0, i;
  for(i=0;i<a.length;i++){ s += a[i]; }
  return s / a.length;
}
function mse(pred, y){
  var s = 0, i;
  for(i=0;i<y.length;i++){ s += (pred[i] - y[i]) * (pred[i] - y[i]); }
  return s / y.length;
}

/* ----- 3-point hand example ----- */
var PT = { x:[0,1,2], y:[1,2,0], teX:[3,-1], teY:[0.5, 2.5] };
var PT_MEAN = 1;
var PT_CONST_TR = R(mse([1,1,1], PT.y)); /* 0.6667 */
var PT_LIN_A = 1.5, PT_LIN_B = -0.5;
var PT_LIN_TR = R(mse([1.5,1.0,0.5], PT.y)); /* 0.5000 */
var PT_QUAD_TR = 0;
function quad(x){ return 1 + 2.5*x - 1.5*x*x; }
function lin(x){ return 1.5 - 0.5*x; }
var PT_CONST_TE = R(mse([1,1], PT.teY));
var PT_LIN_TE = R(mse([lin(3), lin(-1)], PT.teY));
var PT_QUAD_TE = R(mse([quad(3), quad(-1)], PT.teY));

/* ----- sine demo data (animation) ----- */
var SX = [0.00, 0.20, 0.40, 0.60, 0.80, 1.00];
var SY = [0.1200, 0.7711, 0.7378, -0.6878, -0.8711, -0.1400];
function sineTrue(x){ return Math.sin(2 * Math.PI * x); }

function vandermonde(x, M){
  var n = x.length, p = M + 1, X = [], i, j, row, v;
  for(i=0;i<n;i++){
    row = []; v = 1;
    for(j=0;j<p;j++){ row.push(v); v *= x[i]; }
    X.push(row);
  }
  return X;
}
function matVec(A, w){
  var i, j, out = [], s;
  for(i=0;i<A.length;i++){
    s = 0;
    for(j=0;j<w.length;j++){ s += A[i][j] * w[j]; }
    out.push(s);
  }
  return out;
}
function solve(A, b){
  var n = A.length, M = [], i, j, k, f, t;
  for(i=0;i<n;i++){
    M[i] = A[i].slice();
    M[i].push(b[i]);
  }
  for(i=0;i<n;i++){
    var piv = i;
    for(k=i+1;k<n;k++){ if(Math.abs(M[k][i]) > Math.abs(M[piv][i])){ piv = k; } }
    t = M[i]; M[i] = M[piv]; M[piv] = t;
    if(Math.abs(M[i][i]) < 1e-12){ return null; }
    f = M[i][i];
    for(j=i;j<=n;j++){ M[i][j] /= f; }
    for(k=0;k<n;k++){
      if(k === i){ continue; }
      f = M[k][i];
      for(j=i;j<=n;j++){ M[k][j] -= f * M[i][j]; }
    }
  }
  var w = [];
  for(i=0;i<n;i++){ w.push(M[i][n]); }
  return w;
}
function polyFit(x, y, M, lam){
  lam = lam || 0;
  var X = vandermonde(x, M), p = M + 1, i, j, k, XTXj, XTy = [], A = [];
  for(j=0;j<p;j++){
    XTy[j] = 0;
    for(i=0;i<x.length;i++){ XTy[j] += X[i][j] * y[i]; }
    A[j] = [];
    for(k=0;k<p;k++){
      XTXj = 0;
      for(i=0;i<x.length;i++){ XTXj += X[i][j] * X[i][k]; }
      A[j][k] = XTXj + ((j === k) ? lam : 0);
    }
  }
  var w = solve(A, XTy);
  if(!w){
    w = [];
    for(j=0;j<p;j++){ w[j] = 0; }
  }
  return w;
}
function polyEval(w, x){
  var s = 0, v = 1, j;
  for(j=0;j<w.length;j++){ s += w[j] * v; v *= x; }
  return s;
}
function polyCurve(w, xs){
  var i, out = [];
  for(i=0;i<xs.length;i++){ out.push(polyEval(w, xs[i])); }
  return out;
}

/* bias–variance hand numbers */
var BV_MU = 5, BV_SIG2 = 1;
var BV_A = [3,3,3];
var BV_B = [4,6,5];
var BV_C = [4.0, 5.0, 4.5]; /* 0.5 y + 0.5*4 */
function bvStats(preds){
  var m = mean(preds), i, v = 0;
  for(i=0;i<preds.length;i++){ v += (preds[i] - m) * (preds[i] - m); }
  v /= preds.length;
  var bias = m - BV_MU;
  return { mean:R(m), bias:R(bias), bias2:R(bias*bias), var:R(v),
           risk:R(BV_SIG2 + bias*bias + v) };
}
var STAT_A = bvStats(BV_A);
var STAT_B = bvStats(BV_B);
var STAT_C = bvStats(BV_C);

function symbolTable(cap, rows){
  var s = "<div class=\"tscroll\"><table class=\"wt\"><caption>" + cap + "</caption><thead><tr><th>symbol</th><th class=\"lft\">meaning</th></tr></thead><tbody>";
  rows.forEach(function(r){
    s += "<tr><th>" + M(r[0]) + "</th><td class=\"lft\">" + M(r[1]) + "</td></tr>";
  });
  return s + "</tbody></table></div>";
}
function T_PT(){
  return "<table class=\"wt\"><caption>table A · four numbers you will use by hand</caption>" +
    "<thead><tr><th>set</th><th>x</th><th>y</th></tr></thead><tbody>" +
    "<tr><th rowspan=\"3\">train</th><td>0</td><td>1</td></tr>" +
    "<tr><td>1</td><td>2</td></tr>" +
    "<tr><td>2</td><td>0</td></tr>" +
    "<tr class=\"hi\"><th rowspan=\"2\">test</th><td>3</td><td>0.5</td></tr>" +
    "<tr class=\"hi\"><td>−1</td><td>2.5</td></tr>" +
    "</tbody></table>";
}
function T_MODELS(){
  return "<table class=\"wt\"><caption>table B · three models, same three training points</caption>" +
    "<thead><tr><th></th><th>constant</th><th>line</th><th>quadratic</th></tr></thead><tbody>" +
    "<tr><th class=\"lft\">form</th><td>{yhat} = c</td><td>{yhat} = a + b x</td><td>{yhat} = a + b x + c x²</td></tr>" +
    "<tr><th class=\"lft\"># parameters</th><td>1</td><td>2</td><td>3</td></tr>" +
    "<tr><th class=\"lft\">fit</th><td>c = mean(y) = 1</td><td>least squares</td><td>interpolates all three points</td></tr>" +
    "</tbody></table>";
}
function T_BVDATA(){
  return "<table class=\"wt\"><caption>table C · three tiny training sets for a constant</caption>" +
    "<thead><tr><th>dataset</th><th>the one training y</th></tr></thead><tbody>" +
    "<tr><th>D₁</th><td>4</td></tr><tr><th>D₂</th><td>6</td></tr><tr><th>D₃</th><td>5</td></tr>" +
    "</tbody></table>";
}
