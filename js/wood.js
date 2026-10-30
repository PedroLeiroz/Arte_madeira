/* Motor de desenho: veio de madeira procedural, tábua bruta, gravação, desenhos e vetor (blueprint). */
import { WOODS } from "./data.js";

export function rng(a){ return () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296 } }
export function rgba(h, a){ const n=parseInt(h.slice(1),16); return `rgba(${n>>16},${n>>8&255},${n&255},${a})` }
export function setFont(c, px){ c.font = `800 ${px}px Archivo, sans-serif`; if ("fontStretch" in c) c.fontStretch = "semi-expanded" }
export function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath() }

/* ajusta o canvas ao tamanho em CSS e devolve contexto em px de CSS */
export function fit(cv){
  const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(r.width*dpr); cv.height = Math.round(r.height*dpr);
  const c = cv.getContext("2d"); c.setTransform(dpr,0,0,dpr,0,0);
  return {c, W:r.width, H:r.height, dpr};
}
export function offscreen(W, H, dpr=1){
  const cv = document.createElement("canvas"); cv.width = Math.ceil(W*dpr); cv.height = Math.ceil(H*dpr);
  const c = cv.getContext("2d"); c.setTransform(dpr,0,0,dpr,0,0); return {cv, c, W, H, dpr};
}

export function paintWood(c, W, H, key, seed=1){
  const w = WOODS[key], R = rng(seed);
  const g = c.createLinearGradient(0,0,W,H); g.addColorStop(0,w.light); g.addColorStop(.55,w.base); g.addColorStop(1,w.dark);
  c.fillStyle = g; c.fillRect(0,0,W,H);
  const ph=R()*10, f=.003+R()*.005, A=5+R()*16, kx=W*(.2+R()*.6), ky=H*(.2+R()*.6), knot=R()>.35, gap=2.6;
  for (let i=-14; i<H/gap+14; i++){
    const y0 = i*gap+R()*1.5; c.beginPath();
    for (let x=0; x<=W+6; x+=5){
      let y = y0+Math.sin(x*f+ph+i*.025)*A+Math.sin(x*.035+i*.7)*.9;
      if (knot){ const dx=(x-kx)*.45, dy=y0-ky, d=dx*dx+dy*dy; y += 26*Math.exp(-d/900)*(dy<0?-1:1) }
      x ? c.lineTo(x,y) : c.moveTo(x,y);
    }
    const dark = R()>.72; c.strokeStyle = dark ? rgba(w.dark,.35+R()*.3) : rgba(w.light,.12+R()*.12); c.lineWidth = dark&&R()>.8 ? 1.8 : .7; c.stroke();
  }
  if (knot){
    for (let k=5; k>0; k--){ c.beginPath(); c.ellipse(kx,ky,k*4.5,k*2.2,0,0,Math.PI*2); c.strokeStyle=rgba(w.dark,.25+.1*(6-k)); c.lineWidth=1.2; c.stroke() }
    c.beginPath(); c.ellipse(kx,ky,4,2,0,0,Math.PI*2); c.fillStyle=rgba(w.dark,.9); c.fill();
  }
  const s = c.createLinearGradient(0,0,W,0); s.addColorStop(0,"rgba(255,245,225,.10)"); s.addColorStop(.5,"rgba(255,245,225,0)"); s.addColorStop(1,"rgba(0,0,0,.12)");
  c.fillStyle = s; c.fillRect(0,0,W,H);
  return {c, W, H, w};
}
export function drawWood(cv, key, seed=1){
  const o = fit(cv); if (!o) return null;
  return paintWood(o.c, o.W, o.H, key, seed);
}

/* tábua como chega da serraria: acinzentada, marcas circulares da serra, borda com casca */
export function paintRough(c, W, H, key, seed=1){
  const o = paintWood(c, W, H, key, seed), R = rng(seed*3+1);
  c.fillStyle = "rgba(168,160,146,.55)"; c.fillRect(0,0,W,H);
  c.lineWidth = 1;
  for (let i=0; i<46; i++){
    const cx = -W*.4 + i*(W*1.8/46), r = W*.9;
    c.beginPath(); c.arc(cx, H*1.6, r, Math.PI*1.25, Math.PI*1.75);
    c.strokeStyle = `rgba(70,60,48,${.08+R()*.1})`; c.stroke();
  }
  for (let i=0; i<900; i++){ c.fillStyle=`rgba(${R()>.5?"240,232,220":"60,50,40"},${R()*.18})`; c.fillRect(R()*W, R()*H, 1.2, 1.2) }
  const bark = c.createLinearGradient(0,0,0,H*.12); bark.addColorStop(0,"rgba(52,38,26,.85)"); bark.addColorStop(1,"rgba(52,38,26,0)");
  c.fillStyle = bark; c.beginPath(); c.moveTo(0,0);
  for (let x=0; x<=W; x+=8) c.lineTo(x, H*.05 + Math.sin(x*.04+seed)*H*.02 + R()*H*.015);
  c.lineTo(W,0); c.closePath(); c.fill();
  return o;
}

