/* Sob medida: o texto do visitante passa por quatro etapas reais (rascunho, vetor, G-code, peça).
   A etapa muda com a rolagem (ou pelas abas); o G-code é gerado de verdade a partir das linhas de varredura do texto. */
import { $, $$, reduce, mm } from "./dom.js";
import { fit, offscreen, setFont, rrect, paintWood, engrave, rng } from "./wood.js";
import { onShow, currentView } from "./router.js";
import { prefill } from "./wizard.js";

const BOARD_MM = [600, 200], Z = -2.0, FEED = 1800;
const P = {text:"Família Ribeiro", stage:0, geo:null, raf:0, prog:1, fade:null};

/* geometria compartilhada pelas etapas: tábua, fonte, linhas de varredura e G-code */
function build(){
  const o = fit($("#stage-cv")); if (!o) return null;
  const {W,H} = o, bx=W*.07, by=H*.16, bw=W*.86, bh=H*.68;
  const m = offscreen(W,H,1); let fs = Math.min(bh*.42, bw*.13); setFont(m.c,fs);
  while (P.text && m.c.measureText(P.text).width > bw*.8 && fs > 10){ fs--; setFont(m.c,fs) }
  m.c.textAlign="center"; m.c.textBaseline="middle"; m.c.fillStyle="#000"; if (P.text) m.c.fillText(P.text, W/2, H/2);
  const data = m.c.getImageData(0,0,m.cv.width,m.cv.height).data, a = (x,y) => data[(y*m.cv.width+x)*4+3];
  const step = Math.max(2.5, fs/10), segs = [];
  let row = 0;
  for (let y = Math.round(H/2-fs*.7); y < H/2+fs*.7; y += step, row++){
    const yy = Math.round(y), line = []; let inS = -1;
    for (let x=0; x<W; x++){ const on = a(x,yy) > 110; if (on && inS<0) inS=x; if (!on && inS>=0){ line.push([inS,x]); inS=-1 } }
    if (row % 2) line.reverse().forEach(s => s.reverse());
    line.forEach(([x0,x1]) => segs.push({y:yy, x0, x1}));
  }
  /* nós do vetor: pontos de borda espaçados */
  const nodes = [];
  for (let y=2; y<H-2; y+=5) for (let x=2; x<W-2; x+=5){
    if (a(x,y)>110 && (a(x+3,y)<=110 || a(x-3,y)<=110 || a(x,y+3)<=110 || a(x,y-3)<=110)) nodes.push([x,y]);
  }
  const toMM = (x,y) => [((x-bx)/bw*BOARD_MM[0]).toFixed(1), ((by+bh-y)/bh*BOARD_MM[1]).toFixed(1)];
  const head = ["%", `(Arte & Madeira · "${P.text}")`, "(fresa V 60 graus · mesa 600 x 200 mm)", "G21 G90 G17", "M3 S18000", "G0 Z5.0"];
  const gc = [...head]; let cutLen = 0;
  segs.forEach(s => { const [x0,y]=toMM(s.x0,s.y), [x1]=toMM(s.x1,s.y); cutLen += Math.abs(x1-x0);
    gc.push(`G0 X${x0} Y${y}`, `G1 Z${Z.toFixed(1)} F600`, `G1 X${x1} F${FEED}`, "G0 Z5.0") });
  gc.push("M5", "G0 X0 Y0", "M30", "%");
  const minutes = cutLen/FEED + segs.length*0.02;
  return P.geo = {...o, bx, by, bw, bh, fs, segs, nodes, gc, head:head.length, minutes, seed:[...P.text].reduce((s,c)=>s+c.charCodeAt(0),7)};
}

