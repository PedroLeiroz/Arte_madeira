/* Ficha técnica do pedido em PDF (jsPDF carregado sob demanda): prévia, especificações e desenho cotado. */
import { $, toast } from "./dom.js";
import { WOODS, PIECES, PHONE_LABEL, EMAIL } from "./data.js";
import { markSVG } from "./brand.js";
import { state, ORDER_NO, motifLabel } from "./wizard.js";

let jsPDFp = null;
function loadJsPDF(){
  return jsPDFp ||= new Promise((res, rej) => {
    if (window.jspdf) return res(window.jspdf.jsPDF);
    const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => res(window.jspdf.jsPDF); s.onerror = () => { jsPDFp = null; rej() }; document.head.append(s);
  });
}
function logoPNG(){
  return new Promise(res => { const img = new Image();
    img.onload = () => { const cv = document.createElement("canvas"); cv.width = cv.height = 360; cv.getContext("2d").drawImage(img,0,0,360,360); res(cv.toDataURL("image/png")) };
    img.onerror = () => res(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markSVG({ink:"#202427", accent:"#A87A1C", bg:"#ffffff"}));
  });
}
async function savePDF(doc, filename){
  const d = await window.claude?.use?.("downloads");
  if (d){ try { await d.save({filename, data:doc.output("blob")}); toast("PDF salvo") } catch(e){ if (e?.code!=="declined") toast("O download não está disponível nesta visualização") } return }
  doc.save(filename); toast("PDF baixado");
}