/* ---------- desenhos de gravação ---------- */
export function drawMotif(c, key, x, y, s, color, hole, ini="AM", custom=null){
  c.save(); c.translate(x-s/2, y-s/2); c.scale(s/100, s/100);
  c.fillStyle = color; c.strokeStyle = color; c.lineCap = "round"; c.lineJoin = "round";
  const dot = (px,py,r) => { c.beginPath(); c.arc(px,py,r,0,Math.PI*2); c.fillStyle=hole; c.fill(); c.fillStyle=color };
  if (key==="boi"){
    c.lineWidth=7; c.beginPath(); c.moveTo(37,38); c.bezierCurveTo(24,37,13,29,13,15); c.moveTo(63,38); c.bezierCurveTo(76,37,87,29,87,15); c.stroke();
    c.beginPath(); c.ellipse(26,47,10,4.5,.35,0,Math.PI*2); c.ellipse(74,47,10,4.5,-.35,0,Math.PI*2); c.fill();
    c.beginPath(); c.moveTo(34,38); c.bezierCurveTo(36,29,64,29,66,38); c.lineTo(62,72); c.bezierCurveTo(60,87,40,87,38,72); c.closePath(); c.fill();
    dot(42,51,2.8); dot(58,51,2.8); dot(45,76,3); dot(55,76,3);
  } else if (key==="talheres"){
    c.save(); c.translate(50,50); c.rotate(.6); c.translate(-50,-50);
    c.beginPath(); c.moveTo(45,8); c.bezierCurveTo(56,12,57,32,55,58); c.lineTo(45,58); c.closePath(); c.fill();
    rrect(c,44,60,12,32,5); c.fill(); dot(50,70,1.8); dot(50,82,1.8); c.restore();
    c.save(); c.translate(50,50); c.rotate(-.6); c.translate(-50,-50);
    [41,46,51,56].forEach(tx => { rrect(c,tx,8,3,20,1.5); c.fill() });
    c.beginPath(); c.moveTo(41,26); c.lineTo(59,26); c.lineTo(59,32); c.bezierCurveTo(59,38,53,40,53,43); c.lineTo(47,43); c.bezierCurveTo(47,40,41,38,41,32); c.closePath(); c.fill();
    c.fillRect(47,42,6,18); rrect(c,45,58,10,34,5); c.fill(); c.restore();
  } else if (key==="ramo"){
    const P = t => ({x:(1-t)**2*18+2*(1-t)*t*40+t*t*84, y:(1-t)**2*88+2*(1-t)*t*58+t*t*14});
    c.lineWidth=3.5; c.beginPath(); c.moveTo(18,88); c.quadraticCurveTo(40,58,84,14); c.stroke();
    [.18,.32,.46,.6,.74].forEach((t,i) => { const p=P(t), q=P(t+.01), a=Math.atan2(q.y-p.y,q.x-p.x)+(i%2?.8:-.8);
      c.save(); c.translate(p.x,p.y); c.rotate(a); c.beginPath(); c.ellipse(11,0,12,5,0,0,Math.PI*2); c.fill(); c.restore() });
    const e=P(1); c.save(); c.translate(e.x,e.y); c.rotate(-.8); c.beginPath(); c.ellipse(4,0,10,4.5,0,0,Math.PI*2); c.fill(); c.restore();
  } else if (key==="peixe"){
    c.beginPath(); c.ellipse(44,50,31,17,0,0,Math.PI*2); c.fill();
    c.beginPath(); c.moveTo(70,50); c.lineTo(93,32); c.lineTo(87,50); c.lineTo(93,68); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(40,34); c.quadraticCurveTo(50,22,62,36); c.fill();
    dot(25,46,3); c.strokeStyle=hole; c.lineWidth=2; c.beginPath(); c.arc(25,50,13,-.9,.9); c.stroke();
  } else if (key==="monograma"){
    c.lineWidth=5; c.beginPath(); c.arc(50,50,45,0,Math.PI*2); c.stroke();
    c.lineWidth=1.6; c.beginPath(); c.arc(50,50,38,0,Math.PI*2); c.stroke();
    setFont(c, ini.length>1?34:42); c.textAlign="center"; c.textBaseline="middle"; c.fillText(ini,50,53);
  } else if (key==="upload" && custom){
    const r=Math.min(100/custom.width,100/custom.height), w=custom.width*r, h=custom.height*r;
    const t=document.createElement("canvas"); t.width=Math.ceil(w*4); t.height=Math.ceil(h*4);
    const tc=t.getContext("2d"); tc.drawImage(custom,0,0,t.width,t.height); tc.globalCompositeOperation="source-in"; tc.fillStyle=color; tc.fillRect(0,0,t.width,t.height);
    c.drawImage(t,50-w/2,50-h/2,w,h);
  }
  c.restore();
}

