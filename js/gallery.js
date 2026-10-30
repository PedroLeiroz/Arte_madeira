/* Projetos: grade filtrável; o mouse revela o vetor por baixo da madeira; o clique abre o projeto com antes/depois. */
import { $, $$, wa, esc } from "./dom.js";
import { WOODS, PIECES, PRODUCTS } from "./data.js";
import { fit, paintWood, paintBlueprint, engrave } from "./wood.js";
import { onShow } from "./router.js";
import { createCompare } from "./compare.js";
import { prefill } from "./wizard.js";

const dims = p => `${p.w} × ${p.h} × ${String(p.e).replace(".",",")} cm`;
const waText = p => `Olá, Arte & Madeira! Tenho interesse na peça: ${p.nome} (${WOODS[p.wood].nome}, ${dims(p)}), ${p.preco}.`;

function paintCards(){
  $$("#grid .item:not([hidden])").forEach(card => {
    const p = PRODUCTS[+card.dataset.i];
    const a = fit($(".wd", card)); if (a) engrave(paintWood(a.c,a.W,a.H,p.wood,p.seed), {text:p.text||"", piece:p.piece});
    const b = fit($(".vec", card)); if (b) paintBlueprint(b.c,b.W,b.H,{text:p.text||"", piece:p.piece});
  });
}

export function initGallery(){
  $("#grid").innerHTML = PRODUCTS.map((p,i) => `<article class="item" data-cat="${p.cat}" data-i="${i}">
    <button class="media" data-open="${i}" aria-label="Abrir projeto: ${esc(p.nome)}">
      <canvas class="wd"></canvas><canvas class="vec"></canvas><span class="peek">${PIECES[p.piece].nome.split(" ")[0]} · ${p.w*10} × ${p.h*10} mm</span>
    </button>
    <div class="top"><h3>${esc(p.nome)}</h3><span class="price">${p.preco}</span></div>
    <span class="spec">${WOODS[p.wood].nome} · ${dims(p)}</span><p>${p.desc}</p>
    <div class="actions"><button class="btn solid" data-order="${i}">Encomendar</button>
      <a class="btn wa" target="_blank" rel="noopener" href="${wa(waText(p))}">WhatsApp</a></div></article>`).join("");

  $$(".filters .chip").forEach(ch => ch.addEventListener("click", () => {
    $$(".filters .chip").forEach(x => x.setAttribute("aria-pressed", x === ch));
    let d = 0;
    $$("#grid .item").forEach(card => {
      const show = ch.dataset.cat === "todos" || card.dataset.cat === ch.dataset.cat;
      card.hidden = !show; card.classList.remove("pop");
      if (show){ void card.offsetWidth; card.style.setProperty("--d", d++); card.classList.add("pop") }
    });
    paintCards();
  }));

  const orderFrom = p => prefill({piece:p.piece, wood:p.wood, w:p.w, h:p.h, text:p.text||"", motif:"nenhum"});
  $("#grid").addEventListener("click", e => {
    const o = e.target.closest("[data-order]"); if (o) orderFrom(PRODUCTS[+o.dataset.order]);
    const m = e.target.closest("[data-open]"); if (m) open(PRODUCTS[+m.dataset.open]);
  });

  /* modal */
  const dlg = $("#proj-modal"), cmp = createCompare($("#pm-compare"));
  let cur = null;
  function open(p){
    cur = p;
    $("#pm-cat").textContent = p.cat === "placas" ? "Placa" : "Tábua";
    $("#pm-title").textContent = p.nome; $("#pm-desc").textContent = p.desc;
    $("#pm-specs").innerHTML = [["Madeira",`${WOODS[p.wood].nome}, Janka ≈ ${WOODS[p.wood].janka.toLocaleString("pt-BR")} lbf`],["Medidas",`${p.w*10} × ${p.h*10} × ${p.e*10} mm`],
      ["Usinagem",p.tempo],["Acabamento",PIECES[p.piece].finish],["Preço",p.preco]].map(([k,v]) => `<li><span>${k}</span><span>${esc(v)}</span></li>`).join("");
    $("#pm-wa").href = wa(waText(p));
    cmp.set({wood:p.wood, piece:p.piece, text:p.text||"", seed:p.seed}); cmp.reset();
    dlg.showModal(); requestAnimationFrame(() => cmp.paint());
  }
  $("#pm-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close() });
  $("#pm-order").addEventListener("click", () => { dlg.close(); orderFrom(cur) });
  addEventListener("resize", () => { if (dlg.open) cmp.paint() });

  onShow("projetos", paintCards);
}
