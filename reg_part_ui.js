var rand = mulberry32(20260907);
BLANKS.forEach(function(B){ B.shuffled = shuffleWith(rand, B.options); });
var BYID = {};
BLANKS.forEach(function(B){ BYID[B.id] = B; });
function blanksInSection(n){ return BLANKS.filter(function(B){ return B.sec === n; }); }
var state = { ans:{}, wrong:{}, collapsed:{}, autoc:{} };
var TOTAL_BLANKS = BLANKS.filter(function(B){ return B.counts !== false; }).length;

function renderFig(){}
function refreshFigures(){}

function needEl(items){
  var d = mk("div","need");
  d.appendChild(mk("span","nl","you need"));
  items.forEach(function(it){ d.appendChild(mk("code","",it)); });
  return d;
}
function slotHTML(B){
  return "<span class=\"slot" + (B.wide ? " wide" : "") + "\" id=\"slot-" + B.id + "\">" +
         "<span class=\"slotin\">?</span></span>";
}
function chipsFor(B, host){
  var longest = 0;
  B.shuffled.forEach(function(o){ if(o.length > longest){ longest = o.length; } });
  var chips = mk("div","chips" + (longest > 26 ? " stack" : ""));
  chips.setAttribute("role","group");
  chips.setAttribute("aria-label","options for this blank");
  B.shuffled.forEach(function(opt){
    var btn = mk("button","chip" + (B.wide ? " prose" : ""));
    btn.type = "button";
    btn.innerHTML = M(opt, {link:false});
    btn._opt = opt;
    btn.addEventListener("click", function(){ onChip(B, opt, btn, host); });
    chips.appendChild(btn);
  });
  return chips;
}
function hintboxEl(){
  var hb = mk("div","hintbox");
  hb.setAttribute("aria-live","polite");
  return hb;
}
function stashPlaceholders(s){
  var held = [];
  s = String(s).replace(/\{\{\s*([A-Za-z0-9]+)\s*\}\}|\{\s*(slot)\s*\}/g, function(all, a, b){
    held.push(a || b);
    return "\uE000" + (held.length - 1) + "\uE001";
  });
  return {s:s, held:held};
}
function fillPlaceholders(html, held, lookup){
  html = String(html).replace(/\uE000SLOT\uE001/g, function(){ return lookup("slot"); });
  html = html.replace(/\uE000(\d+)\uE001/g, function(_, n){
    return lookup(held[+n]);
  });
  return html.replace(/\{\{\s*slot\s*\}\}|\{\s*slot\s*\}/g, function(){
    return lookup("slot");
  });
}
function buildStep(B){
  var st = mk("div","step blk");
  st.setAttribute("data-blank", B.id);
  if(B.need && B.need.length){ st.appendChild(needEl(B.need)); }
  if(B.prompt){
    var ml = mk("div","mathline");
    var stashed = stashPlaceholders(B.prompt);
    var html = fillPlaceholders(M(stashed.s, {slotHTML: slotHTML(B)}), stashed.held, function(){ return slotHTML(B); });
    ml.innerHTML = (B.verb ? "<span class=\"verb\">" + B.verb + "</span>" : "") + html;
    st.appendChild(ml);
  }
  st.appendChild(chipsFor(B, st));
  st.appendChild(hintboxEl());
  return st;
}
function buildRow(blk, ctr, sec, gate){
  var st = mk("div","step blk"), ml = mk("div","mathline");
  var stashed = stashPlaceholders(blk.prompt);
  var html = fillPlaceholders(M(stashed.s), stashed.held, function(name){
    return slotHTML(BYID[name] || BYID[blk.ids[0]]);
  });
  st.setAttribute("data-row", blk.ids.join(","));
  if(blk.need && blk.need.length){ st.appendChild(needEl(blk.need)); }
  ml.innerHTML = (blk.verb ? "<span class=\"verb\">" + blk.verb + "</span>" : "") + html;
  st.appendChild(ml);
  var subs = mk("div","subs");
  blk.ids.forEach(function(id){
    var B = BYID[id], sub = mk("div","sub");
    sub.setAttribute("data-blank", id);
    if(gate){
      sub.setAttribute("data-prereq", ctr.n);
      sub.setAttribute("data-secn", sec.n);
    }
    ctr.n++;
    if(B.lab){ sub.appendChild(mk("span","sublab", B.lab)); }
    sub.appendChild(chipsFor(B, sub));
    sub.appendChild(hintboxEl());
    subs.appendChild(sub);
  });
  st.appendChild(subs);
  return st;
}
function buildMCQ(blk){
  var box = mk("div","mcq blk");
  box.setAttribute("data-answer", blk.answer);
  box.appendChild(mk("div","tag", blk.tag));
  box.appendChild(mk("p","q", blk.q));
  var opts = mk("div","opts");
  blk.opts.forEach(function(o,i){
    var b = mk("button","opt");
    b.type = "button";
    b.setAttribute("data-i", i);
        b.setAttribute("data-hint", M(o.hint || "", {link:false}));
    b.innerHTML = "<span class=\"ltr\">" + "ABCDEFG".charAt(i) + "</span><span class=\"txt\">" +
                  M(o.txt, {link:false}) + "</span>";
    opts.appendChild(b);
  });
  box.appendChild(opts);
  var fb = mk("div","fb");
  fb.setAttribute("aria-live","polite");
  box.appendChild(fb);
  var show = mk("button","show","show me the answer");
  show.type = "button";
  box.appendChild(show);
  var tpl = document.createElement("template");
  tpl.className = "whytpl";
  tpl.innerHTML = M(blk.why);
  box.appendChild(tpl);
  wireMCQ(box);
  return box;
}
function wireMCQ(box){
  var answer = parseInt(box.getAttribute("data-answer"), 10);
  var opts = [].slice.call(box.querySelectorAll(".opt"));
  var fb = box.querySelector(".fb");
  var show = box.querySelector(".show");
  var why = box.querySelector(".whytpl").innerHTML;
  var done = false;
  function finish(revealed){
    done = true;
    opts.forEach(function(o, i){
      o.disabled = true;
      if(i === answer){ o.classList.remove("wrong"); o.classList.add(revealed ? "shown" : "right"); }
    });
    show.style.display = "none";
    var d = mk("div","why pop" + (revealed ? " rev" : ""));
    d.innerHTML = why;
    fb.innerHTML = "";
    fb.appendChild(d);
  }
  opts.forEach(function(o){
    o.addEventListener("click", function(){
      if(done){ return; }
      var i = parseInt(o.getAttribute("data-i"), 10);
      if(i === answer){ finish(false); return; }
      o.classList.add("wrong");
      o.disabled = true;
      var d = mk("div","hint pop");
      d.innerHTML = o.getAttribute("data-hint") || "Not this one. Try again.";
      fb.innerHTML = "";
      fb.appendChild(d);
    });
  });
  show.addEventListener("click", function(){ if(!done){ finish(true); } });
  box._reset = function(){
    done = false;
    opts.forEach(function(o){ o.disabled = false; o.className = "opt"; });
    show.style.display = "";
    fb.innerHTML = "";
  };
}
function buildBlock(blk, ctr, sec, gate){
  var e;
  if(blk.t === "blank"){ return buildStep(BYID[blk.id]); }
  if(blk.t === "blanks"){ return buildRow(blk, ctr, sec, gate); }
  if(blk.t === "mcq"){ return buildMCQ(blk); }
  if(blk.t === "p"){ return mk("p","txt blk", blk.html); }
  if(blk.t === "h3"){ e = mk("div","blk"); e.appendChild(mk("h3","",blk.html)); return e; }
  if(blk.t === "math"){ return mk("div","mathline blk" + (blk.big ? " big" : ""), blk.html); }
  if(blk.t === "note"){ return mk("div","note blk", blk.html); }
  if(blk.t === "strip"){ return mk("div","strip blk" + (blk.pin ? " pin" : ""), blk.html); }
  if(blk.t === "raw"){ return mk("div","blk", blk.html); }
  if(blk.t === "hook"){
    e = mk("div","hook blk");
    e.appendChild(mk("div","lab","the question"));
    e.appendChild(mk("p","qq", blk.q));
    if(blk.hint){ e.appendChild(mk("p","hint", blk.hint)); }
    return e;
  }
  if(blk.t === "answer"){
    e = mk("div","answer blk");
    e.appendChild(mk("div","lab","the answer"));
    e.innerHTML += M(blk.html);
    return e;
  }
  if(blk.t === "lines"){
    e = mk("div","blk");
    var ul = mk("ul","lines");
    blk.items.forEach(function(it){ ul.appendChild(mk("li","",it)); });
    e.appendChild(ul);
    return e;
  }
  if(blk.t === "card"){
    e = mk("div","card blk" + (blk.v ? " " + blk.v : ""), blk.html);
    return e;
  }
  if(blk.t === "worked"){
    e = mk("div","card blk grey worked");
    if(blk.tag){ e.appendChild(mk("span","tag", blk.tag)); }
    if(blk.title){ e.appendChild(mk("h4","", blk.title)); }
    blk.lines.forEach(function(l){ e.appendChild(mk("div","mathline", l)); });
    if(blk.note){ e.appendChild(mk("div","note", blk.note)); }
    return e;
  }
  if(blk.t === "anim"){
    e = mk("div","anim blk");
    e.id = "anim-" + blk.id;
    e.setAttribute("data-anim", blk.id);
    e.appendChild(mk("div","atitle", blk.title));
    if(blk.intro){ e.appendChild(mk("p","aintro", blk.intro)); }
    return e;
  }
  if(blk.t === "fig"){
    e = document.createElement("figure");
    e.className = "bookfig blk";
    var img = document.createElement("img");
    img.src = blk.src; img.alt = blk.alt || "";
    e.appendChild(img);
    var cap = document.createElement("figcaption");
    cap.className = "cap";
    cap.innerHTML = M(blk.cap || "");
    e.appendChild(cap);
    return e;
  }
  return mk("div","blk","");
}
function addBlocks(container, blocks, sec, gate, ctr){
  blocks.forEach(function(blk){
    var e = buildBlock(blk, ctr, sec, gate);
    if(gate && blk.t !== "blanks"){
      e.setAttribute("data-prereq", ctr.n);
      e.setAttribute("data-secn", sec.n);
    }
    if(blk.t === "blank"){ ctr.n++; }
    container.appendChild(e);
  });
}
function buildSection(sec){
  var s = mk("section","sec" + (sec.cls ? " " + sec.cls : ""));
  s.setAttribute("data-sec", sec.n);
  s.id = "sec" + sec.n;
  var head = mk("div","sec-head");
  var g = mk("div","hgrow");
  var sh = mk("div","seg-head");
  sh.appendChild(mk("span","seg-num", sec.eyebrow));
  sh.appendChild(mk("span","seg-rule"));
  g.appendChild(sh);
  g.appendChild(mk("h2","", sec.title));
  head.appendChild(g);
  var chev = mk("button","chev","collapse");
  chev.type = "button";
  chev.setAttribute("aria-expanded","true");
  head.appendChild(chev);
  head.addEventListener("click", function(){ toggleSection(sec.n); });
  s.appendChild(head);
  var body = mk("div","sec-body");
  addBlocks(body, sec.blocks, sec, true, {n:0});
  s.appendChild(body);
  var strip = mk("div","sec-strip");
  strip.appendChild(mk("span","ss-res", sec.result || ""));
  strip.appendChild(mk("span","ss-re","click the heading to re-open"));
  s.appendChild(strip);
  return s;
}
function render(){
  var doc = document.getElementById("doc");
  doc.innerHTML = "";
  SECTIONS.forEach(function(sec){ doc.appendChild(buildSection(sec)); });
  buildOverlay();
  wrapTables();
  buildAllAnims();
  refresh();
}
function wrapTables(){
  each(document.querySelectorAll("table.wt"), function(t){
    if(t.closest(".tscroll") || t.closest(".tbls")){ return; }
    var w = mk("div","tscroll");
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });
}
function buildOverlay(){
  var ovb = document.getElementById("ovbody");
  var keys = Object.keys(GLOSS);
  var html = "<p class=\"txt\">Every dotted term in the sheet opens one of these. They are also listed here so you can scan the vocabulary in one place.</p>";
  keys.forEach(function(id){
    var g = GLOSS[id];
    html += "<div class=\"gcard-ov\" id=\"gloss-" + id + "\">" +
      "<div class=\"bt\">" + g.term + "</div>" +
      "<p class=\"bd\">" + g.def + "</p>" +
      (g.formula ? "<div class=\"bf\">" + g.formula + "</div>" : "") +
      "<div class=\"bs\">" + g.see + "</div></div>";
  });
  ovb.innerHTML = M(html, {link:false});
}

