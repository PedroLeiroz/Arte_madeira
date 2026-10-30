/* Início: faixa das madeiras com barra de dureza Janka e o comparador antes/depois. */
import { $, $$ } from "./dom.js";
import { WOODS, jankaLabel } from "./data.js";
import { drawWood } from "./wood.js";
import { onShow } from "./router.js";
import { compareFromData } from "./compare.js";

export function initHome(){
  const maxJ = Math.max(...Object.values(WOODS).map(w => w.janka));
  $("#woods").innerHTML = Object.entries(WOODS).map(([k,w],i) => `<div class="wood">
    <div class="sw"><canvas data-wood="${k}" data-seed="${i*7+3}"></canvas></div>
    <h3>${w.nome}</h3>
    <div class="janka"><span class="spec">Janka ≈ ${jankaLabel(w.janka)} lbf</span><i style="--v:${(w.janka/maxJ*100).toFixed(1)}%"></i></div>
    <p>${w.uso}</p></div>`).join("");
  const cmp = compareFromData($("#home-compare"));
  onShow("inicio", () => {
    $$("#woods canvas").forEach(cv => drawWood(cv, cv.dataset.wood, +cv.dataset.seed));
    cmp.paint();
  });
}