export async function makePDF(){
  const btn = $("#pdf"), label = btn.innerHTML; btn.disabled = true; btn.textContent = "Gerando PDF…";
  try {
    const JsPDF = await loadJsPDF(), f = state(), logo = await logoPNG();
    const doc = new JsPDF({unit:"mm", format:"a4"}), INK=[32,36,39], MUT=[89,96,102], ACC=[168,122,28], LINE=[198,203,199];
    const now = new Date(), dt = now.toLocaleDateString("pt-BR")+" "+now.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    if (logo) doc.addImage(logo,"PNG",15,12,18,18);
    doc.setFont("helvetica","bold").setFontSize(19).setTextColor(...INK).text("Arte",37,21); let x = 37+doc.getTextWidth("Arte ");
    doc.setTextColor(...ACC).text("&",x,21); x += doc.getTextWidth("& "); doc.setTextColor(...INK).text("Madeira",x,21);
    doc.setFont("helvetica","normal").setFontSize(7.5).setTextColor(...MUT).setCharSpace(.8).text("USINAGEM EM CNC",37.3,27).setCharSpace(0);
    doc.setFont("helvetica","bold").setFontSize(10).setTextColor(...INK).text("FICHA DE PEDIDO SOB MEDIDA",195,18,{align:"right"});
    doc.setFont("courier","normal").setFontSize(9).setTextColor(...MUT).text(`Nº ${ORDER_NO}`,195,24,{align:"right"}).text(dt,195,29,{align:"right"});
    doc.setDrawColor(...LINE).setLineWidth(.3).line(15,35,195,35);
    const b = $("#wz-board"), ratio = b.width/b.height; let pw = 180, ph = pw/ratio; if (ph>72){ ph = 72; pw = ph*ratio }
    doc.setFont("helvetica","bold").setFontSize(8).setTextColor(...MUT).setCharSpace(.5).text("PRÉVIA DA GRAVAÇÃO",15,43).setCharSpace(0);
    doc.addImage(b.toDataURL("image/jpeg",.92),"JPEG",15+(180-pw)/2,47,pw,ph);
    let y = 47+ph+12;
    doc.setFont("helvetica","bold").setFontSize(8).setTextColor(...MUT).setCharSpace(.5).text("ESPECIFICAÇÕES",15,y).setCharSpace(0); y += 4;
    const rows = [["Cliente",f.name||"(não informado)"],["Peça",PIECES[f.piece].nome],["Madeira",`${WOODS[f.wood].nome} (dureza Janka aprox. ${WOODS[f.wood].janka.toLocaleString("pt-BR")} lbf)`],
      ["Medidas",`${f.w*10} × ${f.h*10} mm (${f.w} × ${f.h} cm), espessura a definir`],["Gravação",f.text?(f.text.includes("\n")?`${f.text}\n(${f.text.split("\n").length} linhas, alinhamento ${({left:"à esquerda",center:"centralizado",right:"à direita"})[f.align]})`:`"${f.text}"`):"Sem texto"],["Desenho",motifLabel()],
      ["Referências",f.refs.length?`${f.refs.length} imagem(ns), enviadas pelo WhatsApp`:"Nenhuma"],["Acabamento",PIECES[f.piece].finish],["Prazo",f.due||"A combinar"],["Observações",f.obs||"—"]];
    rows.forEach(([k,v]) => { const lines = doc.setFont("helvetica","normal").setFontSize(10).splitTextToSize(v,135), h = Math.max(8,lines.length*4.6+3.4);
      doc.setDrawColor(...LINE).line(15,y,195,y); doc.setFont("helvetica","bold").setFontSize(9).setTextColor(...MUT).text(k,15,y+5.4);
      doc.setFont("helvetica","normal").setFontSize(10).setTextColor(...INK).text(lines,60,y+5.4); y += h });
    doc.line(15,y,195,y); y += 11;
    doc.setFont("helvetica","bold").setFontSize(8).setTextColor(...MUT).setCharSpace(.5).text("DESENHO TÉCNICO · VISTA SUPERIOR · COTAS EM MM",15,y).setCharSpace(0); y += 6;
    const L = f.w*10, A = f.h*10, maxDH = Math.max(30,272-y-14), sc = Math.min(150/L, maxDH/A), dw = L*sc, dh = A*sc, x0 = 15+(180-dw)/2+6, y0 = y+4;
    doc.setDrawColor(...INK).setLineWidth(.5).roundedRect(x0,y0,dw,dh,Math.min(4,dh/6),Math.min(4,dh/6),"S");
    doc.setLineWidth(.25).setLineDashPattern([1.2,1],0).setDrawColor(...ACC);
    if (f.piece==="tabua-corte"){ const o = Math.min(15*sc,dh/5); doc.roundedRect(x0+o,y0+o,dw-2*o,dh-2*o,2,2,"S") }
    if (f.piece==="tabua-churrasco") doc.ellipse(x0+dw*.22,y0+dh/2,dw*.1,dh*.28,"S");
    doc.setLineDashPattern([],0);
    const note = (t,xx,al="right") => doc.setFont("helvetica","normal").setFontSize(7).setTextColor(...ACC).text(t,xx,y0+dh+4,{align:al});
    if (f.piece==="placa"){ [[.06,.5],[.94,.5]].forEach(([px,py]) => doc.circle(x0+dw*px,y0+dh*py,Math.max(.8,3*sc),"S")); note("2 furos de fixação Ø 6 mm",x0+dw) }
    if (f.piece==="tabua-corte") note("canaleta a 15 mm da borda",x0+dw);
    if (f.piece==="tabua-frios"){ doc.setDrawColor(...ACC).circle(x0+dw-Math.max(2,25*sc),y0+dh/2,Math.max(.8,5*sc),"S"); note("furo Ø 10 mm para pendurar",x0+dw) }
    if (f.piece==="tabua-churrasco") note("cava para molho",x0+dw*.22,"center");
    const dim = (x1,y1,x2,y2,txt,vert) => { doc.setDrawColor(...MUT).setLineWidth(.2).line(x1,y1,x2,y2);
      const t = 1.5; if (vert){ doc.line(x1-t,y1,x1+t,y1); doc.line(x2-t,y2,x2+t,y2) } else { doc.line(x1,y1-t,x1,y1+t); doc.line(x2,y2-t,x2,y2+t) }
      doc.setFont("courier","normal").setFontSize(8.5).setTextColor(...INK);
      if (vert) doc.text(txt,x1-2.5,(y1+y2)/2,{align:"center",angle:90}); else doc.text(txt,(x1+x2)/2,y1-1.8,{align:"center"}) };
    dim(x0,y0-3,x0+dw,y0-3,`${L}`,false); dim(x0-5,y0,x0-5,y0+dh,`${A}`,true);
    doc.setFont("courier","normal").setFontSize(7.5).setTextColor(...MUT).text(`escala aprox. 1:${Math.round(1/sc)}`,15,y0+dh+4);
    doc.setDrawColor(...LINE).line(15,280,195,280);
    doc.setFont("helvetica","normal").setFontSize(8).setTextColor(...MUT)
      .text("Valores e prazo são confirmados pelo WhatsApp depois que a oficina analisar esta ficha. A prévia é ilustrativa: o veio de cada tábua é único.",15,285,{maxWidth:180})
      .text(`WhatsApp ${PHONE_LABEL} · ${EMAIL}`,15,292);
    await savePDF(doc, `Pedido ${ORDER_NO} - ${PIECES[f.piece].nome}.pdf`);
  } catch { toast("Não foi possível gerar o PDF agora. Tente de novo.") }
  finally { btn.disabled = false; btn.innerHTML = label }
}
