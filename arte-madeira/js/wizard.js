/* Encomendas: assistente em cinco passos com prévia ao vivo, medidas arrastáveis, referências e envio. */
import { $, $$, wa, esc, clamp, toast, store, reduce } from "./dom.js";
import { WOODS, PIECES, MOTIFS, jankaLabel } from "./data.js";
import { drawWood, engrave, drawMotif, toEngraveMask } from "./wood.js";
import { onShow, navigate } from "./router.js";
import { makePDF } from "./pdf.js";

const STEPS = ["Peça", "Madeira", "Medidas", "Gravação", "Envio"];
const DRAFT = "am-encomenda-v2";
const S = {step:0, piece:"tabua-corte", wood:"jatoba", w:40, h:28, text:"Família Ribeiro", align:"center", motif:"nenhum", name:"", due:"", obs:"",
  refs:[], custom:null, customRef:-1};
const KEEP = ["piece","wood","w","h","text","align","motif","name","due","obs"];
const MAX_LINES = 6, MAX_CHARS = 180;
const ALIGN = {left:"à esquerda", center:"centralizado", right:"à direita"};
const textLines = () => S.text ? S.text.split("\n").length : 0;

export const ORDER_NO = (() => { const d=new Date(), p=n=>String(n).padStart(2,"0"); return `AM-${p(d.getDate())}${p(d.getMonth()+1)}${String(d.getFullYear()).slice(2)}-${p(d.getHours())}${p(d.getMinutes())}` })();
export function initials(){
  const src = (S.name || S.text || "Arte Madeira").split(/\s+/).filter(w => w.length>2 || /^[A-ZÀ-Ú]/.test(w));
  const a = src[0] || "A", b = src.length>1 ? src[src.length-1] : ""; return (a[0]+(b?b[0]:"")).toUpperCase();
}
export const state = () => S;
export const motifLabel = () => S.motif==="nenhum" ? "Sem desenho" : S.motif==="upload" ? `Imagem do cliente (${S.refs[S.customRef]?.name||""})` : S.motif==="monograma" ? `Monograma "${initials()}"` : MOTIFS[S.motif];

/* ---------- ícones de peça em SVG ---------- */
function pieceIcon(k){
  const g = 'fill="none" stroke="currentColor" stroke-width="2"', d = 'stroke-dasharray="4 3" stroke-width="1.4" fill="none" stroke="var(--accent)"';
  const body = {
    "tabua-corte":`<rect x="20" y="8" width="120" height="48" rx="8" ${g}/><rect x="28" y="16" width="104" height="32" rx="5" ${d}/>`,
    "tabua-churrasco":`<rect x="14" y="6" width="132" height="52" rx="8" ${g}/><ellipse cx="44" cy="32" rx="16" ry="15" ${d}/>`,
    "tabua-frios":`<rect x="8" y="18" width="144" height="28" rx="6" ${g}/><circle cx="140" cy="32" r="4" fill="none" stroke="var(--accent)" stroke-width="1.6"/>`,
    "placa":`<rect x="8" y="14" width="144" height="36" rx="3" ${g}/><circle cx="16" cy="32" r="2.5" fill="currentColor"/><circle cx="144" cy="32" r="2.5" fill="currentColor"/><path d="M50 32h60" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>`
  }[k];
  return `<svg viewBox="0 0 160 64" aria-hidden="true">${body}</svg>`;
}

