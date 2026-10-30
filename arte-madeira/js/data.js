/* Conteúdo do site. Troque PHONE pelo número real da empresa (55 + DDD + número). */
export const PHONE = "5524999999999";
export const PHONE_LABEL = "(24) 99999-9999";
export const EMAIL = "contato@artemadeira.com.br";

export const WOODS = {
  cumaru:{nome:"Cumaru", base:"#9C6A3C", dark:"#56341A", light:"#C38E58", janka:3330, uso:"Tábuas de churrasco e placas que ficam ao tempo."},
  jatoba:{nome:"Jatobá", base:"#94442A", dark:"#552012", light:"#BD6844", janka:2350, uso:"Tábuas gourmet. Vermelha, densa e muito estável."},
  ipe:{nome:"Ipê", base:"#6C5133", dark:"#3A2814", light:"#8F7049", janka:3510, uso:"A mais dura das quatro. Para peças de muito uso."},
  teca:{nome:"Teca", base:"#B78A4B", dark:"#77521F", light:"#D6AE6F", janka:1070, uso:"Leve e dourada. Objetos de sala e tábuas de frios."}
};
export const jankaLabel = n => n.toLocaleString("pt-BR");

/* min/max em cm; presets aparecem no passo de medidas */
export const PIECES = {
  "tabua-corte":{nome:"Tábua de corte com canaleta", desc:"Canaleta para o caldo, cantos arredondados.", def:[40,28], min:[20,15], max:[70,45], presets:[[30,20],[40,28],[50,35]], finish:"Óleo mineral e cera de abelha (atóxico)"},
  "tabua-churrasco":{nome:"Tábua de churrasco com cava", desc:"Peça grossa com cava para o molho.", def:[50,30], min:[30,20], max:[80,50], presets:[[40,28],[50,30],[60,40]], finish:"Óleo mineral e cera de abelha (atóxico)"},
  "tabua-frios":{nome:"Tábua de frios com furo", desc:"Comprida e fina, com furo para pendurar.", def:[45,18], min:[25,12], max:[90,30], presets:[[35,15],[45,18],[60,22]], finish:"Óleo mineral e cera de abelha (atóxico)"},
  "placa":{nome:"Placa entalhada", desc:"Letras em baixo-relevo, para porta ou portão.", def:[60,20], min:[20,10], max:[150,60], presets:[[40,15],[60,20],[100,30]], finish:"Verniz náutico com filtro UV"}
};

export const PRODUCTS = [
  {cat:"tabuas",nome:"Tábua gourmet com canaleta",wood:"jatoba",w:40,h:28,e:2.5,preco:"R$ 180",piece:"tabua-corte",seed:11,desc:"Canaleta funda para o caldo da carne e cantos arredondados. Óleo mineral e cera de abelha.",tempo:"38 min de máquina"},
  {cat:"tabuas",nome:"Tábua de churrasco com cava",wood:"cumaru",w:50,h:30,e:3,preco:"R$ 220",piece:"tabua-churrasco",seed:23,desc:"Peça maciça com cava para o molho e pegas laterais. Aguenta faca de churrasco todo fim de semana.",tempo:"52 min de máquina"},
  {cat:"tabuas",nome:"Tábua de frios com furo",wood:"teca",w:45,h:18,e:2,preco:"R$ 160",piece:"tabua-frios",seed:37,desc:"Comprida e fina, para servir queijos e embutidos na mesa. O furo na ponta deixa pendurar na cozinha.",tempo:"21 min de máquina"},
  {cat:"tabuas",nome:"Tábua com nome gravado",wood:"jatoba",w:35,h:25,e:2.5,preco:"R$ 195",piece:"tabua-corte",seed:41,text:"Família Ribeiro",desc:"O sobrenome da família gravado pela CNC. Presente de casamento ou casa nova que fica na cozinha por anos.",tempo:"46 min de máquina"},
  {cat:"placas",nome:"Placa “Recanto Feliz”",wood:"cumaru",w:60,h:20,e:3,preco:"R$ 260",piece:"placa",seed:53,text:"Recanto Feliz",desc:"Letras entalhadas em baixo-relevo e verniz náutico para sol e chuva.",tempo:"1 h 10 min de máquina"},
  {cat:"placas",nome:"Placa com o nome do seu sítio",wood:"ipe",w:80,h:25,e:3,preco:"Sob consulta",piece:"placa",seed:67,text:"Sítio Boa Vista",desc:"O nome da propriedade, um desenho entalhado e proteção para ficar no portão por anos.",tempo:"varia com o desenho"}
];

export const MOTIFS = {nenhum:"Nenhum",boi:"Boi",talheres:"Talheres",ramo:"Ramo",peixe:"Peixe",monograma:"Monograma"};