function fly(btn, slot, done){
  if(!slot || !btn.getBoundingClientRect || REDUCED){ done(); return; }
  var a = btn.getBoundingClientRect(), b = slot.getBoundingClientRect();
  var f = document.createElement("span");
  f.className = "fly";
  f.innerHTML = btn.innerHTML;
  f.style.left = a.left + "px";
  f.style.top  = a.top + "px";
  document.body.appendChild(f);
  requestAnimationFrame(function(){
    f.style.transform = "translate(" + (b.left - a.left + (b.width - a.width) / 2) + "px," +
                        (b.top - a.top) + "px) scale(.92)";
    f.style.opacity = "0.1";
  });
  window.setTimeout(function(){
    if(f.parentNode){ f.parentNode.removeChild(f); }
    done();
  }, 270);
}
function onChip(B, opt, btn, host){
  if(state.ans[B.id]){ return; }
  if(opt === B.correct){
    var slot = document.getElementById("slot-" + B.id);
    btn.classList.add("chosen");
    fly(btn, slot, function(){ commit(B, "ok"); });
    return;
  }
  btn.classList.add("wrong");
  btn.disabled = true;
  state.wrong[B.id] = (state.wrong[B.id] || 0) + 1;
  var hb = host.querySelector(".hintbox");
  var hint = (B.hints && B.hints[opt]) ? B.hints[opt] : "Not this one. Look at the numbers you were given.";
  hb.innerHTML = "<div class=\"hint\"><b>✕</b>&nbsp;&nbsp;" + M(hint) + "</div>";
  if(state.wrong[B.id] >= 2 && !host.querySelector(".showme")){
    var sm = mk("button","showme","show me");
    sm.type = "button";
    sm.addEventListener("click", function(){ commit(B, "shown"); });
    hb.appendChild(sm);
  }
}
function hostOf(id){ return document.querySelector("[data-blank=\"" + id + "\"]"); }
function commit(B, mode){
  if(state.ans[B.id]){ return; }
  state.ans[B.id] = mode;
  var host = hostOf(B.id);
  var slot = document.getElementById("slot-" + B.id);
  if(slot){
    slot.className = "slot" + (B.wide ? " wide" : "") + " " + (mode === "ok" ? "ok" : "shown");
    slot.innerHTML = "<span class=\"slotin pop\">" + M(B.correct, {link:false}) + "</span>";
  }
  if(host){
    each(host.querySelectorAll(".chip"), function(c){
      c.disabled = true;
      if(c._opt === B.correct){
        c.classList.remove("wrong");
        c.classList.add(mode === "ok" ? "chosen" : "revealed");
      }
    });
    var hb = host.querySelector(".hintbox");
    if(hb){ hb.innerHTML = ""; }
    host.classList.add("done");
    host.classList.remove("active");
  }
  refresh();
  var secBlanks = blanksInSection(B.sec);
  var complete = secBlanks.filter(function(x){ return state.ans[x.id]; }).length === secBlanks.length;
  if(complete && !state.autoc[B.sec]){
    state.autoc[B.sec] = true;
    window.setTimeout(function(){
      state.collapsed[B.sec] = true;
      applyCollapse();
      var nx = nextSectionEl(B.sec);
      if(nx){ nx.scrollIntoView({behavior: REDUCED ? "auto" : "smooth", block:"start"}); }
    }, 1200);
  }else{
    window.setTimeout(scrollToActive, 300);
  }
}
function nextSectionEl(n){
  var i;
  for(i=0;i<SECTIONS.length;i++){
    if(SECTIONS[i].n > n){ return document.getElementById("sec" + SECTIONS[i].n); }
  }
  return null;
}
function scrollToActive(){
  var a = document.querySelector(".step.active, .sub.active, .mrow.active");
  if(!a){ return; }
  var r = a.getBoundingClientRect();
  if(r.top < 110 || r.bottom > window.innerHeight - 30){
    a.scrollIntoView({behavior: REDUCED ? "auto" : "smooth", block:"center"});
  }
}
function toggleSection(n){
  state.collapsed[n] = !state.collapsed[n];
  applyCollapse();
}
function applyCollapse(){
  SECTIONS.forEach(function(sec){
    var e = document.getElementById("sec" + sec.n);
    if(!e){ return; }
    var c = !!state.collapsed[sec.n];
    e.classList.toggle("collapsed", c);
    var chev = e.querySelector(".chev");
    if(chev){
      chev.textContent = c ? "expand" : "collapse";
      chev.setAttribute("aria-expanded", c ? "false" : "true");
    }
  });
}
function refresh(){
  var bySec = {}, id;
  for(id in state.ans){
    if(Object.prototype.hasOwnProperty.call(state.ans, id)){
      bySec[BYID[id].sec] = (bySec[BYID[id].sec] || 0) + 1;
    }
  }
  each(document.querySelectorAll("#doc [data-prereq]"), function(e){
    var need = parseInt(e.getAttribute("data-prereq"), 10);
    var sn = parseInt(e.getAttribute("data-secn"), 10);
    var lock = (bySec[sn] || 0) < need;
    if(lock && e.parentElement && e.parentElement.closest(".locked")){ lock = false; }
    e.classList.toggle("locked", lock);
  });
  each(document.querySelectorAll(".step,.sub,.mrow"), function(e){ e.classList.remove("active"); });
  SECTIONS.forEach(function(sec){
    var list = blanksInSection(sec.n), i;
    for(i=0;i<list.length;i++){
      if(!state.ans[list[i].id]){
        var h = hostOf(list[i].id);
        if(h && !h.classList.contains("locked") && !h.closest(".locked")){ h.classList.add("active"); }
        break;
      }
    }
  });
  var n = 0;
  for(id in state.ans){
    if(Object.prototype.hasOwnProperty.call(state.ans, id) && BYID[id].counts !== false){ n++; }
  }
  document.getElementById("pnum").textContent = n + " / " + TOTAL_BLANKS + " blanks filled";
  document.getElementById("pfill").style.width = (100 * n / TOTAL_BLANKS) + "%";
  var cur = null, k;
  for(k=0;k<SECTIONS.length;k++){
    var l = blanksInSection(SECTIONS[k].n);
    if(l.length && l.some(function(x){ return !state.ans[x.id]; })){ cur = SECTIONS[k]; break; }
  }
  var ps = document.getElementById("psec");
  ps.innerHTML = cur ? M("section " + cur.n + " &middot; " + cur.title)
                     : M("all done &middot; every blank filled");
}

