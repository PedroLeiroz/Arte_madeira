/* Herói: a CNC grava ao vivo o texto que o visitante digitar, com leitura X/Y em mm. */
import { $, reduce, mm } from "./dom.js";
import { drawWood, engrave, setFont, rgba } from "./wood.js";
import { onShow } from "./router.js";
import { prefill } from "./wizard.js";

const hero = {text:"Arte & Madeira", raf:0, started:false, fontsOK:false};

function prep(){
  const cv = $("#hero-board"), o = drawWood(cv, "cumaru", 19); if (!o) return false;
  engrave(o, {piece:"tabua-corte"});
  const snap = () => { const k=document.createElement("canvas"); k.width=cv.width; k.height=cv.height; k.getContext("2d").drawImage(cv,0,0); return k };
  const base = snap(), {c,W,H,w} = o, t = hero.text; let box = null;
  if (t){
    let fs=Math.min(H*.34,W*.11); setFont(c,fs); while (c.measureText(t).width>W*.72 && fs>10){ fs--; setFont(c,fs) }
    const tw=c.measureText(t).width; c.textAlign="center"; c.textBaseline="middle";
    c.fillStyle="rgba(255,240,220,.28)"; c.fillText(t,W/2,H/2+1.5);
    c.shadowColor=rgba(w.dark,.8); c.shadowBlur=fs*.08; c.fillStyle=rgba(w.dark,.95); c.fillText(t,W/2,H/2); c.shadowBlur=0;
    box = {x0:W/2-tw/2-fs*.08, x1:W/2+tw/2+fs*.08, y0:H/2-fs*.62, y1:H/2+fs*.62, fs};
  }
  Object.assign(hero, {cv, W, H, base, full:snap(), box, dpr:cv.width/W}); return true;
}
function frame(p){
  const {cv,W,H,base,full,box,dpr} = hero, c = cv.getContext("2d");
  c.setTransform(1,0,0,1,0,0); c.drawImage(base,0,0);
  if (!box){ $("#cx").textContent=mm(0)+" mm"; $("#cy").textContent=mm(0)+" mm"; return }
  const rows=Math.max(6,Math.round((box.y1-box.y0)/Math.max(2.5,box.fs/8))), rh=(box.y1-box.y0)/rows;
  const pos=p*rows, done=Math.min(rows,Math.floor(pos)), frac=pos-done;
  const cut=(x,y,ww,hh)=>{ if (ww>0&&hh>0) c.drawImage(full,x*dpr,y*dpr,ww*dpr,hh*dpr,x*dpr,y*dpr,ww*dpr,hh*dpr) };
  cut(box.x0,box.y0,box.x1-box.x0,done*rh);
  let tx=0, ty=0;
  if (done<rows){
    const ry=box.y0+done*rh, span=box.x1-box.x0, ltr=done%2===0;
    tx=ltr?box.x0+span*frac:box.x1-span*frac; ty=ry+rh/2;
    cut(ltr?box.x0:tx,ry,span*frac,rh);
    c.setTransform(dpr,0,0,dpr,0,0);
    const r=Math.max(5,rh*1.15);
    c.beginPath(); c.arc(tx+3,ty+4,r*1.9,0,Math.PI*2); c.fillStyle="rgba(15,12,8,.22)"; c.fill();
    c.beginPath(); c.arc(tx,ty,r*1.6,0,Math.PI*2); c.fillStyle="#9EA4A6"; c.fill(); c.lineWidth=1; c.strokeStyle="rgba(30,34,36,.6)"; c.stroke();
    c.beginPath(); c.arc(tx,ty,r,0,Math.PI*2); c.fillStyle="#D8AC4A"; c.fill(); c.strokeStyle="rgba(60,40,10,.7)"; c.stroke();
    const a=performance.now()/35; c.lineWidth=1.6; c.beginPath(); c.moveTo(tx+Math.cos(a)*r*.8,ty+Math.sin(a)*r*.8); c.lineTo(tx-Math.cos(a)*r*.8,ty-Math.sin(a)*r*.8); c.stroke();
    c.fillStyle="rgba(244,222,180,.8)";
    for (let k=0;k<8;k++){ const g=Math.random()*Math.PI*2, d=r*(1.7+Math.random()*1.8); c.fillRect(tx+Math.cos(g)*d,ty+Math.sin(g)*d,1.6,1.6) }
    c.setTransform(1,0,0,1,0,0);
  } else { tx=box.x1; ty=box.y1 }
  $("#cx").textContent=mm(tx/W*600)+" mm"; $("#cy").textContent=mm((H-ty)/H*200)+" mm";
}
function carve(){
  cancelAnimationFrame(hero.raf); hero.raf=0; if (!prep()) return;
  const st=$("#carve-status");
  if (reduce || !hero.box){ frame(1); st.textContent = hero.box ? "Gravação pronta." : "Escreva um nome para gravar."; return }
  const dur=Math.min(4600,1600+hero.text.length*160), t0=performance.now(); st.textContent=`Gravando “${hero.text}”…`;
  const tick = now => { const p=Math.min(1,(now-t0)/dur); frame(p);
    if (p<1) hero.raf=requestAnimationFrame(tick); else { hero.raf=0; st.textContent="Pronto. Escreva outro nome e grave de novo." } };
  hero.raf=requestAnimationFrame(tick);
}
function paint(){
  if (!hero.started){ if (hero.fontsOK){ hero.started=true; carve() } else if (prep()) frame(0); return }
  if (hero.raf){ carve(); return }
  if (prep()) frame(1);
}
export function heroFontsReady(){ hero.fontsOK = true }

export function initHero(){
  $("#carve-form").addEventListener("submit", e => { e.preventDefault(); hero.text=$("#carve-text").value.trim(); hero.started=true; carve() });
  $("#carve-use").addEventListener("click", () => prefill({piece:"placa", wood:"cumaru", w:60, h:20, text:$("#carve-text").value.trim(), motif:"nenhum"}));
  onShow("inicio", paint);
}
