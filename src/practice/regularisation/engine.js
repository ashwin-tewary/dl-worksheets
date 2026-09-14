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
  gamma : "<span class=\"nota\"><i>γ</i></span>",
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
var TERM_PATTERNS = [
  {id:"running_stats", re:/running (?:mean|average|statistics|stats)/gi},
  {id:"keep_probability", re:/keep probabilit(?:y|ies)/gi},
  {id:"inverted_dropout", re:/inverted dropout/gi},
  {id:"soft_threshold", re:/soft[- ]threshold(?:ing)?/gi},
  {id:"effective_parameters", re:/effective parameters?/gi},
  {id:"generalisation_gap", re:/generali[sz]ation gap/gi},
  {id:"batch_norm", re:/batch normali[sz]ation/gi},
  {id:"weight_decay", re:/weight decay/gi},
  {id:"early_stopping", re:/early stopping/gi},
  {id:"validation_set", re:/validation sets?/gi},
  {id:"hyperparameters", re:/hyperparameters?/gi},
  {id:"training_loss", re:/training loss/gi},
  {id:"test_loss", re:/test loss/gi},
  {id:"least_squares", re:/least squares/gi},
  {id:"scale_shift", re:/scale[- ]and[- ]shift/gi},
  {id:"internal_covariate", re:/internal covariate shift/gi},
  {id:"inductive_bias", re:/inductive bias/gi},
  {id:"parameter_norm", re:/parameter[- ]norm penalt(?:y|ies)/gi},
  {id:"ridge", re:/\bridge(?: regression)?\b/gi},
  {id:"lasso", re:/\blasso\b/gi},
  {id:"l2", re:/\bL2\b/g},
  {id:"l1", re:/\bL1\b/g},
  {id:"sparsity", re:/sparsit(?:y|ies)|sparse solutions?/gi},
  {id:"dropout", re:/dropouts?/gi},
  {id:"shrinkage", re:/shrinkage/gi},
  {id:"regularisation", re:/regulari[sz]ation/gi},
  {id:"overfitting", re:/overfitting/gi},
  {id:"underfitting", re:/underfitting/gi},
  {id:"generalisation", re:/generali[sz]ation/gi},
  {id:"variance", re:/\bvariances?\b/gi},
  {id:"bias", re:/\bbiase?s?\b/gi},
  {id:"capacity", re:/\bcapacity\b/gi},
  {id:"mse", re:/mean squared error/gi}
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
function vandermonde(x, M){
  var n = x.length, p = M + 1, X = [], i, j, row, v;
  for(i=0;i<n;i++){
    row = []; v = 1;
    for(j=0;j<p;j++){ row.push(v); v *= x[i]; }
    X.push(row);
  }
  return X;
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
var SX = [0.00, 0.20, 0.40, 0.60, 0.80, 1.00];
var SY = [0.1200, 0.7711, 0.7378, -0.6878, -0.8711, -0.1400];
function sineTrue(x){ return Math.sin(2 * Math.PI * x); }

/* 1-D ridge: ŷ = w x on (1,2) and (2,3).  SSE = 5w² − 16w + 13.  w = 8/(5+λ). */
function ridge1D(lam){ return 8 / (5 + lam); }
var RIDGE_W0 = R(ridge1D(0));     /* 1.6000 */
var RIDGE_W1 = R(ridge1D(1));     /* 1.3333 */
var RIDGE_SSE0 = R(0.2);
var RIDGE_MSE0 = R(0.1);
var RIDGE_SSE1 = R((2 - 8/6)*(2 - 8/6) + (3 - 16/6)*(3 - 16/6)); /* 0.5556 */

/* 2-feature linear model used for L1 vs L2. */
var X2 = [[1,0],[2,0],[0,1],[1,1],[3,0]];
var Y2 = [2.0, 3.8, 0.2, 2.1, 5.9];
function xtx2(){ return [[15,1],[1,2]]; }
function xty2(){ return [29.4, 2.3]; }
function ridge2(lam){
  var A = [[15 + lam, 1],[1, 2 + lam]];
  return solve(A, [29.4, 2.3]);
}
function pred2(w){
  var i, out = [];
  for(i=0;i<X2.length;i++){ out.push(w[0]*X2[i][0] + w[1]*X2[i][1]); }
  return out;
}
function soft(z, t){
  if(z > t){ return z - t; }
  if(z < -t){ return z + t; }
  return 0;
}
/* Minimise SSE + λ‖w‖₁ by coordinate descent. Threshold is λ/2 because d(SSE)/dw_j = 2(XᵀX w − Xᵀy). */
function lasso2(lam, iters){
  iters = iters || 4000;
  var w = [0,0], j, k, col, rho, z, rj, i;
  var cols = [[1,2,0,1,3],[0,0,1,1,0]];
  for(k=0;k<iters;k++){
    for(j=0;j<2;j++){
      col = cols[j]; z = 0; rho = 0;
      for(i=0;i<5;i++){
        rj = Y2[i] - (w[0]*X2[i][0] + w[1]*X2[i][1]) + col[i]*w[j];
        rho += col[i] * rj;
        z += col[i]*col[i];
      }
      w[j] = soft(rho, lam/2) / z;
    }
  }
  return w;
}
var OLS2 = ridge2(0);
var OLS2R = [R(OLS2[0]), R(OLS2[1])];
var OLS2_MSE = R(mse(pred2(OLS2), Y2));
var LASSO2 = lasso2(2);
var LASSO2R = [R(LASSO2[0]), R(LASSO2[1])];

function bnStats(u){
  var m = mean(u), i, v = 0;
  for(i=0;i<u.length;i++){ v += (u[i]-m)*(u[i]-m); }
  v /= u.length;
  return {mu:m, var:v, std:Math.sqrt(v)};
}
var BN_U = [1,3,5,7];
var BN_S = bnStats(BN_U);
var BN_UHAT = BN_U.map(function(x){ return R((x - BN_S.mu) / Math.sqrt(BN_S.var)); });
var BN_Y = BN_UHAT.map(function(x){ return R(2*x + 1); });

function figHTML(src, cap){
  return "<figure class=\"bookfig\"><img src=\"" + src + "\" alt=\"\">" +
    "<figcaption class=\"cap\">" + cap + "</figcaption></figure>";
}
function T_1D(){
  return "<table class=\"wt\"><caption>table A · two training pairs for ŷ = w x</caption>" +
    "<thead><tr><th></th><th>x</th><th>y</th></tr></thead><tbody>" +
    "<tr><th>point 1</th><td>1</td><td>2</td></tr>" +
    "<tr><th>point 2</th><td>2</td><td>3</td></tr>" +
    "</tbody></table>";
}
function T_2D(){
  return "<table class=\"wt\"><caption>table B · five points, two features, no intercept</caption>" +
    "<thead><tr><th>n</th><th>x₁</th><th>x₂</th><th>y</th></tr></thead><tbody>" +
    "<tr><th>1</th><td>1</td><td>0</td><td>2.0</td></tr>" +
    "<tr><th>2</th><td>2</td><td>0</td><td>3.8</td></tr>" +
    "<tr><th>3</th><td>0</td><td>1</td><td>0.2</td></tr>" +
    "<tr><th>4</th><td>1</td><td>1</td><td>2.1</td></tr>" +
    "<tr><th>5</th><td>3</td><td>0</td><td>5.9</td></tr>" +
    "</tbody></table>";
}
function T_BN(){
  return "<table class=\"wt\"><caption>table C · one hidden unit, a mini-batch of four</caption>" +
    "<thead><tr><th>example</th><th>u</th></tr></thead><tbody>" +
    "<tr><th>1</th><td>1</td></tr><tr><th>2</th><td>3</td></tr>" +
    "<tr><th>3</th><td>5</td></tr><tr><th>4</th><td>7</td></tr>" +
    "</tbody></table>";
}
function T_DROP(){
  return "<table class=\"wt\"><caption>table D · inverted dropout, p = 0.5</caption>" +
    "<thead><tr><th>unit</th><th>h</th><th>mask m</th><th>h̃ = m h / p</th></tr></thead><tbody>" +
    "<tr><th>1</th><td>1.2</td><td>1</td><td>2.4</td></tr>" +
    "<tr><th>2</th><td>−0.4</td><td>0</td><td>0</td></tr>" +
    "<tr><th>3</th><td>2.0</td><td>1</td><td>4.0</td></tr>" +
    "<tr><th>4</th><td>0.8</td><td>0</td><td>0</td></tr>" +
    "</tbody></table>";
}