function closeBubbles(){
  each(document.querySelectorAll(".termwrap.open"), function(w){
    w.classList.remove("open");
    var b = w.querySelector(".ibub");
    if(b){ b.setAttribute("aria-expanded","false"); b.classList.remove("on"); }
    var card = w.querySelector(".bubble");
    if(card){ w.removeChild(card); }
  });
}
function openBubble(wrap){
  var id = wrap.getAttribute("data-term");
  var g = GLOSS[id];
  if(!g){ return; }
  wrap.classList.add("open");
  var btn = wrap.querySelector(".ibub");
  if(btn){ btn.classList.add("on"); btn.setAttribute("aria-expanded","true"); }
  var card = mk("div","bubble");
  card.setAttribute("role","tooltip");
  card.innerHTML = "<div class=\"bt\">" + g.term + "</div>" +
    "<p class=\"bd\">" + g.def + "</p>" +
    (g.formula ? "<div class=\"bf\">" + g.formula + "</div>" : "") +
    "<div class=\"bs\">" + g.see + "</div>" +
    "<button type=\"button\" class=\"bmore\">open in glossary</button>";
  wrap.appendChild(card);
  var r = card.getBoundingClientRect();
  if(r.right > window.innerWidth - 12){
    card.style.left = "auto";
    card.style.right = "0";
  }
  if(r.bottom > window.innerHeight - 12 && r.top > 180){
    card.style.top = "auto";
    card.style.bottom = "calc(100% + 8px)";
    card.classList.add("above");
  }
  card.querySelector(".bmore").addEventListener("click", function(ev){
    ev.stopPropagation();
    closeBubbles();
    document.getElementById("ov").classList.add("open");
    var target = document.getElementById("gloss-" + id);
    if(target){ target.scrollIntoView({block:"center"}); target.classList.add("flash"); }
  });
}
function wireBubbles(){
  document.addEventListener("click", function(ev){
    var wrap = ev.target.closest(".termwrap");
    if(wrap && (ev.target.closest(".ibub") || ev.target.closest(".term"))){
      ev.preventDefault();
      ev.stopPropagation();
      var open = wrap.classList.contains("open");
      closeBubbles();
      if(!open){ openBubble(wrap); }
      return;
    }
    if(!ev.target.closest(".bubble")){ closeBubbles(); }
  });
  document.addEventListener("keydown", function(ev){
    if(ev.key === "Escape"){ closeBubbles(); }
  });
}

function syncStick(){
  var tb = document.querySelector(".topbar");
  if(!tb){ return; }
  document.documentElement.style.setProperty("--stick",
    (Math.round(tb.getBoundingClientRect().height) + 14) + "px");
}
function initChrome(){
  var ov = document.getElementById("ov");
  syncStick();
  window.addEventListener("resize", syncStick);
  document.getElementById("refbtn").addEventListener("click", function(){ ov.classList.add("open"); });
  document.getElementById("ovclose").addEventListener("click", function(){ ov.classList.remove("open"); });
  ov.addEventListener("click", function(ev){ if(ev.target === ov){ ov.classList.remove("open"); } });
  document.addEventListener("keydown", function(ev){
    if(ev.key === "Escape"){ ov.classList.remove("open"); closeBubbles(); }
  });
  document.getElementById("printbtn").addEventListener("click", function(){ window.print(); });
  window.addEventListener("beforeprint", freezeAnims);
  window.addEventListener("afterprint", thawAnims);
  var rb = document.getElementById("resetbtn"), armed = false, timer = null;
  rb.addEventListener("click", function(){
    if(!armed){
      armed = true;
      rb.classList.add("armed");
      rb.textContent = "click again to erase every answer";
      timer = window.setTimeout(function(){
        armed = false; rb.classList.remove("armed"); rb.textContent = "reset all";
      }, 5000);
      return;
    }
    window.clearTimeout(timer);
    armed = false;
    rb.classList.remove("armed");
    rb.textContent = "reset all";
    resetAll();
  });
  wireBubbles();
}
function resetAll(){
  state = { ans:{}, wrong:{}, collapsed:{}, autoc:{} };
  destroyAnims();
  render();
  applyCollapse();
  window.scrollTo({top:0, behavior: REDUCED ? "auto" : "smooth"});
}