/* converte uma imagem enviada em máscara de gravação: partes escuras viram entalhe */
export function toEngraveMask(img){
  const k=Math.min(1,500/Math.max(img.width,img.height)), cv=document.createElement("canvas");
  cv.width=Math.max(1,Math.round(img.width*k)); cv.height=Math.max(1,Math.round(img.height*k));
  const c=cv.getContext("2d"); c.drawImage(img,0,0,cv.width,cv.height);
  const d=c.getImageData(0,0,cv.width,cv.height), p=d.data;
  for (let i=0;i<p.length;i+=4){ const l=.3*p[i]+.59*p[i+1]+.11*p[i+2]; const a=Math.max(0,Math.min(1,(200-l)/110))*(p[i+3]/255); p[i]=p[i+1]=p[i+2]=0; p[i+3]=Math.round(a*255) }
  c.putImageData(d,0,0); return cv;
}

/* ---------- texto em várias linhas ----------
   Usa as linhas que o cliente digitou. Primeiro tenta só diminuir a letra (até metade);
   se ainda não couber, quebra as linhas compridas nas palavras, como um parágrafo.
   Devolve o maior corpo de letra em que o bloco inteiro cabe em maxW × maxH. */
export function layoutText(c, text, maxW, maxH, maxFs){
  const paras = text.split("\n").map(s => s.trim());
  const build = (fs, wrap) => {
    setFont(c, fs); const lines = [];
    for (const p of paras){
      if (!p || !wrap){ lines.push(p); continue }
      let cur = "";
      for (const word of p.split(/\s+/)){ const t = cur ? cur+" "+word : word; if (!cur || c.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = word } }
      lines.push(cur);
    }
    const lh = fs*1.14, h = lines.length*lh - (lh-fs), w = Math.max(...lines.map(l => c.measureText(l).width));
    return {lines, fs, lh, w, h, ok: h <= maxH && w <= maxW};
  };
  for (let fs = Math.floor(maxFs); fs >= Math.max(8, maxFs*.5); fs--){ const b = build(fs, false); if (b.ok) return b }
  let b;
  for (let fs = Math.floor(maxFs); fs >= 8; fs--){ b = build(fs, true); if (b.ok) return b }
  return b || build(8, true);
}

/* ---------- gravação sobre a madeira ---------- */
export function engrave(o, {text="", piece="tabua-corte", motif="nenhum", custom=null, ini="AM", align="center"} = {}){
  if (!o) return; const {c,W,H,w} = o;
  const burn=rgba(w.dark,.95), hole=rgba(w.base,1);
  if (piece==="tabua-corte"){ const m=Math.min(W,H)*.09; rrect(c,m,m,W-2*m,H-2*m,m*1.2); c.strokeStyle=rgba(w.dark,.55); c.lineWidth=Math.max(4,m*.35); c.stroke(); c.strokeStyle="rgba(255,240,220,.18)"; c.lineWidth=1; c.stroke() }
  if (piece==="tabua-churrasco"){ c.beginPath(); c.ellipse(W*.22,H*.5,W*.1,H*.28,0,0,Math.PI*2); c.fillStyle=rgba(w.dark,.45); c.fill() }
  if (piece==="tabua-frios"){ const r=Math.min(W,H)*.06; c.beginPath(); c.arc(W-r*2.6,H/2,r,0,Math.PI*2); c.fillStyle="rgba(20,16,10,.85)"; c.fill(); c.strokeStyle="rgba(255,240,220,.25)"; c.lineWidth=1; c.stroke() }
  if (piece==="placa"){ const r=Math.max(2,Math.min(W,H)*.03); [[W*.05,H/2],[W*.95,H/2]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle="rgba(20,16,10,.8)";c.fill()}) }
  const hasM = motif && motif!=="nenhum" && (motif!=="upload" || custom);
  if (!text && !hasM) return;
  const cx = piece==="tabua-churrasco"?W*.62:piece==="tabua-frios"?W*.46:W/2, maxW = piece==="tabua-churrasco"?W*.58:piece==="tabua-frios"?W*.7:W*.8;
  /* bloco de texto: (left) é a borda esquerda do bloco, (yc) o centro vertical */
  const burnBlock = (b, left, yc) => {
    setFont(c,b.fs); c.textAlign=align; c.textBaseline="middle";
    const x = align==="left" ? left : align==="right" ? left+b.w : left+b.w/2, y0 = yc-b.h/2+b.fs/2;
    b.lines.forEach((l,i) => { const y=y0+i*b.lh; if (!l) return;
      c.fillStyle="rgba(255,240,220,.28)"; c.fillText(l,x,y+1.5);
      c.shadowColor=rgba(w.dark,.8); c.shadowBlur=b.fs*.08; c.fillStyle=burn; c.fillText(l,x,y); c.shadowBlur=0 });
  };
  const mh = piece==="tabua-corte" ? H*.68 : H*.8;   /* a canaleta ocupa a borda da tábua de corte */
  const burnMotif = (x,y,s) => { drawMotif(c,motif,x,y+1.5,s,"rgba(255,240,220,.28)","rgba(0,0,0,0)",ini,custom); c.shadowColor=rgba(w.dark,.8); c.shadowBlur=s*.03; drawMotif(c,motif,x,y,s,burn,hole,ini,custom); c.shadowBlur=0 };
  if (hasM && !text){ burnMotif(cx,H/2,Math.min(H*.66,maxW*.7)); return }
  if (!hasM){ const b=layoutText(c,text,maxW,mh,Math.min(H*.42,W*.16)); burnBlock(b,cx-b.w/2,H/2); return }
  if (W/H >= 1.6){
    const s=Math.min(H*.62,maxW*.3), gap=s*.18, b=layoutText(c,text,maxW-s-gap,mh,Math.min(H*.36,W*.13)), x0=cx-(s+gap+b.w)/2;
    burnMotif(x0+s/2,H/2,s); burnBlock(b,x0+s+gap,H/2);
  } else {
    const multi=text.includes("\n"), s=Math.min(H*(multi?.32:.42),maxW*.6), gap=s*.14;
    const b=layoutText(c,text,maxW,H*.86-s-gap,Math.min(H*.16,W*.14)), tot=s+gap+b.h, y0=H/2-tot/2;
    burnMotif(cx,y0+s/2,s); burnBlock(b,cx-b.w/2,y0+s+gap+b.h/2);
  }
}

