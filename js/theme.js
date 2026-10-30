/* Modo claro/escuro: começa pelo sistema, a escolha do visitante fica salva neste navegador. */
import { $, store, toast } from "./dom.js";
import { repaint } from "./router.js";

const root = document.documentElement;
const system = () => matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const mode = () => root.dataset.theme || system();

function apply(t){
  root.dataset.theme = t; root.dataset.mode = t;
  $("#theme").setAttribute("aria-label", t === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro");
  requestAnimationFrame(repaint);   /* canvases que leem as cores do tema */
}

export function initTheme(){
  root.dataset.mode = mode();
  $("#theme").addEventListener("click", () => {
    const next = mode() === "dark" ? "light" : "dark";
    apply(next); store.set("am-theme", next);
    toast(next === "dark" ? "Modo escuro" : "Modo claro");
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (!root.dataset.theme){ root.dataset.mode = system(); repaint() } });
}