/* ---------- desenho de cada etapa ---------- */
function bed(c,W,H){
  c.fillStyle="#1E1813"; c.fillRect(0,0,W,H);
  c.strokeStyle="rgba(255,255,255,.045)"; c.lineWidth=1;
  for (let x=0;x<W;x+=14){ c.beginPath(); c.moveTo(x+.5,0); c.lineTo(x+.5,H); c.stroke() }
  for (let y=0;y<H;y+=14){ c.beginPath(); c.moveTo(0,y+.5); c.lineTo(W,y+.5); c.stroke() }
}
function dims(c,g){
  const {bx,by,bw,bh} = g; c.strokeStyle="rgba(215,219,216,.45)"; c.fillStyle="rgba(215,219,216,.75)"; c.lineWidth=1;
  c.font="500 10px JetBrains Mono, monospace"; c.textAlign="center"; c.textBaseline="bottom";
  c.beginPath(); c.moveTo(bx,by-10); c.lineTo(bx+bw,by-10); c.moveTo(bx,by-14); c.lineTo(bx,by-6); c.moveTo(bx+bw,by-14); c.lineTo(bx+bw,by-6); c.stroke();
  c.fillText(`${BOARD_MM[0]} mm`, bx+bw/2, by-12);
  c.fillStyle="#D8AC4A"; c.beginPath(); c.arc(bx,by+bh,3,0,Math.PI*2); c.fill();
  c.fillStyle="rgba(215,219,216,.75)"; c.textAlign="left"; c.textBaseline="top"; c.fillText("X0 Y0", bx+6, by+bh+5);
}
function stageIdea(c,g){
  const {W,H,bx,by,bw,bh,fs} = g, R = rng(g.seed);
  c.fillStyle="#ECE7DC"; c.fillRect(0,0,W,H);
  c.strokeStyle="rgba(70,110,150,.13)"; c.lineWidth=1;
  for (let y=10;y<H;y+=12){ c.beginPath(); c.moveTo(0,y+.5); c.lineTo(W,y+.5); c.stroke() }
  const pencil = (fn) => { for (let k=0;k<3;k++){ c.save(); c.translate((R()-.5)*2.4,(R()-.5)*2.4); c.rotate((R()-.5)*.01); fn(); c.restore() } };
  c.strokeStyle="rgba(48,46,42,.42)"; c.lineWidth=1.1;
  pencil(() => { rrect(c,bx,by,bw,bh,14); c.stroke() });
  if (P.text){ setFont(c,fs); c.textAlign="center"; c.textBaseline="middle"; pencil(() => c.strokeText(P.text, W/2, H/2)) }
  c.font="italic 500 13px Archivo, sans-serif"; c.fillStyle="rgba(48,46,42,.7)"; c.textAlign="left"; c.textBaseline="bottom";
  c.fillText("≈ 60 cm, para a cozinha", bx, by-8);
  c.beginPath(); c.moveTo(bx+bw-60,by-14); c.quadraticCurveTo(bx+bw-20,by-26,bx+bw-12,by+8); c.stroke();
}
function stageVector(c,g){
  const {W,H,bx,by,bw,bh,fs,nodes} = g;
  bed(c,W,H); dims(c,g);
  c.strokeStyle="#7DB4DA"; c.lineWidth=1.4; rrect(c,bx,by,bw,bh,10); c.stroke();
  if (P.text){ setFont(c,fs); c.textAlign="center"; c.textBaseline="middle"; c.lineWidth=1; c.strokeText(P.text, W/2, H/2) }
  c.fillStyle="#E9EEF0"; nodes.forEach(([x,y],i) => { if (i%3===0) c.fillRect(x-1.5,y-1.5,3,3) });
}
function stagePath(c,g,p){
  const {W,H,bx,by,bw,bh,fs,segs} = g;
  bed(c,W,H); dims(c,g);
  c.strokeStyle="rgba(125,180,218,.5)"; c.lineWidth=1.2; rrect(c,bx,by,bw,bh,10); c.stroke();
  if (P.text){ setFont(c,fs); c.textAlign="center"; c.textBaseline="middle"; c.lineWidth=1; c.strokeStyle="rgba(125,180,218,.22)"; c.strokeText(P.text,W/2,H/2) }
  const n = segs.length, pos = p*n, done = Math.floor(pos);
  let last = [bx, by+bh];
  c.lineCap="round";
  for (let i=0; i<Math.min(n,done+1); i++){
    const s = segs[i], f = i<done ? 1 : pos-done, xe = s.x0+(s.x1-s.x0)*f;
    c.setLineDash([2,3]); c.strokeStyle="rgba(215,219,216,.18)"; c.lineWidth=.8; c.beginPath(); c.moveTo(...last); c.lineTo(s.x0,s.y); c.stroke(); c.setLineDash([]);
    c.strokeStyle="#D8AC4A"; c.lineWidth=Math.max(1.4, fs/10*.9); c.beginPath(); c.moveTo(s.x0,s.y); c.lineTo(xe,s.y); c.stroke();
    last = [xe, s.y];
  }
  if (p<1 && n){ const [x,y]=last; c.beginPath(); c.arc(x,y,6,0,Math.PI*2); c.fillStyle="rgba(216,172,74,.25)"; c.fill(); c.beginPath(); c.arc(x,y,3,0,Math.PI*2); c.fillStyle="#F3E6D2"; c.fill() }
  return Math.min(n-1, done);
}
function stagePiece(c,g){
  const {W,H,bx,by,bw,bh,dpr} = g;
  bed(c,W,H);
  const o = offscreen(bw,bh,dpr); const w = paintWood(o.c,bw,bh,"jatoba",g.seed);
  engrave(w, {text:P.text, piece:"placa"});
  c.save(); c.shadowColor="rgba(0,0,0,.6)"; c.shadowBlur=24; c.shadowOffsetY=12; rrect(c,bx,by,bw,bh,10); c.fillStyle="#000"; c.fill(); c.restore();
  c.save(); rrect(c,bx,by,bw,bh,10); c.clip(); c.drawImage(o.cv,bx,by,bw,bh); c.restore();
}

