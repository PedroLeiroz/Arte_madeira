/* Logomarca da Arte & Madeira: preservada sem alterações (tábua, furo, canaleta e o "&" usinado em V). */
import { $, $$ } from "./dom.js";

const BOARD = "M28 30H47V20A8 8 0 0 1 55 12H65A8 8 0 0 1 73 20V30H92A12 12 0 0 1 104 42V96A12 12 0 0 1 92 108H28A12 12 0 0 1 16 96V42A12 12 0 0 1 28 30Z";
const GROOVE = "M32 39H88A7 7 0 0 1 95 46V92A7 7 0 0 1 88 99H32A7 7 0 0 1 25 92V46A7 7 0 0 1 32 39Z";
const AMP = "M80 90L52 59C45 52 46 47 52 47C58 47 60 53 55 58L46 67C38 75 41 89 54 89C64 89 71 82 77 70";

export function markSVG({anim=false, ink="currentColor", accent="var(--accent)", bg="var(--bg)", xmlns=""} = {}){
  const bit = anim ? `<g class="bit"><animateMotion path="${AMP}" begin="1.7s" dur="1.4s" fill="freeze"/><circle r="6.2" fill="${accent}" stroke="${ink}" stroke-width="1.6"/><g stroke="${bg}" stroke-width="1.6" stroke-linecap="round"><path d="M-3.4 0H3.4M0 -3.4V3.4"/><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.25s" repeatCount="indefinite"/></g></g>` : "";
  return `<svg class="mark${anim?" anim":""}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"${xmlns} role="img" aria-label="Símbolo da Arte &amp; Madeira"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="origin" d="M3 114h10M8 109v10" stroke="${ink}" stroke-width="1.6" opacity=".55"/><path class="board" pathLength="1" d="${BOARD}" stroke="${ink}" stroke-width="5"/><circle class="hole" pathLength="1" cx="60" cy="21" r="3.6" stroke="${ink}" stroke-width="2.4"/><path class="groove" pathLength="1" d="${GROOVE}" stroke="${ink}" stroke-width="2.4" opacity=".6"/><path class="v" pathLength="1" d="${AMP}" stroke="${accent}" stroke-width="6.5"/></g>${bit}</svg>`;
}

function splitWord(el){
  el.innerHTML = [...el.dataset.text].map((c,i) => `<b style="--i:${i}"${c==="&"?' class="amp"':""}>${c===" "?"&nbsp;":c==="&"?"&amp;":c}</b>`).join("");
}

export function replayLogo(){
  $(".mk-contact").innerHTML = markSVG({anim:true});
  const w = $(".lockup-box .wm-anim"); w.classList.remove("go"); void w.offsetWidth; w.classList.add("go");
}

export function initBrand(){
  $(".mk-header").innerHTML = markSVG({anim:true});
  $("#plaina .mk").innerHTML = markSVG({accent:"#D8AC4A", bg:"#6B4423"});
  $$(".wm-anim").forEach(splitWord);
  replayLogo();
  $("[data-replay]").addEventListener("click", replayLogo);
}
