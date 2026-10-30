/* Micro-interações globais: leitura X/Y/Z que segue o mouse e a rolagem, títulos "cortados" ao entrar na tela. */
import { $, $$, mm, reduce } from "./dom.js";

export function initDRO(){
  if (!matchMedia("(pointer:fine)").matches) return;
  const x = $("#dro-x"), y = $("#dro-y"), z = $("#dro-z");
  let px = 0, py = 0, pending = false;
  const upd = () => {
    pending = false;
    x.textContent = mm(px / innerWidth * 600);
    y.textContent = mm((1 - py / innerHeight) * 400);
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    z.textContent = mm(-scrollY / max * 18);
  };
  const ask = () => { if (!pending){ pending = true; requestAnimationFrame(upd) } };
  addEventListener("pointermove", e => { px = e.clientX || 0; py = e.clientY || 0; ask() }, {passive:true});
  addEventListener("scroll", ask, {passive:true});
}

/* observa elementos com .cut e .woods; ao entrar na tela recebem .is-cut */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("is-cut"); io.unobserve(e.target) } }), {threshold:.5});
export function watchCuts(root = document){
  $$(".cut:not(.is-cut), .woods:not(.is-cut)", root).forEach(el => reduce ? el.classList.add("is-cut") : io.observe(el));
}
