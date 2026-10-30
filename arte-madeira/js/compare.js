/* Comparador antes/depois. A costura é uma fresa girando; arrastar solta serragem.
   Uso: const cmp = createCompare(el); cmp.set({wood, piece, text, seed}); cmp.paint(); */
import { $, reduce } from "./dom.js";
import { fit, offscreen, paintWood, paintRough, engrave } from "./wood.js";

export function createCompare(el){
  const cv = $("canvas", el), range = $("input", el);
  let opts = {}, layers = null, dust = [], raf = 0, intro = false;

  function build(){
    const o = fit(cv); if (!o) return null;
    const {W,H,dpr} = o;
    const before = offscreen(W,H,dpr), after = offscreen(W,H,dpr);
    paintRough(before.c, W, H, opts.wood, opts.seed);
    engrave(paintWood(after.c, W, H, opts.wood, opts.seed), {text:opts.text||"", piece:opts.piece});
    return layers = {...o, before:before.cv, after:after.cv};
  }
  function draw(){
    if (!layers) return;
    const {c,W,H,dpr,before,after} = layers, x = W*range.value/100;
    c.setTransform(1,0,0,1,0,0); c.drawImage(after,0,0);
    c.save(); c.beginPath(); c.rect(0,0,x*dpr,H*dpr); c.clip(); c.drawImage(before,0,0); c.restore();
    c.setTransform(dpr,0,0,dpr,0,0);
    dust = dust.filter(p => (p.life -= 1) > 0);
    dust.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .12; c.fillStyle = `rgba(236,214,172,${p.life/40})`; c.fillRect(p.x,p.y,2,2) });
    el.style.setProperty("--x", range.value + "%");
    if (dust.length) raf = requestAnimationFrame(draw); else raf = 0;
  }
  function spray(){
    if (reduce || !layers) return;
    const x = layers.W*range.value/100;
    for (let i=0;i<6;i++) dust.push({x, y:layers.H/2+(Math.random()-.5)*30, vx:(Math.random()-.5)*3, vy:-Math.random()*2.5, life:40});
    if (!raf) raf = requestAnimationFrame(draw);
  }
  range.addEventListener("input", () => { draw(); spray() });

  /* na primeira vez que aparece, a fresa varre a tábua e para no meio */
  function playIntro(){
    if (intro || reduce) return; intro = true;
    const t0 = performance.now(), from = 100, to = 50;
    const tick = now => { const p = Math.min(1,(now-t0)/1400), e = 1-Math.pow(1-p,3);
      range.value = from + (to-from)*e; draw(); if (p<1) requestAnimationFrame(tick) };
    range.value = 100; requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ playIntro(); io.disconnect() } }), {threshold:.4});
  io.observe(el);

  return {
    set(o){ opts = {...opts, ...o}; },
    paint(){ if (build()) draw() },
    reset(){ range.value = 50; }
  };
}

export function compareFromData(el){
  const cmp = createCompare(el), d = el.dataset;
  cmp.set({wood:d.wood, piece:d.piece, text:d.text, seed:+d.seed});
  return cmp;
}