/* ---------- render ---------- */
function renderRail(){
  $("#wz-rail").innerHTML = STEPS.map((n,i) => `<li><button type="button" data-goto="${i}" ${i===S.step?'aria-current="step"':""} class="${i<S.step?"done":""}"><span>${String(i+1).padStart(2,"0")}</span><strong>${n}</strong></button></li>`).join("");
  $("#wz-rail").style.setProperty("--p", S.step/(STEPS.length-1));
}
function sizeLimits(){ const p = PIECES[S.piece]; return {min:p.min, max:p.max} }
function renderSizer(){
  const {min,max} = sizeLimits(), sz = $("#sizer"), box = $(".box", sz);
  const aw = sz.clientWidth - 70, ah = sz.clientHeight - 60, k = Math.min(aw/max[0], ah/max[1]);
  box.style.width = S.w*k + "px"; box.style.height = S.h*k + "px";
  $(".dim.w", box).textContent = `${S.w*10} mm`; $(".dim.h", box).textContent = `${S.h*10} mm`;
  const hd = $(".handle", box); hd.setAttribute("aria-valuetext", `${S.w} por ${S.h} centímetros`);
  $("#f-w").value = S.w; $("#f-h").value = S.h;
  $("#f-w").min = min[0]; $("#f-w").max = max[0]; $("#f-h").min = min[1]; $("#f-h").max = max[1];
  $("#presets").innerHTML = PIECES[S.piece].presets.map(([w,h]) => `<button type="button" data-w="${w}" data-h="${h}">${w} × ${h} cm</button>`).join("");
  return k;
}
function renderMotifChips(){
  const cs = getComputedStyle(document.documentElement), ink = cs.getPropertyValue("--ink").trim(), bg = cs.getPropertyValue("--bg").trim();
  $$("#pick-motif canvas").forEach(cv => {
    const c = cv.getContext("2d"), k = cv.dataset.motif; c.clearRect(0,0,60,60);
    if (k==="nenhum"){ c.strokeStyle=ink; c.lineWidth=2; c.globalAlpha=.5; c.beginPath(); c.arc(30,30,16,0,Math.PI*2); c.moveTo(19,41); c.lineTo(41,19); c.stroke(); c.globalAlpha=1; return }
    drawMotif(c,k,30,30,46,ink,bg,initials(),S.custom);
  });
}
function renderThumbs(){
  $("#thumbs").innerHTML = S.refs.map((r,i) => `<div class="thumb"><img src="${r.url}" alt="${esc(r.name)}">
    <button type="button" data-use="${i}" aria-pressed="${S.motif==="upload"&&S.customRef===i}">${S.motif==="upload"&&S.customRef===i?"Gravando esta":"Gravar esta"}</button>
    <button type="button" class="rm" data-rm="${i}">Remover</button></div>`).join("");
}
function message(){
  const L = [`Olá, Arte & Madeira! Quero orçar uma peça sob medida (pedido nº ${ORDER_NO}):`, `• Peça: ${PIECES[S.piece].nome}`, `• Madeira: ${WOODS[S.wood].nome}`, `• Medida: ${S.w} × ${S.h} cm`];
  if (S.text) L.push(textLines()>1 ? `• Gravação (${textLines()} linhas, ${ALIGN[S.align]}):\n${S.text.split("\n").map(l => "   " + l).join("\n")}` : `• Gravação: "${S.text}"`);
  if (S.motif!=="nenhum") L.push(`• Desenho: ${motifLabel()}`);
  if (S.refs.length) L.push(`• Referências: ${S.refs.length} imagem(ns), envio aqui na conversa`);
  if (S.due) L.push(`• Prazo: ${S.due}`);
  if (S.obs) L.push(`• Observações: ${S.obs}`);
  if (S.name) L.push(`\nMeu nome é ${S.name}.`);
  return L.join("\n");
}
function renderSummary(){
  const rows = [["Peça",PIECES[S.piece].nome,0],["Madeira",WOODS[S.wood].nome,1],["Medida",`${S.w*10} × ${S.h*10} mm`,2],["Gravação",S.text?(textLines()>1?`${S.text}\n(${textLines()} linhas, ${ALIGN[S.align]})`:`"${S.text}"`):"Sem texto",3],["Desenho",motifLabel(),3],["Referências",S.refs.length?`${S.refs.length} imagem(ns)`:"Nenhuma",3],["Acabamento",PIECES[S.piece].finish,-1]];
  $("#summary").innerHTML = rows.map(([k,v,s]) => `<li><span>${k}</span><span>${esc(v)}${s>=0?`<button type="button" data-goto="${s}">alterar</button>`:""}</span></li>`).join("");
  const t = message(); $("#msg").textContent = t; $("#send").href = wa(t);
}
export function renderPreview(){
  const cv = $("#wz-board"); cv.style.aspectRatio = `${clamp(S.w/S.h, .8, 4)}`;
  const o = drawWood(cv, S.wood, 7+S.wood.length);
  engrave(o, {text:S.text, piece:S.piece, motif:S.motif, custom:S.custom, ini:initials(), align:S.align});
  $("#wz-cap-a").textContent = `${WOODS[S.wood].nome} · ${S.w*10} × ${S.h*10} mm`;
  $("#wz-cap-b").textContent = `${PIECES[S.piece].nome.split(" com")[0]} · passo ${S.step+1}/5`;
}
function sync(){
  $$('input[name="piece"]').forEach(i => i.checked = i.value===S.piece);
  $$('input[name="wood"]').forEach(i => i.checked = i.value===S.wood);
  $$('input[name="motif"]').forEach(i => i.checked = i.value===S.motif);
  $$('input[name="align"]').forEach(i => i.checked = i.value===S.align);
  $("#f-text").value = S.text; textCount(); $("#f-name").value = S.name; $("#f-due").value = S.due; $("#f-obs").value = S.obs;
}
function textCount(){
  const n = textLines(), len = S.text.length;
  $("#f-text-count").textContent = `${n} ${n===1?"linha":"linhas"} de ${MAX_LINES} · ${len}/${MAX_CHARS} caracteres`;
  $("#align-row").hidden = n < 2;
}
function save(){ store.set(DRAFT, Object.fromEntries(KEEP.map(k => [k, S[k]]))) }
function update(){ renderPreview(); if (S.step===1) $$("#pick-wood canvas").forEach(cv => drawWood(cv, cv.dataset.wood, +cv.dataset.seed)); if (S.step===2) renderSizer(); if (S.step===3) renderMotifChips(); if (S.step===4) renderSummary(); save() }

