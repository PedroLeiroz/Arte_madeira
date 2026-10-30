/* utilitários de DOM, formatação e feedback */
import { PHONE } from "./data.js";

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const wa = t => `https://api.whatsapp.com/send?phone=${PHONE}&text=${encodeURIComponent(t)}`;
export const mm = n => n.toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1});
export const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function toast(t){
  const el = $("#toast"); el.textContent = t; el.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 1800);
}
export function copy(text, ok){
  const fallback = () => {
    const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); toast(ok) } catch { toast("Selecione e copie manualmente") }
    ta.remove();
  };
  navigator.clipboard ? navigator.clipboard.writeText(text).then(() => toast(ok), fallback) : fallback();
}

/* armazenamento local tolerante a falhas (aba anônima, preview) */
export const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
};