var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
var C = (function(){
  var cs = getComputedStyle(document.documentElement), o = {};
  ["ink","blue","amber","plum","green","red","lgrey","rule","panel","cream","creamb",
   "greenbg","redbg","grey"].forEach(function(k){
    o[k] = cs.getPropertyValue("--" + k).trim() || "#000000";
  });
  return o;
})();
var LABF  = '13px Calibri, "Segoe UI", system-ui';
var LABFB = '700 13px Calibri, "Segoe UI", system-ui';
var TINYF = '700 12px Calibri, "Segoe UI", system-ui';
var NUMF  = '15px Cambria, Georgia, serif';
var NUMFB = '700 15px Cambria, Georgia, serif';

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
function clamp01(t){ return t < 0 ? 0 : (t > 1 ? 1 : t); }
function hexA(hex, a){
  var h = hex.replace("#",""), r, g, b;
  if(h.length === 3){ h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; }
  r = parseInt(h.substr(0,2),16); g = parseInt(h.substr(2,2),16); b = parseInt(h.substr(4,2),16);
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
function fx(v, d, sign){
  if(v === null || v === undefined || !isFinite(v)){ return "n/a"; }
  var s = Math.abs(v).toFixed(d === undefined ? 4 : d);
  return (v < 0 ? "−" : (sign ? "+" : "")) + s;
}
function tx(g,s,x,y,font,col,al,bl){
  g.font = font; g.fillStyle = col;
  g.textAlign = al || "left"; g.textBaseline = bl || "alphabetic";
  g.fillText(s, x, y);
}
function halo(g,s,x,y,font,col,al,bl){
  g.font = font; g.textAlign = al || "left"; g.textBaseline = bl || "alphabetic";
  g.lineWidth = 4; g.strokeStyle = "#ffffff"; g.lineJoin = "round";
  g.strokeText(s, x, y);
  g.fillStyle = col; g.fillText(s, x, y);
}
function line(g,x1,y1,x2,y2,col,w){
  g.strokeStyle = col; g.lineWidth = w || 1.4;
  g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke();
}

var ANIMS = [];
function Anim(o){
  var self = this;
  this.o = o;
  this.H = o.height;
  this.LW = 940;
  this.stepMs = 700;
  this.playing = false;
  this.lastStepAt = 0;
  this.ease = 1;
  this.beat = 3;
  this.raf = null;
  this.frozen = false;
  this.host = o.host;
  this.wrapEl = mk("div","cvwrap");
  this.cv = document.createElement("canvas");
  this.cv.className = "wide";
  this.cv.setAttribute("role","img");
  this.cv.setAttribute("aria-label", o.aria || "animated figure");
  this.wrapEl.appendChild(this.cv);
  this.ctlEl = mk("div","ctl");
  this.readEl = mk("div","readline");
  this.mirror = mk("div","amirror");
  this.mirror.setAttribute("aria-live","polite");
  this.host.appendChild(this.ctlEl);
  this.host.appendChild(this.wrapEl);
  this.host.appendChild(this.readEl);
  this.host.appendChild(this.mirror);
  this.model = o.model();
  this.cells = {};
  (o.readKeys || []).forEach(function(k){
    var p = mk("span","pair" + (k.big ? " big" : ""));
    p.appendChild(mk("span","k", k.label));
    var v = mk("span","v","n/a");
    p.appendChild(v);
    self.cells[k.id] = v;
    self.readEl.appendChild(p);
  });
  this.loopB = function(ts){ self.loop(ts); };
  if(window.ResizeObserver){
    this.ro = new ResizeObserver(function(){ self.resize(); });
    this.ro.observe(this.wrapEl);
  }
  ANIMS.push(this);
}
Anim.prototype.resize = function(){
  var cssW = this.wrapEl.clientWidth || this.LW;
  var sc = Math.max(1, cssW / this.LW);
  var dpr = window.devicePixelRatio || 1;
  var pw = Math.round(this.LW * sc * dpr), ph = Math.round(this.H * sc * dpr);
  if(pw <= 0 || ph <= 0){ return; }
  this.sc = sc; this.dpr = dpr;
  this.cv.style.width  = (this.LW * sc) + "px";
  this.cv.style.height = (this.H * sc) + "px";
  if(this.cv.width !== pw){ this.cv.width = pw; }
  if(this.cv.height !== ph){ this.cv.height = ph; }
  this.g = this.cv.getContext("2d");
  if(!this.off){ this.off = document.createElement("canvas"); }
  this.off.width = pw; this.off.height = ph;
  var og = this.off.getContext("2d");
  og.setTransform(sc*dpr, 0, 0, sc*dpr, 0, 0);
  og.clearRect(0,0,this.LW,this.H);
  og.lineCap = "round"; og.lineJoin = "round";
  og.fillStyle = "#ffffff";
  og.fillRect(0,0,this.LW,this.H);
  this.o.paintStatic(og, this.LW, this.H, this);
  this.paint();
};
Anim.prototype.paint = function(){
  if(!this.g || this.frozen){ return; }
  var g = this.g;
  g.setTransform(1,0,0,1,0,0);
  g.clearRect(0,0,this.cv.width,this.cv.height);
  g.drawImage(this.off, 0, 0);
  g.setTransform(this.sc*this.dpr, 0, 0, this.sc*this.dpr, 0, 0);
  g.lineCap = "round"; g.lineJoin = "round";
  this.o.paintLive(g, this.LW, this.H, this);
  this.updateRead();
};
Anim.prototype.updateRead = function(){
  var self = this, vals = this.o.readout(this.model, this);
  Object.keys(vals).forEach(function(k){
    var cell = self.cells[k];
    if(!cell){ return; }
    var v = vals[k];
    if(typeof v === "object" && v !== null){
      cell.textContent = v.t;
      cell.className = "v" + (v.cls ? " " + v.cls : "");
    }else{
      cell.textContent = v;
      cell.className = "v";
    }
  });
};
Anim.prototype.doStep = function(now){ this.o.stepModel(this.model, this); this.lastStepAt = now; };
Anim.prototype.loop = function(ts){
  var since = ts - this.lastStepAt;
  if(this.playing && since >= this.stepMs){ this.doStep(ts); since = 0; }
  var tw = Math.max(80, this.stepMs * 0.5);
  this.ease = REDUCED ? 1 : easeOutCubic(clamp01(since / tw));
  this.since = since;
  this.paint();
  if(this.playing || since < tw + 120){ this.raf = requestAnimationFrame(this.loopB); }
  else { this.raf = null; }
};
Anim.prototype.ensureLoop = function(){
  if(this.raf === null && !this.frozen){ this.raf = requestAnimationFrame(this.loopB); }
};
Anim.prototype.play = function(){
  this.playing = true; this.lastStepAt = performance.now(); this.ensureLoop();
  if(this.playBtn){ this.playBtn.classList.add("on"); }
};
Anim.prototype.pause = function(){
  this.playing = false;
  if(this.playBtn){ this.playBtn.classList.remove("on"); }
};
Anim.prototype.stepOnce = function(){ this.pause(); this.doStep(performance.now()); this.ensureLoop(); };
Anim.prototype.reset = function(){
  this.pause();
  this.model = this.o.model(this.model);
  this.lastStepAt = performance.now() - 99999;
  this.ease = 1; this.paint();
};
Anim.prototype.rebuild = function(){ this.resize(); this.ensureLoop(); };
Anim.prototype.setSpeed = function(ms){ this.stepMs = ms; };
Anim.prototype.destroy = function(){
  this.playing = false;
  if(this.raf !== null){ cancelAnimationFrame(this.raf); this.raf = null; }
  if(this.ro){ this.ro.disconnect(); }
};
function grpEl(label){
  var d = mk("div","grp");
  if(label){ d.appendChild(mk("span","lbl", label)); }
  return d;
}
function btnEl(txt, cls){
  var b = mk("button","btn" + (cls ? " " + cls : ""), txt);
  b.type = "button";
  return b;
}
function segEl(items, initial, onPick, cls){
  var s = mk("span","seg" + (cls ? " " + cls : "")), btns = [];
  items.forEach(function(it){
    var b = mk("button", it.sm ? "sm" : "", it.label);
    b.type = "button";
    if(it.v === initial){ b.classList.add("on"); }
    b.addEventListener("click", function(){
      btns.forEach(function(o){ o.classList.remove("on"); });
      b.classList.add("on");
      onPick(it.v);
    });
    btns.push(b);
    s.appendChild(b);
  });
  return s;
}
function sldEl(min, max, stepv, val, fmt, onIn){
  var d = mk("div","sld");
  var i = document.createElement("input");
  i.type = "range"; i.min = min; i.max = max; i.step = stepv; i.value = val;
  var v = mk("span","v", fmt(val));
  i.addEventListener("input", function(){
    var x = parseFloat(i.value);
    v.textContent = fmt(x);
    onIn(x);
  });
  d.appendChild(i); d.appendChild(v);
  d._set = function(x){ i.value = x; v.textContent = fmt(x); };
  d._input = i;
  return d;
}
function transport(a, onReset){
  var g = grpEl("");
  a.playBtn = btnEl("play");
  a.playBtn.addEventListener("click", function(){
    if(a.playing){ a.pause(); a.playBtn.textContent = "play"; }
    else { a.play(); a.playBtn.textContent = "pause"; }
  });
  var st = btnEl("step","sm");
  st.addEventListener("click", function(){ a.stepOnce(); a.playBtn.textContent = "play"; });
  var rs = btnEl("reset","sm");
  rs.addEventListener("click", function(){
    a.reset();
    a.playBtn.textContent = "play";
    if(onReset){ onReset(); }
  });
  g.appendChild(a.playBtn); g.appendChild(st); g.appendChild(rs);
  return g;
}
function speedCtl(a){
  var g = grpEl("speed");
  g.appendChild(segEl([{v:1200,label:"slow",sm:true},{v:700,label:"normal",sm:true},
                       {v:250,label:"fast",sm:true}], 700, function(v){ a.setSpeed(v); }));
  return g;
}

function denseX(n){
  var i, x = [];
  for(i=0;i<n;i++){ x.push(i / (n-1)); }
  return x;
}
var DENSE = denseX(160);
function trainTest(w){
  var i, tr = 0, te = 0, yh;
  for(i=0;i<SX.length;i++){ yh = polyEval(w, SX[i]); tr += (yh - SY[i])*(yh - SY[i]); }
  for(i=0;i<DENSE.length;i++){
    yh = polyEval(w, DENSE[i]);
    te += (yh - sineTrue(DENSE[i]))*(yh - sineTrue(DENSE[i]));
  }
  return { train:R(tr/SX.length), test:R(te/DENSE.length) };
}
function mapX(x,L,Rt){ return L + x * (Rt - L); }
function mapY(y,top,bot,lo,hi){ return top + (hi - y) / (hi - lo) * (bot - top); }
function drawAxes(g,L,Rt,top,bot,lo,hi){
  line(g,L,bot,Rt,bot,C.rule,1);
  line(g,L,top,L,bot,C.rule,1);
  tx(g,"x", Rt-6, bot+16, LABF, C.lgrey, "right");
  tx(g,"y", L-8, top+8, LABF, C.lgrey, "right");
}
function drawSine(g,L,Rt,top,bot,lo,hi){
  g.beginPath();
  DENSE.forEach(function(x,i){
    var X = mapX(x,L,Rt), Y = mapY(sineTrue(x),top,bot,lo,hi);
    if(i===0){ g.moveTo(X,Y); } else { g.lineTo(X,Y); }
  });
  g.strokeStyle = hexA(C.ink, 0.28); g.lineWidth = 2; g.stroke();
}
function drawPoly(g,w,L,Rt,top,bot,lo,hi,col,width){
  g.beginPath();
  DENSE.forEach(function(x,i){
    var yh = polyEval(w,x);
    yh = Math.max(lo, Math.min(hi, yh));
    var X = mapX(x,L,Rt), Y = mapY(yh,top,bot,lo,hi);
    if(i===0){ g.moveTo(X,Y); } else { g.lineTo(X,Y); }
  });
  g.strokeStyle = col; g.lineWidth = width || 2.4; g.stroke();
}
function drawPts(g,L,Rt,top,bot,lo,hi){
  SX.forEach(function(x,i){
    var X = mapX(x,L,Rt), Y = mapY(SY[i],top,bot,lo,hi);
    g.fillStyle = C.amber;
    g.beginPath(); g.arc(X,Y,5.5,0,6.2832); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.stroke();
  });
}

function buildA1(host){
  var a = new Anim({
    host:host, height:340,
    aria:"A sine wave, six noisy training points, and a polynomial of adjustable degree.",
    model:function(prev){ return { M: prev ? prev.M : 0 }; },
    stepModel:function(m){ m.M = Math.min(9, m.M + 1); },
    paintStatic:function(g,W,H){
      tx(g,"true sine (faint) · training points (amber) · polynomial (navy)", 48, 22, LABF, C.lgrey);
    },
    paintLive:function(g,W,H,an){
      var L=48,Rt=900,top=40,bot=310, lo=-1.8, hi=1.8;
      drawAxes(g,L,Rt,top,bot,lo,hi);
      drawSine(g,L,Rt,top,bot,lo,hi);
      var w = polyFit(SX,SY, an.model.M, 1e-8);
      drawPoly(g,w,L,Rt,top,bot,lo,hi,C.blue,2.6);
      drawPts(g,L,Rt,top,bot,lo,hi);
      var tt = trainTest(w);
      halo(g, "degree " + an.model.M, 70, 56, NUMFB, C.ink);
      var tag = tt.train < 1e-4 ? "interpolating" : (an.model.M <= 1 ? "underfitting" : "fitting");
      halo(g, tag, 70, 78, LABFB, tag === "interpolating" ? C.red : (tag === "underfitting" ? C.amber : C.green));
    },
    readout:function(m){
      var w = polyFit(SX,SY,m.M,1e-8), tt = trainTest(w);
      return { M:String(m.M), P:String(m.M+1), train:fx(tt.train,4), test:fx(tt.test,4) };
    },
    readKeys:[{id:"M",label:"degree M"},{id:"P",label:"parameters"},{id:"train",label:"train MSE"},{id:"test",label:"test MSE vs sine"}]
  });
  var c = a.ctlEl;
  c.appendChild(transport(a));
  c.appendChild(mk("span","div"));
  var gd = grpEl("degree");
  gd.appendChild(sldEl(0,9,1,0,function(v){ return String(v); }, function(v){
    a.model.M = v; a.paint();
  }));
  c.appendChild(gd);
  c.appendChild(mk("span","div"));
  c.appendChild(speedCtl(a));
  a.resize();
  return a;
}
function buildA2(host){
  var a = new Anim({
    host:host, height:340,
    aria:"Degree 5 interpolating polynomial on six noisy sine points.",
    model:function(){ return { M:5 }; },
    stepModel:function(){},
    paintStatic:function(g){ tx(g,"degree 5 interpolates N = 6 points", 48, 22, LABF, C.lgrey); },
    paintLive:function(g,W,H,an){
      var L=48,Rt=900,top=40,bot=310, lo=-2.4, hi=2.4;
      drawAxes(g,L,Rt,top,bot,lo,hi);
      drawSine(g,L,Rt,top,bot,lo,hi);
      var w = polyFit(SX,SY,5,1e-10);
      drawPoly(g,w,L,Rt,top,bot,lo,hi,C.plum,2.6);
      drawPts(g,L,Rt,top,bot,lo,hi);
    },
    readout:function(){
      var w = polyFit(SX,SY,5,1e-10), tt = trainTest(w);
      return { train:fx(tt.train,4), test:fx(tt.test,4), nrm:fx(Math.sqrt(w.reduce(function(s,v){return s+v*v;},0)),1) };
    },
    readKeys:[{id:"train",label:"train MSE"},{id:"test",label:"test MSE vs sine"},{id:"nrm",label:"‖w‖"}]
  });
  a.ctlEl.appendChild(mk("span","lbl","static frame · move animation 1's slider to degree 5 to compare"));
  a.resize();
  return a;
}
function jitterSet(seed){
  var rng = mulberry32(seed), i, x, y, xs=[], ys=[];
  for(i=0;i<6;i++){
    x = SX[i];
    y = sineTrue(x) + (rng()-0.5)*0.55;
    xs.push(x); ys.push(y);
  }
  return {x:xs, y:ys};
}
function buildA3(host){
  var a = new Anim({
    host:host, height:360,
    aria:"Many resampled fits: lines on the left, interpolating polynomials on the right.",
    model:function(prev){ return { k: prev && prev.k ? prev.k : 1, max:12 }; },
    stepModel:function(m){ if(m.k < m.max){ m.k++; } },
    paintStatic:function(g,W,H){
      tx(g,"left: degree 1   ·   right: degree 5 interpolators   ·   dashed = mean curve", 48, 22, LABF, C.lgrey);
      line(g,470,36,470,350,C.rule,1);
    },
    paintLive:function(g,W,H,an){
      function panel(x0,x1,M,k){
        var lo=-2, hi=2, top=44, bot=330, L=x0+28, Rt=x1-16, i, j, acc;
        drawSine(g,L,Rt,top,bot,lo,hi);
        acc = DENSE.map(function(){ return 0; });
        for(i=0;i<k;i++){
          var D = jitterSet(1000+i);
          var w = polyFit(D.x, D.y, M, 1e-6);
          drawPoly(g,w,L,Rt,top,bot,lo,hi, hexA(M===1?C.blue:C.plum, 0.28), 1.4);
          for(j=0;j<DENSE.length;j++){ acc[j] += polyEval(w, DENSE[j]); }
          D.x.forEach(function(x,t){
            g.fillStyle = hexA(C.amber, 0.35);
            g.beginPath(); g.arc(mapX(x,L,Rt), mapY(D.y[t],top,bot,lo,hi), 3,0,6.2832); g.fill();
          });
        }
        g.beginPath();
        DENSE.forEach(function(x,j){
          var Y = mapY(acc[j]/k, top,bot,lo,hi), X=mapX(x,L,Rt);
          if(j===0){ g.moveTo(X,Y); } else { g.lineTo(X,Y); }
        });
        g.setLineDash([6,4]); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke(); g.setLineDash([]);
      }
      panel(0,470,1, an.model.k);
      panel(470,940,5, an.model.k);
      halo(g,"low variance", 80, 58, LABFB, C.blue);
      halo(g,"high variance", 500, 58, LABFB, C.plum);
    },
    readout:function(m){ return { k:String(m.k) }; },
    readKeys:[{id:"k",label:"datasets drawn"}]
  });
  var c = a.ctlEl;
  c.appendChild(transport(a));
  c.appendChild(mk("span","div"));
  c.appendChild(speedCtl(a));
  a.resize();
  return a;
}
function buildA4(host){
  var a = new Anim({
    host:host, height:340,
    aria:"Training and test MSE versus polynomial degree.",
    model:function(prev){ return { M: prev ? prev.M : 0 }; },
    stepModel:function(m){ m.M = Math.min(9, m.M+1); },
    paintStatic:function(g){ tx(g,"amber train · navy test · dotted line at interpolation M = 5", 48, 22, LABF, C.lgrey); },
    paintLive:function(g,W,H,an){
      var L=70, Rt=900, top=40, bot=300, i, tr=[], te=[], w, tt;
      for(i=0;i<=9;i++){
        w = polyFit(SX,SY,i,1e-8);
        tt = trainTest(w);
        tr.push(tt.train); te.push(Math.min(tt.test, 1.2));
      }
      var hi = 1.05;
      function xM(M){ return L + M/9*(Rt-L); }
      function yV(v){ return top + (hi-v)/hi*(bot-top); }
      line(g,L,bot,Rt,bot,C.rule,1);
      line(g,L,top,L,bot,C.rule,1);
      var xi = xM(5);
      g.setLineDash([4,4]); line(g,xi,top,xi,bot,C.plum,1.2); g.setLineDash([]);
      tx(g,"P = N", xi+6, top+14, LABFB, C.plum);
      function path(arr,col,upto){
        g.beginPath();
        for(i=0;i<=upto;i++){
          var X=xM(i), Y=yV(arr[i]);
          if(i===0){ g.moveTo(X,Y); } else { g.lineTo(X,Y); }
        }
        g.strokeStyle = col; g.lineWidth = 2.4; g.stroke();
        g.fillStyle = col;
        g.beginPath(); g.arc(xM(upto), yV(arr[upto]), 6,0,6.2832); g.fill();
      }
      path(tr, C.amber, an.model.M);
      path(te, C.blue, an.model.M);
      tx(g,"degree M", 470, 328, LABF, C.lgrey, "center");
    },
    readout:function(m){
      var w = polyFit(SX,SY,m.M,1e-8), tt = trainTest(w);
      return { M:String(m.M), train:fx(tt.train,4), test:fx(tt.test,4) };
    },
    readKeys:[{id:"M",label:"degree"},{id:"train",label:"train MSE"},{id:"test",label:"test MSE"}]
  });
  var c = a.ctlEl;
  c.appendChild(transport(a));
  c.appendChild(mk("span","div"));
  var gd = grpEl("degree");
  gd.appendChild(sldEl(0,9,1,0,function(v){return String(v);}, function(v){ a.model.M=v; a.paint(); }));
  c.appendChild(gd);
  a.resize();
  return a;
}
function ddCurve(P, N){
  /* schematic: U then peak at N then descent toward a floor */
  var t = P / N;
  var under = 0.55 + 0.15*Math.pow(1 - Math.min(t,1), 2) + 0.08*t;
  var peak = 1.8 * Math.exp(-0.5*Math.pow((P-N)/(0.12*N+2), 2));
  var over = 0.22 + 0.45 / (1 + Math.pow(Math.max(t,1), 1.4));
  return under + peak * (t > 0.55 ? 1 : t/0.55) + (t>1 ? over-0.22 : 0);
}
function buildA5(host){
  var a = new Anim({
    host:host, height:340,
    aria:"Schematic double descent of test error versus parameter count.",
    model:function(prev){ return { N: prev ? prev.N : 24, Pshow: prev ? prev.Pshow : 4 }; },
    stepModel:function(m){ m.Pshow = Math.min(80, m.Pshow + 2); },
    paintStatic:function(g){ tx(g,"schematic test error (log-ish) against P.  Dotted: interpolation threshold P = N.", 48, 22, LABF, C.lgrey); },
    paintLive:function(g,W,H,an){
      var L=70,Rt=900,top=40,bot=305, N=an.model.N, Pmax=80, i, P;
      function xP(p){ return L + p/Pmax*(Rt-L); }
      function yE(e){ return top + (2.3-e)/2.3*(bot-top); }
      line(g,L,bot,Rt,bot,C.rule,1);
      line(g,L,top,L,bot,C.rule,1);
      var xn = xP(N);
      g.setLineDash([4,4]); line(g,xn,top,xn,bot,C.plum,1.4); g.setLineDash([]);
      halo(g,"P = N", xn+8, 58, LABFB, C.plum);
      g.beginPath();
      for(i=1;i<=an.model.Pshow;i++){
        P=i; var e=ddCurve(P,N), X=xP(P), Y=yE(e);
        if(i===1){ g.moveTo(X,Y); } else { g.lineTo(X,Y); }
      }
      g.strokeStyle = C.blue; g.lineWidth = 2.6; g.stroke();
      var eNow = ddCurve(an.model.Pshow, N);
      g.fillStyle = C.blue;
      g.beginPath(); g.arc(xP(an.model.Pshow), yE(eNow), 6,0,6.2832); g.fill();
      tx(g,"P  (parameters)", 480, 328, LABF, C.lgrey, "center");
      var lab = an.model.Pshow < N*0.7 ? "classical U" : (Math.abs(an.model.Pshow-N)<N*0.18 ? "interpolation peak" : "second descent");
      halo(g, lab, 80, 64, LABFB, C.ink);
    },
    readout:function(m){
      return { N:String(m.N), P:String(m.Pshow), e:fx(ddCurve(m.Pshow,m.N),3),
               regime: m.Pshow < m.N*0.7 ? "under-P" : (Math.abs(m.Pshow-m.N)<m.N*0.18 ? "peak" : "over-P") };
    },
    readKeys:[{id:"N",label:"N train"},{id:"P",label:"P"},{id:"e",label:"test (schematic)"},{id:"regime",label:"regime"}]
  });
  var c = a.ctlEl;
  c.appendChild(transport(a));
  c.appendChild(mk("span","div"));
  var gn = grpEl("N");
  gn.appendChild(sldEl(8,40,1,24,function(v){return String(v);}, function(v){
    a.model.N = v; a.paint();
  }));
  c.appendChild(gn);
  var gp = grpEl("P");
  gp.appendChild(sldEl(1,80,1,4,function(v){return String(v);}, function(v){
    a.model.Pshow = v; a.paint();
  }));
  c.appendChild(gp);
  a.resize();
  return a;
}
function buildA6(host){
  var a = new Anim({
    host:host, height:340,
    aria:"Degree 9 polynomial with adjustable ridge penalty lambda.",
    model:function(prev){ return { lam: prev ? prev.lam : 0.0001 }; },
    stepModel:function(m){ m.lam = Math.min(10, m.lam * 2); },
    paintStatic:function(g){ tx(g,"M = 9, N = 6.  λ = 0 interpolates.  Large λ is a near-constant.", 48, 22, LABF, C.lgrey); },
    paintLive:function(g,W,H,an){
      var L=48,Rt=900,top=40,bot=310, lo=-2.2, hi=2.2;
      drawAxes(g,L,Rt,top,bot,lo,hi);
      drawSine(g,L,Rt,top,bot,lo,hi);
      var w = polyFit(SX,SY,9, an.model.lam);
      drawPoly(g,w,L,Rt,top,bot,lo,hi,C.blue,2.6);
      drawPts(g,L,Rt,top,bot,lo,hi);
      var tt = trainTest(w);
      var tag = tt.train < 1e-3 && an.model.lam < 1e-3 ? "overfitting" : (tt.train > 0.2 ? "underfitting" : "regularised");
      halo(g, tag, 70, 56, LABFB, tag==="overfitting"?C.red:(tag==="underfitting"?C.amber:C.green));
    },
    readout:function(m){
      var w = polyFit(SX,SY,9,m.lam), tt = trainTest(w);
      return { lam: m.lam >= 0.01 ? fx(m.lam,2) : m.lam.toExponential(0), train:fx(tt.train,4), test:fx(tt.test,4) };
    },
    readKeys:[{id:"lam",label:"λ"},{id:"train",label:"train MSE"},{id:"test",label:"test MSE"}]
  });
  var c = a.ctlEl;
  var gl = grpEl("λ");
  /* log slider from 1e-6 to 10 */
  gl.appendChild(sldEl(-6, 1, 0.1, -4, function(v){
    return Math.pow(10,v).toExponential(0);
  }, function(v){
    a.model.lam = Math.pow(10,v); a.paint();
  }));
  c.appendChild(gl);
  a.resize();
  return a;
}

function l1Contact(wstar, A, eta){
  if(Math.abs(wstar[0]) + Math.abs(wstar[1]) <= eta){ return wstar.slice(); }
  var best = null, bestL = 1e99, signs = [[1,1],[1,-1],[-1,1],[-1,-1]], s, t, w1, w2, dw, g, L, k, w;
  function quad(w){
    var d0 = w[0]-wstar[0], d1 = w[1]-wstar[1];
    return A[0][0]*d0*d0 + 2*A[0][1]*d0*d1 + A[1][1]*d1*d1;
  }
  for(k=0;k<4;k++){
    s = signs[k];
    /* edge s0 w1 + s1 w2 = eta, w1 = s0 * t, w2 = s1 * (eta-t), t in [0,eta] */
    /* scan densely; cheap and robust */
    for(t=0;t<=eta+1e-9;t+=eta/80){
      w = [s[0]*t, s[1]*(eta-t)];
      L = quad(w);
      if(L < bestL){ bestL = L; best = w; }
    }
  }
  return best;
}
function l2Contact(wstar, A, eta){
  var n2 = wstar[0]*wstar[0] + wstar[1]*wstar[1];
  if(n2 <= eta){ return wstar.slice(); }
  /* For isotropic A this is just projection. For general A, scan the circle. */
  var best = null, bestL = 1e99, th, w, d0, d1, L, r = Math.sqrt(eta);
  function quad(w){
    d0 = w[0]-wstar[0]; d1 = w[1]-wstar[1];
    return A[0][0]*d0*d0 + 2*A[0][1]*d0*d1 + A[1][1]*d1*d1;
  }
  for(th=0;th<6.2832;th+=0.02){
    w = [r*Math.cos(th), r*Math.sin(th)];
    L = quad(w);
    if(L < bestL){ bestL = L; best = w; }
  }
  return best;
}
function buildR2(host){
  var wstar = [1.55, 1.15], A = [[1.6, 0.55],[0.55, 1.05]];
  var a = new Anim({
    host:host, height:420, aria:"L1 diamond versus L2 disk",
    model:function(prev){ return {eta: prev && prev.eta !== undefined ? prev.eta : 1.2}; },
    paintStatic:function(){},
    paintLive:function(g,W,H,anim){
      var L=70, Rt=W/2-20, top=36, bot=H-48, lo=-2.4, hi=2.4;
      var L2=W/2+50, Rt2=W-30;
      function X(x,left,right){ return left + (x-lo)/(hi-lo)*(right-left); }
      function Y(y){ return top + (hi-y)/(hi-lo)*(bot-top); }
      function axes(left,right,title){
        line(g,left,Y(0),right,Y(0),C.rule,1);
        line(g,X(0,left,right),top,X(0,left,right),bot,C.rule,1);
        tx(g,"w₁", right-4, Y(0)+16, LABF, C.lgrey, "right");
        tx(g,"w₂", X(0,left,right)+8, top+12, LABF, C.lgrey, "left");
        tx(g,title, (left+right)/2, 18, LABFB, C.ink, "center");
      }
      function ellipses(left,right){
        var k, th, w, d0,d1,val, pts;
        for(k=0.4;k<=3.2;k+=0.45){
          g.beginPath();
          var first=true;
          for(th=0;th<=6.2832;th+=0.04){
            /* points where quad = k: sample circle around wstar and scale — skip, draw iso by polar from wstar with metric A */
            var c = Math.cos(th), s = Math.sin(th);
            /* solve t^2 [c,s] A [c;s] = k */
            var q = A[0][0]*c*c + 2*A[0][1]*c*s + A[1][1]*s*s;
            var t = Math.sqrt(k / q);
            w = [wstar[0]+t*c, wstar[1]+t*s];
            var px=X(w[0],left,right), py=Y(w[1]);
            if(first){ g.moveTo(px,py); first=false; } else g.lineTo(px,py);
          }
          g.closePath();
          g.strokeStyle = hexA(C.lgrey, 0.55); g.lineWidth = 1; g.stroke();
        }
        g.fillStyle = C.amber;
        g.beginPath(); g.arc(X(wstar[0],left,right), Y(wstar[1]), 5, 0, 6.28); g.fill();
        tx(g,"OLS", X(wstar[0],left,right)+8, Y(wstar[1])-6, TINYF, C.amber, "left");
      }
      axes(L,Rt,"L1 · diamond"); ellipses(L,Rt);
      var eta = anim.model.eta;
      g.beginPath();
      g.moveTo(X(eta,L,Rt), Y(0)); g.lineTo(X(0,L,Rt), Y(eta));
      g.lineTo(X(-eta,L,Rt), Y(0)); g.lineTo(X(0,L,Rt), Y(-eta));
      g.closePath();
      g.fillStyle = hexA(C.amber, 0.12); g.fill();
      g.strokeStyle = C.amber; g.lineWidth = 2; g.stroke();
      var p1 = l1Contact(wstar, A, eta);
      g.fillStyle = C.plum;
      g.beginPath(); g.arc(X(p1[0],L,Rt), Y(p1[1]), 6, 0, 6.28); g.fill();

      axes(L2,Rt2,"L2 · disk"); ellipses(L2,Rt2);
      g.beginPath();
      g.arc(X(0,L2,Rt2), Y(0), Math.abs(X(eta,L2,Rt2)-X(0,L2,Rt2)), 0, 6.28);
      g.fillStyle = hexA(C.blue, 0.10); g.fill();
      g.strokeStyle = C.blue; g.lineWidth = 2; g.stroke();
      var p2 = l2Contact(wstar, A, eta * eta);
      g.fillStyle = C.plum;
      g.beginPath(); g.arc(X(p2[0],L2,Rt2), Y(p2[1]), 6, 0, 6.28); g.fill();
      tx(g,"η = "+fx(eta,2)+"   L1 ŵ = ("+fx(p1[0],2)+", "+fx(p1[1],2)+")   L2 ŵ = ("+fx(p2[0],2)+", "+fx(p2[1],2)+")",
         W/2, H-14, LABF, C.grey, "center");
    },
    stepModel:function(){},
    readout:function(m){
      var p1 = l1Contact(wstar, A, m.eta), p2 = l2Contact(wstar, A, m.eta * m.eta);
      return {eta:fx(m.eta,2), l1:"("+fx(p1[0],2)+", "+fx(p1[1],2)+")", l2:"("+fx(p2[0],2)+", "+fx(p2[1],2)+")"};
    },
    readKeys:[{id:"eta",label:"η"},{id:"l1",label:"L1 ŵ"},{id:"l2",label:"L2 ŵ"}]
  });
  var g = grpEl("constraint budget η");
  g.appendChild(sldEl(0.15, 3.2, 0.05, 1.2, function(v){ return Number(v).toFixed(2); }, function(v){
    a.model.eta = v; a.paint();
  }));
  a.ctlEl.appendChild(g);
  a.resize();
  return a;
}
function buildR3(host){
  var lams = [], i, ridgeP = [], lassoP = [];
  for(i=0;i<=40;i++){ lams.push(Math.pow(10, -2 + i*(3.2)/40)); }
  lams.forEach(function(lam){
    var wr = ridge2(lam), wl = lasso2(lam, 800);
    ridgeP.push(wr); lassoP.push(wl);
  });
  var a = new Anim({
    host:host, height:380, aria:"regularisation paths",
    model:function(prev){ return {lam: prev && prev.lam !== undefined ? prev.lam : 2}; },
    paintStatic:function(){},
    paintLive:function(g,W,H,anim){
      var L=60, Rt=W-30, top=28, bot=H-50, lo=-0.2, hi=2.2;
      function X(lam){ return L + (Math.log(lam)-Math.log(0.01))/(Math.log(1000)-Math.log(0.01))*(Rt-L); }
      function Y(w){ return top + (hi-w)/(hi-lo)*(bot-top); }
      line(g,L,bot,Rt,bot,C.rule,1); line(g,L,top,L,bot,C.rule,1);
      tx(g,"λ (log)", Rt, bot+18, LABF, C.lgrey, "right");
      function path(pts, idx, col, dash){
        g.save();
        if(dash){ g.setLineDash([7,5]); }
        g.beginPath();
        pts.forEach(function(w,i){
          var x=X(lams[i]), y=Y(w[idx]);
          if(i===0) g.moveTo(x,y); else g.lineTo(x,y);
        });
        g.strokeStyle = col; g.lineWidth = 2.2; g.stroke();
        g.restore();
      }
      path(lassoP,0,C.amber,false); path(lassoP,1,C.plum,false);
      path(ridgeP,0,C.amber,true); path(ridgeP,1,C.plum,true);
      var lam = anim.model.lam;
      line(g, X(lam), top, X(lam), bot, hexA(C.ink,0.25), 1.2);
      var wr = ridge2(lam), wl = lasso2(lam, 800);
      g.fillStyle = C.amber; g.beginPath(); g.arc(X(lam), Y(wl[0]), 5,0,6.28); g.fill();
      g.fillStyle = C.plum; g.beginPath(); g.arc(X(lam), Y(wl[1]), 5,0,6.28); g.fill();
      tx(g,"solid lasso   dashed ridge   amber w₁   plum w₂", W/2, H-14, LABF, C.grey, "center");
    },
    stepModel:function(){},
    readout:function(m){
      var wr = ridge2(m.lam), wl = lasso2(m.lam, 800);
      return {lam:fx(m.lam,2), rw:"("+fx(wr[0],4)+", "+fx(wr[1],4)+")", lw:"("+fx(wl[0],4)+", "+fx(wl[1],4)+")"};
    },
    readKeys:[{id:"lam",label:"λ"},{id:"lw",label:"lasso w"},{id:"rw",label:"ridge w"}]
  });
  var g = grpEl("λ");
  g.appendChild(sldEl(-2, 3, 0.05, Math.log(2)/Math.log(10), function(v){
    return Math.pow(10,v).toFixed(2);
  }, function(v){ a.model.lam = Math.pow(10,v); a.paint(); }));
  a.ctlEl.appendChild(g);
  a.resize();
  return a;
}
function buildR4(host){
  var H0 = [1.2, -0.4, 2.0, 0.8];
  var a = new Anim({
    host:host, height:340, aria:"dropout on four hidden units",
    model:function(prev){
      return {p: prev && prev.p !== undefined ? prev.p : 0.5,
              test: prev && prev.test ? 1 : 0,
              mask: (prev && prev.mask) ? prev.mask.slice() : [1,0,1,0],
              rng: prev && prev.rng ? prev.rng : mulberry32(7)};
    },
    paintStatic:function(){},
    paintLive:function(g,W,H,anim){
      var m = anim.model, i, x, bw = 70, gap = 40, left = 90;
      tx(g, m.test ? "test · full net, no scale" : "train · inverted dropout", 20, 24, LABFB, C.ink, "left");
      for(i=0;i<4;i++){
        x = left + i*(bw+gap);
        var keep = m.test ? 1 : m.mask[i];
        var fwd = m.test ? H0[i] : (keep * H0[i] / m.p);
        g.fillStyle = hexA(C.lgrey, 0.25);
        g.fillRect(x, 80, bw, 180);
        var hgt = Math.abs(H0[i]) * 50;
        g.fillStyle = hexA(C.ink, 0.25);
        g.fillRect(x+12, H0[i]>=0 ? 170-hgt : 170, bw-24, hgt);
        hgt = Math.abs(fwd) * 50;
        g.fillStyle = keep ? C.amber : C.red;
        g.fillRect(x+22, fwd>=0 ? 170-hgt : 170, bw-44, Math.max(hgt,2));
        tx(g, "h="+fx(H0[i],1), x+bw/2, 280, LABF, C.grey, "center");
        tx(g, keep ? "keep" : "drop", x+bw/2, 300, TINYF, keep ? C.green : C.red, "center");
        tx(g, "h̃="+fx(fwd,2), x+bw/2, 64, NUMFB, C.ink, "center");
      }
    },
    stepModel:function(m){
      if(m.test){ return; }
      m.mask = [0,0,0,0];
      var i;
      for(i=0;i<4;i++){ m.mask[i] = m.rng() < m.p ? 1 : 0; }
    },
    readout:function(m){
      var i, fwd=[], keep=0;
      for(i=0;i<4;i++){
        keep += m.test ? 1 : m.mask[i];
        fwd.push(m.test ? H0[i] : m.mask[i]*H0[i]/m.p);
      }
      return {p:fx(m.p,2), kept: String(keep)+"/4", mode: m.test ? "test" : "train"};
    },
    readKeys:[{id:"mode",label:"mode"},{id:"p",label:"p"},{id:"kept",label:"kept"}]
  });
  a.ctlEl.appendChild(transport(a));
  a.ctlEl.appendChild(speedCtl(a));
  var gp = grpEl("keep p");
  gp.appendChild(sldEl(0.2, 1, 0.05, 0.5, function(v){ return Number(v).toFixed(2); }, function(v){
    a.model.p = v; a.paint();
  }));
  a.ctlEl.appendChild(gp);
  a.ctlEl.appendChild(segEl([{v:0,label:"train"},{v:1,label:"test"}], 0, function(v){
    a.model.test = v; a.paint();
  }));
  a.resize(); return a;
}
function buildR5(host){
  var a = new Anim({
    host:host, height:360, aria:"batch normalisation of four activations",
    model:function(prev){
      return {u3: prev && prev.u3 !== undefined ? prev.u3 : 7,
              gamma: prev && prev.gamma !== undefined ? prev.gamma : 2,
              beta: prev && prev.beta !== undefined ? prev.beta : 1,
              test: prev && prev.test ? 1 : 0,
              runMu: 4, runVar: 5};
    },
    paintStatic:function(){},
    paintLive:function(g,W,H,anim){
      var m = anim.model, u = [1,3,5,m.u3], i;
      var st = m.test ? {mu:m.runMu, var:m.runVar} : bnStats(u);
      var std = Math.sqrt(st.var + 1e-8);
      var L=70, Rt=W-40, top=40, bot=H-70, lo=-4, hi=12;
      function X(x){ return L + (x-lo)/(hi-lo)*(Rt-L); }
      function Y(){ return (top+bot)/2; }
      line(g,L,Y(),Rt,Y(),C.rule,1);
      line(g, X(st.mu), top, X(st.mu), bot, C.blue, 1.4);
      g.fillStyle = hexA(C.blue, 0.12);
      g.fillRect(X(st.mu-std), top, X(st.mu+std)-X(st.mu-std), bot-top);
      tx(g,"μ", X(st.mu)+6, top+14, TINYF, C.blue, "left");
      for(i=0;i<4;i++){
        g.fillStyle = hexA(C.ink, 0.35);
        g.beginPath(); g.arc(X(u[i]), Y()-28, 8, 0, 6.28); g.fill();
        tx(g,"u"+ (i+1), X(u[i]), Y()-42, TINYF, C.grey, "center");
        var uh = (u[i]-st.mu)/std;
        var y = m.gamma*uh + m.beta;
        g.fillStyle = C.amber;
        g.beginPath(); g.arc(X(y), Y()+32, 8, 0, 6.28); g.fill();
        tx(g, fx(y,2), X(y), Y()+54, LABF, C.amber, "center");
      }
      tx(g, (m.test?"test running":"batch")+"  μ="+fx(st.mu,2)+"  σ²="+fx(st.var,2), 20, H-18, LABF, C.grey, "left");
    },
    stepModel:function(){},
    readout:function(m){
      var u=[1,3,5,m.u3], st = m.test?{mu:m.runMu,var:m.runVar}:bnStats(u);
      return {mu:fx(st.mu,4), varr:fx(st.var,4), g:fx(m.gamma,2), b:fx(m.beta,2)};
    },
    readKeys:[{id:"mu",label:"μ"},{id:"varr",label:"σ²"},{id:"g",label:"γ"},{id:"b",label:"β"}]
  });
  var g1 = grpEl("u₄"); g1.appendChild(sldEl(-2, 14, 0.1, 7, function(v){ return Number(v).toFixed(1); }, function(v){ a.model.u3=v; a.paint(); }));
  var g2 = grpEl("γ"); g2.appendChild(sldEl(0.2, 4, 0.05, 2, function(v){ return Number(v).toFixed(2); }, function(v){ a.model.gamma=v; a.paint(); }));
  var g3 = grpEl("β"); g3.appendChild(sldEl(-3, 4, 0.05, 1, function(v){ return Number(v).toFixed(2); }, function(v){ a.model.beta=v; a.paint(); }));
  a.ctlEl.appendChild(g1); a.ctlEl.appendChild(g2); a.ctlEl.appendChild(g3);
  a.ctlEl.appendChild(segEl([{v:0,label:"train (batch stats)"},{v:1,label:"test (running)"}], 0, function(v){ a.model.test=v; a.paint(); }));
  a.resize(); return a;
}
function gdPoly(w, x, y, lr){
  var n=x.length, p=w.length, i,j, pred, err, g, v;
  var grad=[]; for(j=0;j<p;j++) grad[j]=0;
  for(i=0;i<n;i++){
    pred=polyEval(w,x[i]); err=pred-y[i]; v=1;
    for(j=0;j<p;j++){ grad[j]+= (2/n)*err*v; v*=x[i]; }
  }
  var out=[];
  for(j=0;j<p;j++) out[j]=w[j]-lr*grad[j];
  return out;
}
function buildR6(host){
  var VALX=[], VALY=[], i;
  for(i=0;i<40;i++){ VALX.push(i/39); VALY.push(sineTrue(VALX[i])); }
  var a = new Anim({
    host:host, height:400, aria:"early stopping train versus validation",
    model:function(){
      var w=[], j; for(j=0;j<10;j++) w[j]=0;
      return {w:w, t:0, lr:0.4, histT:[], histV:[], bestT:0, bestV:1e9};
    },
    paintStatic:function(){},
    paintLive:function(g,W,H,anim){
      var m=anim.model, L=50, Rt=W-20, top=20, bot=H-160, lo=-1.6, hi=1.6;
      function Xx(x){ return L + x*(Rt-L); }
      function Yy(y){ return top + (hi-y)/(hi-lo)*(bot-top); }
      line(g,L,bot,Rt,bot,C.rule,1);
      var xs, k;
      g.beginPath();
      for(k=0;k<=80;k++){
        xs=k/80; var px=Xx(xs), py=Yy(sineTrue(xs));
        if(k===0) g.moveTo(px,py); else g.lineTo(px,py);
      }
      g.strokeStyle=hexA(C.ink,0.35); g.lineWidth=1.4; g.stroke();
      g.beginPath();
      for(k=0;k<=80;k++){
        xs=k/80; var px=Xx(xs), py=Yy(polyEval(m.w,xs));
        if(k===0) g.moveTo(px,py); else g.lineTo(px,py);
      }
      g.strokeStyle=C.amber; g.lineWidth=2.2; g.stroke();
      for(k=0;k<SX.length;k++){
        g.fillStyle=C.ink;
        g.beginPath(); g.arc(Xx(SX[k]), Yy(SY[k]), 4,0,6.28); g.fill();
      }
      var ctop=bot+28, cbot=H-28, maxE=0.8;
      function Yc(e){ return ctop + (e/maxE)*(cbot-ctop); }
      function Xc(t){ var T=Math.max(40, m.t); return L + (t/T)*(Rt-L); }
      line(g,L,ctop,Rt,ctop,C.rule,1);
      function curve(hist,col){
        if(hist.length<2) return;
        g.beginPath();
        hist.forEach(function(e,t){ var x=Xc(t), y=Yc(Math.min(e,maxE)); if(t===0) g.moveTo(x,y); else g.lineTo(x,y); });
        g.strokeStyle=col; g.lineWidth=2; g.stroke();
      }
      curve(m.histT, C.amber); curve(m.histV, C.blue);
      if(m.histV.length){
        g.fillStyle=C.plum;
        g.beginPath(); g.arc(Xc(m.bestT), Yc(Math.min(m.bestV,maxE)), 5,0,6.28); g.fill();
      }
      tx(g,"amber train   navy validation   star = early-stop checkpoint", W/2, H-10, LABF, C.grey, "center");
    },
    stepModel:function(m){
      m.w = gdPoly(m.w, SX, SY, m.lr);
      var tr=0, va=0, k, yh;
      for(k=0;k<SX.length;k++){ yh=polyEval(m.w,SX[k]); tr+=(yh-SY[k])*(yh-SY[k]); }
      for(k=0;k<VALX.length;k++){ yh=polyEval(m.w,VALX[k]); va+=(yh-VALY[k])*(yh-VALY[k]); }
      tr/=SX.length; va/=VALX.length;
      m.histT.push(tr); m.histV.push(va); m.t++;
      if(va < m.bestV){ m.bestV=va; m.bestT=m.t-1; }
    },
    readout:function(m){
      var tr = m.histT.length ? m.histT[m.histT.length-1] : NaN;
      var va = m.histV.length ? m.histV[m.histV.length-1] : NaN;
      return {ep:String(m.t), tr:fx(tr,4), va:fx(va,4), best:String(m.bestT)};
    },
    readKeys:[{id:"ep",label:"epoch"},{id:"tr",label:"train MSE"},{id:"va",label:"val MSE"},{id:"best",label:"best epoch"}]
  });
  a.ctlEl.appendChild(transport(a));
  a.ctlEl.appendChild(speedCtl(a));
  var gl = grpEl("learning rate");
  gl.appendChild(sldEl(0.05, 1.2, 0.05, 0.4, function(v){ return Number(v).toFixed(2); }, function(v){ a.model.lr=v; }));
  a.ctlEl.appendChild(gl);
  a.resize(); return a;
}

var ANIM_BUILDERS = { r1:buildA6, r2:buildR2, r3:buildR3, r4:buildR4, r5:buildR5, r6:buildR6 };
function buildAllAnims(){
  each(document.querySelectorAll("[data-anim]"), function(host){
    var id = host.getAttribute("data-anim");
    if(!ANIM_BUILDERS[id]){ return; }
    ANIM_BUILDERS[id](host);
  });
}
function destroyAnims(){
  ANIMS.forEach(function(a){ a.destroy(); });
  ANIMS.length = 0;
}
function freezeAnims(){
  ANIMS.forEach(function(a){
    a.pause();
    a.paint();
    var url = null;
    try{ url = a.cv.toDataURL("image/png"); }catch(e){ url = null; }
    if(url){
      if(!a.shot){
        a.shot = document.createElement("img");
        a.shot.className = "printshot";
        a.wrapEl.appendChild(a.shot);
      }
      a.shot.src = url;
      a.frozen = true;
    }
  });
}
function thawAnims(){
  ANIMS.forEach(function(a){ a.frozen = false; a.paint(); });
}

function runSelfTest(){
  var groups = [], failures = [];
  function G(name, fn){
    var errs = [];
    function eq(label, got, want, tol){
      var t = (tol === undefined) ? 1e-9 : tol;
      if(typeof got === "number" && typeof want === "number"){
        if(!(Math.abs(got - want) <= t)){ errs.push(label + ": expected " + want + ", got " + got); }
      }else if(String(got) !== String(want)){
        errs.push(label + ": expected " + want + ", got " + got);
      }
    }
    function ok(label, cond){ if(!cond){ errs.push(label); } }
    try{ fn(eq, ok); } catch(e){ errs.push("threw: " + e.message); }
    groups.push({name:name, errs:errs});
    if(errs.length){ failures.push({name:name, errs:errs}); }
  }
  G("1. three-point arithmetic", function(eq){
    eq("mean", PT_MEAN, 1);
    eq("const train", PT_CONST_TR, 0.6667, 5e-4);
    eq("lin train", PT_LIN_TR, 0.5, 5e-4);
    eq("quad(3)", quad(3), -5, 1e-9);
    eq("quad(-1)", quad(-1), -3, 1e-9);
    eq("const te", PT_CONST_TE, 1.25, 5e-4);
    eq("lin te", PT_LIN_TE, 0.25, 5e-4);
    eq("quad te", PT_QUAD_TE, 30.25, 5e-4);
  });
  G("2. bias-variance table", function(eq){
    eq("A bias2", STAT_A.bias2, 4);
    eq("A var", STAT_A.var, 0);
    eq("A risk", STAT_A.risk, 5);
    eq("B mean", STAT_B.mean, 5);
    eq("B var", STAT_B.var, 0.6667, 5e-4);
    eq("B risk", STAT_B.risk, 1.6667, 5e-4);
    eq("C bias2", STAT_C.bias2, 0.25, 5e-4);
    eq("C var", STAT_C.var, 0.1667, 5e-4);
    eq("C risk", STAT_C.risk, 1.4167, 5e-4);
  });
  G("3. blanks well formed", function(eq, ok){
    var seen = {}, referenced = {};
    BLANKS.forEach(function(B){
      ok("duplicate " + B.id, !seen[B.id]); seen[B.id] = true;
      ok(B.id + " correct in options", B.options.indexOf(B.correct) >= 0);
      if(B.prompt){
        ok(B.id + " prompt contains {{slot}}", B.prompt.indexOf("{{slot}}") >= 0);
      }
      B.options.forEach(function(o){
        if(o === B.correct){ return; }
        ok(B.id + " hint for " + o, !!(B.hints && B.hints[o]));
      });
    });
    function walk(blocks){
      blocks.forEach(function(b){
        if(b.t === "blank"){ referenced[b.id] = true; }
        if(b.t === "blanks"){ b.ids.forEach(function(i){ referenced[i] = true; }); }
      });
    }
    SECTIONS.forEach(function(s){ walk(s.blocks); });
    BLANKS.forEach(function(B){ ok("placed " + B.id, !!referenced[B.id]); });
    Object.keys(referenced).forEach(function(id){ ok("exists " + id, !!BYID[id]); });
  });
  G("4. MCQs well formed", function(eq, ok){
    var n = 0;
    function walk(blocks){
      blocks.forEach(function(b){
        if(b.t !== "mcq"){ return; }
        n++;
        ok("range " + b.tag, b.answer >= 0 && b.answer < b.opts.length);
        b.opts.forEach(function(o,i){
          if(i === b.answer){ ok(b.tag + " correct has no hint", !o.hint); }
          else { ok(b.tag + " wrong has hint", !!(o.hint && o.hint.length)); }
        });
      });
    }
    SECTIONS.forEach(function(s){ walk(s.blocks); });
    ok("mcq count >= 8", n >= 8); eq("mcq present", n>=8, true);
  });
  G("5. glossary keys used exist", function(eq, ok){
    var ids = {};
    Object.keys(GLOSS).forEach(function(k){ ids[k] = false; });
    var blob = JSON.stringify(SECTIONS) + JSON.stringify(BLANKS);
    blob.replace(/\{t:([a-z0-9_]+)\}/g, function(_,k){
      ok("unknown term " + k, !!GLOSS[k]);
      ids[k] = true;
      return _;
    });
  });
  G("6. progress denominator", function(eq){
    eq("counted", TOTAL_BLANKS, BLANKS.filter(function(B){ return B.counts !== false; }).length);
  });
  G("7. slots rendered, no leftover tokens", function(eq, ok){
    ok("P1 slot in the DOM", !!document.getElementById("slot-P1"));
    ok("L2a slot in the DOM", !!document.getElementById("slot-L2a"));
    var t = document.getElementById("doc").innerText;
    ok("no {slot} left in the sheet", t.indexOf("{slot}") < 0);
    ok("no {{slot}} left in the sheet", t.indexOf("{{slot}}") < 0);
  });
  var passed = groups.length - failures.length;
  if(!failures.length){
    console.log("SELF-TEST: " + passed + "/" + groups.length + " groups passed");
  }else{
    console.error("SELF-TEST: " + passed + "/" + groups.length + " failed");
    failures.forEach(function(f){
      console.error("  " + f.name);
      f.errs.forEach(function(e){ console.error("      " + e); });
    });
  }
  return { total:groups.length, passed:passed, failures:failures, blanks:TOTAL_BLANKS };
}

render();
applyCollapse();
initChrome();
window.SELFTEST = runSelfTest();