/* ---------- vetor: o mesmo desenho como a máquina enxerga ---------- */
export function paintBlueprint(c, W, H, {text="", piece="tabua-corte"} = {}){
  c.fillStyle="#1E1813"; c.fillRect(0,0,W,H);
  c.strokeStyle="rgba(255,255,255,.05)"; c.lineWidth=1;
  for (let x=0;x<W;x+=16){ c.beginPath(); c.moveTo(x+.5,0); c.lineTo(x+.5,H); c.stroke() }
  for (let y=0;y<H;y+=16){ c.beginPath(); c.moveTo(0,y+.5); c.lineTo(W,y+.5); c.stroke() }
  const cad="#7DB4DA", m=Math.min(W,H)*.1, bw=W-2*m, bh=H-2*m;
  c.strokeStyle=cad; c.lineWidth=1.4; rrect(c,m,m,bw,bh,Math.min(bw,bh)*.06); c.stroke();
  c.setLineDash([4,3]); c.lineWidth=1;
  if (piece==="tabua-corte"){ const g=Math.min(bw,bh)*.09; rrect(c,m+g,m+g,bw-2*g,bh-2*g,g); c.stroke() }
  if (piece==="tabua-churrasco"){ c.beginPath(); c.ellipse(m+bw*.22,m+bh/2,bw*.1,bh*.28,0,0,Math.PI*2); c.stroke() }
  c.setLineDash([]);
  if (piece==="tabua-frios"){ c.beginPath(); c.arc(m+bw-bh*.16,m+bh/2,bh*.06,0,Math.PI*2); c.stroke() }
  if (piece==="placa"){ [[.05,.5],[.95,.5]].forEach(([px,py])=>{c.beginPath();c.arc(m+bw*px,m+bh*py,3,0,Math.PI*2);c.stroke()}) }
  if (text){
    const cx = piece==="tabua-churrasco"?m+bw*.62:piece==="tabua-frios"?m+bw*.46:W/2;
    let fs=Math.min(bh*.4,bw*.15); setFont(c,fs); while (c.measureText(text).width>bw*.72 && fs>8){ fs--; setFont(c,fs) }
    c.textAlign="center"; c.textBaseline="middle"; c.lineWidth=1; c.strokeStyle=cad; c.strokeText(text,cx,H/2);
  }
  c.fillStyle="#D8AC4A"; c.beginPath(); c.arc(m,m+bh,3,0,Math.PI*2); c.fill();
  c.font="500 10px JetBrains Mono, monospace"; c.fillStyle="rgba(215,219,216,.7)"; c.textAlign="left"; c.textBaseline="top";
  c.fillText("X0 Y0", m+6, m+bh+4);
}