function goStep(i){
  i = clamp(i, 0, STEPS.length-1); const dir = i >= S.step ? "fwd" : "back"; S.step = i;
  $$(".wz-panel").forEach(p => { const on = +p.dataset.step===i; p.hidden = !on; p.classList.remove("fwd","back"); if (on && !reduce){ void p.offsetWidth; p.classList.add(dir) } });
  $("#wz-back").style.visibility = i===0 ? "hidden" : "visible";
  $("#wz-next").hidden = i===STEPS.length-1;
  renderRail(); update();
}

/* chamado por outras abas (herói, projetos, sob medida) para abrir o assistente já preenchido */
export function prefill(o){
  Object.assign(S, o);
  if (o.piece && (o.w==null)) [S.w, S.h] = PIECES[o.piece].def;
  const {min,max} = sizeLimits(); S.w = clamp(S.w,min[0],max[0]); S.h = clamp(S.h,min[1],max[1]);
  if (S.motif==="upload" && !S.custom) S.motif = "nenhum";
  sync(); goStep(o.step ?? 3); navigate("encomendas");
}

/* ---------- referências ---------- */
function addFiles(files){
  [...files].forEach(f => {
    if (!f.type.startsWith("image/")){ toast("Envie imagens: PNG, JPG, SVG ou WEBP"); return }
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => {
      S.refs.push({name:f.name, url:fr.result, img});
      if (S.refs.length===1){ useRef(0) } else renderThumbs();
    }; img.onerror = () => toast("Não consegui abrir essa imagem. Tente PNG ou JPG."); img.src = fr.result };
    fr.readAsDataURL(f);
  });
}
function useRef(i){
  S.customRef = i; S.custom = toEngraveMask(S.refs[i].img); S.motif = "upload";
  ensureUploadOption(); sync(); renderThumbs(); update(); toast("A imagem virou gravação na prévia");
}
function ensureUploadOption(){
  if ($("#m-upload")) return;
  $("#pick-motif").insertAdjacentHTML("beforeend", `<label><input type="radio" name="motif" value="upload" id="m-upload"><span class="card"><canvas data-motif="upload" width="60" height="60"></canvas>Imagem</span></label>`);
}