/* ---------- console G-code e rodapé ---------- */
function console_(idx){
  const g = P.geo, el = $("#gcode"); if (!g) return;
  let lines, cur = -1;
  if (P.stage===0) lines = ["; aguardando o rascunho virar vetor", "; etapa 1: a ideia chega como foto, desenho ou texto"];
  else if (P.stage===1) lines = [`; vetor pronto: ${g.nodes.length} pontos de contorno`, `; área útil ${BOARD_MM[0]} x ${BOARD_MM[1]} mm, origem no canto inferior esquerdo`, "; próximo passo: gerar o percurso da fresa"];
  else if (P.stage===2){ const at = g.head + Math.max(0,idx)*4 + 2; const from = Math.max(0, at-4); lines = g.gc.slice(from, from+7); cur = at-from }
  else lines = [...g.gc.slice(-4), `; ${g.segs.length} passadas · ≈ ${mm(g.minutes)} min de máquina`, "; depois: lixa 80 → 240 e óleo mineral"];
  el.innerHTML = lines.map((l,i) => i===cur ? `<span class="cur">${l.replace(/</g,"&lt;")}</span>` : l.replace(/</g,"&lt;")).join("\n");
  const foot = [["Ideia", "Rascunho à mão"], ["Vetor", `${g.nodes.length} pontos · cotas em mm`], ["G-code", `${g.gc.length} linhas · F${FEED} mm/min · Z${Z.toFixed(1)}`], ["Peça", `Jatobá · ≈ ${mm(g.minutes)} min de máquina`]][P.stage];
  $("#stage-a").textContent = `Etapa ${P.stage+1}/4 · ${foot[0]}`; $("#stage-b").textContent = foot[1];
}

function render(p=1){
  const g = P.geo; if (!g) return;
  const {c,W,H} = g; let idx = 0;
  c.save();
  if (P.stage===0) stageIdea(c,g);
  else if (P.stage===1) stageVector(c,g);
  else if (P.stage===2) idx = stagePath(c,g,p);
  else stagePiece(c,g);
  c.restore();
  if (P.fade){ const t = Math.min(1,(performance.now()-P.fade.t0)/320); c.globalAlpha = 1-t; c.drawImage(P.fade.img,0,0,W,H); c.globalAlpha = 1; if (t>=1) P.fade = null }
  console_(idx);
}
function loop(){
  cancelAnimationFrame(P.raf);
  const anim = P.stage===2 && !reduce, dur = Math.min(7000, 1800 + (P.geo?.segs.length||0)*14), t0 = performance.now();
  const tick = now => {
    const p = anim ? Math.min(1,(now-t0)/dur) : 1; render(p);
    if ((anim && p<1) || P.fade) P.raf = requestAnimationFrame(tick);
  };
  P.raf = requestAnimationFrame(tick);
}
function setStage(i, force){
  if (i===P.stage && !force) return;
  const cv = $("#stage-cv");
  if (P.geo && !reduce){ const snap = document.createElement("canvas"); snap.width=cv.width; snap.height=cv.height; snap.getContext("2d").drawImage(cv,0,0); P.fade = {img:snap, t0:performance.now()} }
  P.stage = i;
  $$(".stage-tabs button").forEach(b => b.setAttribute("aria-selected", +b.dataset.go===i));
  $$(".pstep").forEach(s => s.classList.toggle("on", +s.dataset.stage===i));
  loop();
}

export function initProcess(){
  $$(".stage-tabs button").forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.go; setStage(i, true);
    if (matchMedia("(min-width:981px)").matches) $(`.pstep[data-stage="${i}"]`).scrollIntoView({behavior: reduce?"auto":"smooth", block:"center"});
  }));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && currentView()==="sob-medida") setStage(+e.target.dataset.stage) }), {rootMargin:"-45% 0px -45% 0px"});
  $$(".pstep").forEach(s => io.observe(s));
  $(".pstep").classList.add("on");
  $("#try-form").addEventListener("submit", e => {
    e.preventDefault(); P.text = $("#try-text").value.trim() || "Arte & Madeira";
    build(); setStage(P.stage===0 ? 1 : P.stage, true);
  });
  $("#process-go").addEventListener("click", e => { e.preventDefault(); prefill({text:P.text, piece:"placa", w:60, h:20}) });
  onShow("sob-medida", () => { if (build()) loop() });
}
