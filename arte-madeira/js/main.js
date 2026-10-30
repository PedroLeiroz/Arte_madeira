/* Ponto de entrada: monta cada módulo e liga a navegação. */
import { $, wa, copy } from "./dom.js";
import { PHONE_LABEL } from "./data.js";
import { initBrand, replayLogo } from "./brand.js";
import { initRouter, onShow, repaint } from "./router.js";
import { initHero, heroFontsReady } from "./hero.js";
import { initHome } from "./home.js";
import { initGallery } from "./gallery.js";
import { initProcess } from "./process.js";
import { initWizard } from "./wizard.js";
import { initDRO, watchCuts } from "./fx.js";
import { initTheme } from "./theme.js";

initBrand();
initHome();
initHero();
initGallery();
initProcess();
initWizard();

$("#num-display").textContent = PHONE_LABEL;
$("#wa-contact").href = wa("Olá, Arte & Madeira! Vim pelo site e gostaria de conversar sobre uma peça.");
$("#copy-num").addEventListener("click", () => copy(PHONE_LABEL, "Número copiado"));
onShow("contato", replayLogo);

/* títulos e barras de dureza são "usinados" quando cada aba aparece */
["inicio","projetos","sob-medida","encomendas","contato"].forEach(v => onShow(v, () => watchCuts($(`[data-view="${v}"]`))));
initDRO();
initTheme();
initRouter();

/* com a fonte carregada, o texto no canvas sai na largura certa: redesenha e começa a gravação do herói */
let fontsDone = false;
const fontsGo = () => { if (!fontsDone){ fontsDone = true; heroFontsReady(); repaint() } };
document.fonts?.ready.then(fontsGo); setTimeout(fontsGo, 2500);