export function initWizard(){
  const d = store.get(DRAFT); if (d) KEEP.forEach(k => { if (d[k]!=null) S[k] = d[k] });
  if (S.motif==="upload") S.motif = "nenhum";

  $("#pick-piece").innerHTML = Object.entries(PIECES).map(([k,p]) => `<label><input type="radio" name="piece" value="${k}"><span class="card">${pieceIcon(k)}<strong>${p.nome}</strong><small>${p.desc}</small></span></label>`).join("");
  const maxJ = Math.max(...Object.values(WOODS).map(w => w.janka));
  $("#pick-wood").innerHTML = Object.entries(WOODS).map(([k,w],i) => `<label><input type="radio" name="wood" value="${k}"><span class="card"><canvas data-wood="${k}" data-seed="${i*5+2}"></canvas><strong>${w.nome}</strong>
    <span class="janka"><span class="spec">Janka ≈ ${jankaLabel(w.janka)} lbf</span><i style="--v:${(w.janka/maxJ*100).toFixed(1)}%"></i></span><small>${w.uso}</small></span></label>`).join("");
  $("#pick-motif").innerHTML = Object.entries(MOTIFS).map(([k,n]) => `<label><input type="radio" name="motif" value="${k}" id="m-${k}"><span class="card"><canvas data-motif="${k}" width="60" height="60"></canvas>${n}</span></label>`).join("");
  sync();

  const form = $("#wz");
  form.addEventListener("change", e => {
    const t = e.target;
    if (t.name==="piece"){ S.piece = t.value; [S.w, S.h] = PIECES[S.piece].def; }
    if (t.name==="wood") S.wood = t.value;
    if (t.name==="align") S.align = t.value;
    if (t.name==="motif"){ if (t.value==="upload" && !S.custom) return; S.motif = t.value; renderThumbs() }
    update();
  });
  form.addEventListener("input", e => {
    const t = e.target, {min,max} = sizeLimits();
    if (t.id==="f-text"){
      const lines = t.value.split("\n");
      if (lines.length > MAX_LINES){ t.value = lines.slice(0, MAX_LINES).join("\n"); toast(`Até ${MAX_LINES} linhas na gravação`) }
      S.text = t.value.split("\n").map(l => l.replace(/\s+$/,"")).join("\n").replace(/^\n+|\n+$/g,"");
      textCount();
    }
    if (t.id==="f-name") S.name = t.value.trim();
    if (t.id==="f-due") S.due = t.value.trim();
    if (t.id==="f-obs") S.obs = t.value.trim();
    if (t.id==="f-w" || t.id==="f-h"){ const v = +t.value; if (!v) return; t.id==="f-w" ? S.w = clamp(Math.round(v),min[0],max[0]) : S.h = clamp(Math.round(v),min[1],max[1]); renderPreview(); renderSizer(); save(); return }
    if (t.type!=="radio") update();
  });
  form.addEventListener("submit", e => { e.preventDefault(); goStep(S.step+1) });
  $("#wz-back").addEventListener("click", () => goStep(S.step-1));
  document.addEventListener("click", e => { const b = e.target.closest("[data-goto]"); if (b && b.closest(".wizard")) goStep(+b.dataset.goto) });

  /* medidas: arrastar a alça */
  const sz = $("#sizer"), hd = $(".handle", sz);
  let drag = null;
  hd.addEventListener("pointerdown", e => { e.preventDefault(); hd.setPointerCapture(e.pointerId); const r = $(".box", sz).getBoundingClientRect(); drag = {x:r.left, y:r.top, k:renderSizer()}; sz.classList.add("drag") });
  hd.addEventListener("pointermove", e => {
    if (!drag) return; const {min,max} = sizeLimits();
    S.w = clamp(Math.round((e.clientX-drag.x)/drag.k), min[0], max[0]); S.h = clamp(Math.round((e.clientY-drag.y)/drag.k), min[1], max[1]);
    renderSizer(); renderPreview();
  });
  const end = () => { if (drag){ drag = null; sz.classList.remove("drag"); save() } };
  hd.addEventListener("pointerup", end); hd.addEventListener("pointercancel", end);
  hd.addEventListener("keydown", e => {
    const {min,max} = sizeLimits(), st = e.shiftKey ? 5 : 1, m = {ArrowRight:[st,0],ArrowLeft:[-st,0],ArrowDown:[0,st],ArrowUp:[0,-st]}[e.key];
    if (!m) return; e.preventDefault(); S.w = clamp(S.w+m[0],min[0],max[0]); S.h = clamp(S.h+m[1],min[1],max[1]); renderSizer(); renderPreview(); save();
  });
  $("#presets").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; S.w = +b.dataset.w; S.h = +b.dataset.h; update() });

  /* referências: arrastar e soltar ou escolher */
  const drop = $("#drop");
  $("#f-refs").addEventListener("change", e => { addFiles(e.target.files); e.target.value = "" });
  ["dragenter","dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over") }));
  ["dragleave","drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over") }));
  drop.addEventListener("drop", e => addFiles(e.dataTransfer.files));
  $("#thumbs").addEventListener("click", e => {
    const u = e.target.closest("[data-use]"), r = e.target.closest("[data-rm]");
    if (u) useRef(+u.dataset.use);
    if (r){ const i = +r.dataset.rm; S.refs.splice(i,1);
      if (S.customRef===i){ S.custom = null; S.customRef = -1; if (S.motif==="upload") S.motif = "nenhum" } else if (S.customRef>i) S.customRef--;
      sync(); renderThumbs(); update() }
  });

  $("#pdf").addEventListener("click", () => makePDF());
  goStep(0);
  onShow("encomendas", () => {
    $$("#pick-wood canvas").forEach(cv => drawWood(cv, cv.dataset.wood, +cv.dataset.seed));
    update();
  });
}
