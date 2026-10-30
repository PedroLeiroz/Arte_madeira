/* Navegação de página única por hash, com a "plaina" de madeira cobrindo a troca de aba. */
import { $, $$, reduce } from "./dom.js";
import { WOODS } from "./data.js";
import { drawWood } from "./wood.js";

const VIEWS = $$(".view").map(v => v.dataset.view);
const handlers = {};
let current = null, busy = false, queued = null;

/* cada módulo registra o que redesenhar quando sua aba aparece (ou a janela muda de tamanho) */
export const onShow = (name, fn) => (handlers[name] ??= []).push(fn);
export const currentView = () => current;
export function repaint(){ moveKerf(); (handlers[current] || []).forEach(fn => fn()) }

function moveKerf(){
  const a = $(`nav.tabs a[href="#${current}"]`), k = $(".kerf"); if (!a) return;
  k.style.left = a.offsetLeft + "px"; k.style.width = a.offsetWidth + "px";
}
function show(name){
  $$(".view").forEach(v => { const on = v.dataset.view === name; v.hidden = !on; v.classList.toggle("in", on) });
  $$("nav.tabs a").forEach(a => a.getAttribute("href") === "#"+name ? a.setAttribute("aria-current","page") : a.removeAttribute("aria-current"));
  current = name; moveKerf(); scrollTo({top:0, behavior:"instant"});
  document.title = name === "inicio" ? "Arte & Madeira" : `${$(`nav.tabs a[href="#${name}"] span`).textContent} · Arte & Madeira`;
  requestAnimationFrame(repaint);
}
/* tempo-limite: se o navegador pausar animações (aba em segundo plano), a plaina não fica presa na tela */
const once = (el, ev, ms = 900) => new Promise(r => { el.addEventListener(ev, r, {once:true}); setTimeout(r, ms) });

export async function go(name){
  if (!VIEWS.includes(name)) name = "inicio";
  if (name === current) return;
  if (busy){ queued = name; return }
  if (reduce || current === null){ show(name); return }
  busy = true; const pl = $("#plaina"), keys = Object.keys(WOODS);
  current = name; moveKerf();
  pl.className = "plaina cover"; drawWood($("canvas", pl), keys[Math.floor(Math.random()*keys.length)], Date.now()%9999);
  await once(pl, "animationend"); show(name);
  pl.className = "plaina reveal"; await once(pl, "animationend"); pl.className = "plaina";
  busy = false; if (queued){ const q = queued; queued = null; go(q) }
}
export function navigate(name){ if (location.hash === "#"+name) go(name); else location.hash = name }

export function initRouter(){
  addEventListener("hashchange", () => go(location.hash.slice(1)));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { repaint(); moveKerf() }, 150) });
  show(VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "inicio");
}
