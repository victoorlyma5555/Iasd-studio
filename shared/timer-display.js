/* Cronômetro projetável do IASD APP.
   Uso: IASDTimerDisplay.mount(elemento, dados) -> { stop() }
   dados: { title, subtitle, total (s), state: 'idle'|'running'|'paused', remaining (s), endsAt (ms epoch), warn (s), alert (s) }
   A tela calcula o tempo sozinha a partir de endsAt: o Studio só envia quando algo muda. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const THEMES={
 noturno:{name:'Noturno Dourado',bg:'radial-gradient(ellipse at 50% 28%,#1d2760 0%,#0b1029 58%,#04060f 100%)',c1:'#c9a24a',c2:'#f5e3a6',glow:'rgba(214,170,80,.4)'},
 esmeralda:{name:'Esmeralda',bg:'radial-gradient(ellipse at 50% 28%,#124b40 0%,#072a24 58%,#02100d 100%)',c1:'#34d399',c2:'#b7f5db',glow:'rgba(52,211,153,.4)'},
 ouro:{name:'Ouro Real',bg:'radial-gradient(ellipse at 50% 30%,#35290f 0%,#14100a 60%,#060503 100%)',c1:'#d4a73d',c2:'#fde9a2',glow:'rgba(212,167,61,.42)'},
 vinho:{name:'Vinho',bg:'radial-gradient(ellipse at 50% 28%,#5a1630 0%,#2a0a18 58%,#0c0308 100%)',c1:'#e9a08f',c2:'#fde2d9',glow:'rgba(233,160,143,.38)'},
 aurora:{name:'Aurora',bg:'linear-gradient(135deg,#0c2f52 0%,#3a1f63 52%,#0a1a33 100%)',c1:'#5cc8f5',c2:'#d6c8ff',glow:'rgba(120,170,255,.42)'},
 grafite:{name:'Grafite',bg:'radial-gradient(ellipse at 50% 28%,#2c313c 0%,#14171d 60%,#07080b 100%)',c1:'#94a3b8',c2:'#e8edf4',glow:'rgba(148,163,184,.3)'},
 pergaminho:{name:'Pergaminho (claro)',bg:'radial-gradient(ellipse at 50% 35%,#fff8e8 0%,#f0e0bd 65%,#dcc797 100%)',c1:'#9a6418',c2:'#c58a2b',glow:'rgba(154,100,24,.22)',tx:'#2a1f0c',trk:'rgba(60,40,10,.12)',tk:'rgba(60,40,10,.3)',sh1:'rgba(255,255,255,.5)',sh2:'rgba(120,80,20,.08)'},
 safira:{name:'Safira Real',bg:'radial-gradient(ellipse at 50% 26%,#1d3f94 0%,#0d1f55 56%,#050b24 100%)',c1:'#7aa2ff',c2:'#dbe6ff',glow:'rgba(122,162,255,.42)'},
 oceano:{name:'Oceano Profundo',bg:'linear-gradient(160deg,#0b5a6b 0%,#083a52 50%,#03182b 100%)',c1:'#2dd4d4',c2:'#c8fbff',glow:'rgba(45,212,212,.4)'},
 floresta:{name:'Floresta',bg:'radial-gradient(ellipse at 50% 28%,#1f5a2b 0%,#0d2f17 58%,#041008 100%)',c1:'#86d38a',c2:'#e3f9d8',glow:'rgba(134,211,138,.36)'},
 imperial:{name:'Roxo Imperial',bg:'radial-gradient(ellipse at 50% 26%,#4a1f8a 0%,#22104d 56%,#090320 100%)',c1:'#c4a3ff',c2:'#f1e6ff',glow:'rgba(196,163,255,.42)'},
 rose:{name:'Rosé ao Anoitecer',bg:'linear-gradient(145deg,#6b2a66 0%,#3b1454 52%,#13071f 100%)',c1:'#f59fb8',c2:'#ffe0ea',glow:'rgba(245,159,184,.4)'},
 cobre:{name:'Cobre e Noite',bg:'radial-gradient(ellipse at 50% 30%,#4a2415 0%,#20100a 60%,#090403 100%)',c1:'#e08a4f',c2:'#ffd9b8',glow:'rgba(224,138,79,.4)'},
 amanhecer:{name:'Amanhecer',bg:'linear-gradient(165deg,#2b1650 0%,#7b2f6e 46%,#dd6a52 100%)',c1:'#ffc27a',c2:'#fff0d6',glow:'rgba(255,194,122,.44)'},
 lavanda:{name:'Lavanda (claro)',bg:'radial-gradient(ellipse at 50% 35%,#f6f1ff 0%,#dfd4fb 62%,#c3b3f0 100%)',c1:'#6d4fd1',c2:'#8b6cf0',glow:'rgba(109,79,209,.22)',tx:'#241a4c',trk:'rgba(40,25,90,.12)',tk:'rgba(40,25,90,.3)',sh1:'rgba(255,255,255,.55)',sh2:'rgba(70,40,150,.08)'},
 ceu:{name:'Céu de Manhã (claro)',bg:'radial-gradient(ellipse at 50% 32%,#f2faff 0%,#cfe8fb 62%,#a8d1f2 100%)',c1:'#1d6fb8',c2:'#2f8fd8',glow:'rgba(29,111,184,.22)',tx:'#0e2a47',trk:'rgba(14,42,71,.12)',tk:'rgba(14,42,71,.3)',sh1:'rgba(255,255,255,.55)',sh2:'rgba(20,80,140,.08)'},
 neon:{name:'Neon Arcade',bg:'linear-gradient(160deg,#12002e 0%,#2a0a5e 52%,#06001a 100%)',c1:'#ff3df2',c2:'#3df5ff',glow:'rgba(255,61,242,.6)',pat:'grid',font:'rounded'},
 estrelas:{name:'Noite Estrelada',bg:'radial-gradient(ellipse at 50% 0%,#16265a 0%,#070d24 62%,#02040d 100%)',c1:'#ffe9a8',c2:'#fff7de',glow:'rgba(255,233,168,.38)',pat:'stars'},
 terminal:{name:'Terminal Verde',bg:'radial-gradient(ellipse at 50% 40%,#052414 0%,#02130a 70%,#000805 100%)',c1:'#3dff7a',c2:'#b8ffd0',glow:'rgba(61,255,122,.5)',pat:'scan',font:'mono'},
 vitral:{name:'Vitral',bg:'linear-gradient(135deg,#1a0b3b 0%,#0e2a5c 50%,#5c0e2c 100%)',c1:'#ffb703',c2:'#8ecae6',glow:'rgba(255,183,3,.4)',pat:'diamonds'},
 tropical:{name:'Pôr do Sol Tropical',bg:'linear-gradient(180deg,#6a3093 0%,#d1477a 45%,#ff9966 100%)',c1:'#fff3b0',c2:'#ffffff',glow:'rgba(255,243,176,.5)',pat:'sun'},
 classico:{name:'Clássico Real',bg:'radial-gradient(ellipse at 50% 30%,#12335a 0%,#081a30 62%,#030b16 100%)',c1:'#d9b45b',c2:'#f3e2b0',glow:'rgba(217,180,91,.4)',pat:'frame',font:'serif'},
 chama:{name:'Chama Viva',bg:'radial-gradient(ellipse at 50% 100%,#5a1400 0%,#240700 55%,#0c0200 100%)',c1:'#ff6b1a',c2:'#ffd27a',glow:'rgba(255,107,26,.5)',pat:'embers'},
 raios:{name:'Raios de Luz',bg:'radial-gradient(ellipse at 50% 100%,#25407a 0%,#0c1b3d 60%,#040a1a 100%)',c1:'#ffd978',c2:'#fff4cf',glow:'rgba(255,217,120,.45)',pat:'rays'},
 minimal:{name:'Minimalista (claro)',bg:'linear-gradient(180deg,#ffffff 0%,#f1f3f6 100%)',c1:'#111827',c2:'#4b5563',glow:'rgba(17,24,39,.12)',tx:'#111827',trk:'rgba(17,24,39,.1)',tk:'rgba(17,24,39,.28)',sh1:'rgba(255,255,255,0)',sh2:'rgba(255,255,255,0)',font:'thin'},
 craft:{name:'Papel Craft (claro)',bg:'linear-gradient(160deg,#e3cfae 0%,#d3b98f 100%)',c1:'#7a4a14',c2:'#a8682a',glow:'rgba(122,74,20,.2)',tx:'#33220d',trk:'rgba(60,40,10,.14)',tk:'rgba(60,40,10,.32)',sh1:'rgba(255,255,255,.3)',sh2:'rgba(120,80,20,.1)',pat:'paper',font:'serif'},
 gelo:{name:'Gelo (claro)',bg:'linear-gradient(160deg,#e6f6ff 0%,#a9d8f5 60%,#7fb8e3 100%)',c1:'#0b5a8c',c2:'#1b7fc0',glow:'rgba(11,90,140,.22)',tx:'#06304d',trk:'rgba(6,48,77,.12)',tk:'rgba(6,48,77,.3)',sh1:'rgba(255,255,255,.55)',sh2:'rgba(20,90,150,.08)',pat:'bokeh'},
 aquarela:{name:'Aquarela (claro)',bg:'linear-gradient(135deg,#ffe3ec 0%,#e4e1ff 50%,#d9f3ff 100%)',c1:'#7b5ea7',c2:'#d9689a',glow:'rgba(123,94,167,.2)',tx:'#2c2147',trk:'rgba(44,33,71,.1)',tk:'rgba(44,33,71,.28)',sh1:'rgba(255,255,255,.5)',sh2:'rgba(160,120,220,.1)',pat:'bokeh',font:'rounded'}
};
const DEFAULT_THEME='noturno';
const QR_N=29,QR_PATH='M0 0h7v1h-7zM9 0h3v1h-3zM13 0h2v1h-2zM18 0h1v1h-1zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM11 1h2v1h-2zM20 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM9 2h3v1h-3zM14 2h1v1h-1zM19 2h2v1h-2zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM10 3h2v1h-2zM13 3h1v1h-1zM16 3h5v1h-5zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h1v1h-1zM12 4h1v1h-1zM14 4h1v1h-1zM16 4h5v1h-5zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h2v1h-2zM14 5h1v1h-1zM16 5h2v1h-2zM20 5h1v1h-1zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM9 7h1v1h-1zM12 7h1v1h-1zM18 7h2v1h-2zM0 8h2v1h-2zM5 8h3v1h-3zM9 8h2v1h-2zM12 8h4v1h-4zM17 8h1v1h-1zM24 8h2v1h-2zM2 9h1v1h-1zM4 9h2v1h-2zM8 9h1v1h-1zM10 9h1v1h-1zM13 9h3v1h-3zM18 9h2v1h-2zM23 9h2v1h-2zM26 9h2v1h-2zM3 10h1v1h-1zM6 10h1v1h-1zM9 10h1v1h-1zM11 10h2v1h-2zM15 10h4v1h-4zM21 10h2v1h-2zM0 11h1v1h-1zM2 11h3v1h-3zM7 11h1v1h-1zM10 11h2v1h-2zM14 11h2v1h-2zM18 11h4v1h-4zM23 11h1v1h-1zM25 11h1v1h-1zM2 12h1v1h-1zM5 12h6v1h-6zM15 12h1v1h-1zM20 12h1v1h-1zM22 12h2v1h-2zM28 12h1v1h-1zM0 13h2v1h-2zM3 13h2v1h-2zM7 13h2v1h-2zM10 13h1v1h-1zM12 13h1v1h-1zM15 13h2v1h-2zM19 13h1v1h-1zM22 13h1v1h-1zM24 13h1v1h-1zM27 13h2v1h-2zM4 14h1v1h-1zM6 14h4v1h-4zM13 14h1v1h-1zM15 14h4v1h-4zM21 14h1v1h-1zM23 14h1v1h-1zM25 14h2v1h-2zM1 15h5v1h-5zM7 15h1v1h-1zM9 15h2v1h-2zM12 15h1v1h-1zM18 15h1v1h-1zM20 15h5v1h-5zM26 15h1v1h-1zM28 15h1v1h-1zM0 16h1v1h-1zM2 16h2v1h-2zM5 16h3v1h-3zM9 16h1v1h-1zM12 16h3v1h-3zM17 16h2v1h-2zM20 16h1v1h-1zM23 16h1v1h-1zM25 16h2v1h-2zM0 17h3v1h-3zM5 17h1v1h-1zM7 17h2v1h-2zM10 17h1v1h-1zM15 17h1v1h-1zM17 17h8v1h-8zM26 17h3v1h-3zM0 18h4v1h-4zM6 18h3v1h-3zM12 18h4v1h-4zM19 18h4v1h-4zM25 18h1v1h-1zM28 18h1v1h-1zM0 19h1v1h-1zM3 19h3v1h-3zM7 19h2v1h-2zM10 19h2v1h-2zM14 19h3v1h-3zM21 19h4v1h-4zM0 20h2v1h-2zM3 20h1v1h-1zM6 20h2v1h-2zM10 20h2v1h-2zM17 20h1v1h-1zM20 20h5v1h-5zM26 20h3v1h-3zM8 21h1v1h-1zM12 21h4v1h-4zM17 21h4v1h-4zM24 21h2v1h-2zM0 22h7v1h-7zM8 22h2v1h-2zM13 22h4v1h-4zM19 22h2v1h-2zM22 22h1v1h-1zM24 22h3v1h-3zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h3v1h-3zM12 23h2v1h-2zM18 23h3v1h-3zM24 23h1v1h-1zM27 23h1v1h-1zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM9 24h5v1h-5zM15 24h2v1h-2zM19 24h7v1h-7zM27 24h1v1h-1zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM10 25h1v1h-1zM15 25h5v1h-5zM21 25h1v1h-1zM23 25h1v1h-1zM25 25h2v1h-2zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM9 26h1v1h-1zM11 26h2v1h-2zM15 26h2v1h-2zM18 26h1v1h-1zM21 26h7v1h-7zM0 27h1v1h-1zM6 27h1v1h-1zM8 27h1v1h-1zM11 27h1v1h-1zM15 27h2v1h-2zM21 27h3v1h-3zM25 27h2v1h-2zM28 27h1v1h-1zM0 28h7v1h-7zM8 28h4v1h-4zM15 28h1v1h-1zM17 28h1v1h-1zM19 28h1v1h-1zM21 28h1v1h-1zM23 28h4v1h-4z';  // QR de https://www.iasdapp.com.br/licao-sabatica

const FONTS={serif:"Georgia,'Times New Roman',serif",mono:"ui-monospace,SFMono-Regular,Menlo,Consolas,monospace",rounded:"ui-rounded,'Trebuchet MS','Segoe UI',system-ui,sans-serif",thin:"'Segoe UI Light','Helvetica Neue',Helvetica,Arial,sans-serif"};
const DECO_CSS=`
.iasd-deco{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.iasd-deco[data-pat="grid"]{background:linear-gradient(transparent 94%,color-mix(in srgb,var(--c2,#3df5ff) 38%,transparent) 96%) 0 0/100% 8vmin,linear-gradient(90deg,transparent 94%,color-mix(in srgb,var(--c1,#ff3df2) 38%,transparent) 96%) 0 0/8vmin 100%;-webkit-mask-image:linear-gradient(180deg,transparent,#000 35%,#000 75%,transparent);mask-image:linear-gradient(180deg,transparent,#000 35%,#000 75%,transparent);animation:decoGrid 6s linear infinite}
@keyframes decoGrid{to{background-position:0 8vmin,8vmin 0}}
.iasd-deco[data-pat="stars"],.iasd-deco[data-pat="stars"]:after{background:radial-gradient(1.5px 1.5px at 12% 22%,#fff,transparent),radial-gradient(1px 1px at 34% 70%,#fff,transparent),radial-gradient(2px 2px at 58% 18%,#fff,transparent),radial-gradient(1.5px 1.5px at 82% 62%,#fff,transparent),radial-gradient(1px 1px at 70% 88%,#fff,transparent),radial-gradient(2px 2px at 22% 90%,#fff,transparent),radial-gradient(1px 1px at 92% 14%,#fff,transparent),radial-gradient(1.5px 1.5px at 46% 46%,#fff,transparent);animation:decoTw 3.6s ease-in-out infinite alternate}
.iasd-deco[data-pat="stars"]:after{content:'';position:absolute;inset:0;transform:translate(6%,9%) scale(.8);animation-delay:-1.8s;animation-duration:5s}
@keyframes decoTw{from{opacity:.25}to{opacity:1}}
.iasd-deco[data-pat="scan"]{background:repeating-linear-gradient(0deg,rgba(0,0,0,.24) 0 2px,transparent 2px 4px),radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.55))}
.iasd-deco[data-pat="diamonds"]{background:linear-gradient(45deg,rgba(255,255,255,.055) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.055) 75%) 0 0/10vmin 10vmin,linear-gradient(-45deg,rgba(255,200,80,.06) 25%,transparent 25%,transparent 75%,rgba(255,200,80,.06) 75%) 5vmin 5vmin/10vmin 10vmin}
.iasd-deco[data-pat="sun"]{background:radial-gradient(circle at 50% 82%,rgba(255,246,196,.95) 0 10vmin,rgba(255,206,130,.5) 10.2vmin 17vmin,transparent 46vmin)}
.iasd-deco[data-pat="frame"]{inset:2.4vmin;border:.45vmin solid var(--c1);outline:.2vmin solid var(--c1);outline-offset:1.1vmin;opacity:.75;border-radius:.6vmin}
.iasd-deco[data-pat="paper"]{background:radial-gradient(rgba(0,0,0,.06) 1px,transparent 1.6px) 0 0/6px 6px,radial-gradient(rgba(120,80,30,.07) 1px,transparent 1.6px) 3px 3px/9px 9px}
.iasd-deco[data-pat="bokeh"]{background:radial-gradient(circle at 15% 25%,rgba(255,255,255,.7) 0 6vmin,transparent 6.3vmin),radial-gradient(circle at 80% 70%,rgba(255,255,255,.55) 0 9vmin,transparent 9.3vmin),radial-gradient(circle at 60% 18%,rgba(255,255,255,.5) 0 4vmin,transparent 4.3vmin),radial-gradient(circle at 25% 80%,rgba(255,255,255,.45) 0 7vmin,transparent 7.3vmin);animation:decoBreath 7s ease-in-out infinite alternate}
@keyframes decoBreath{from{opacity:.55;transform:scale(1)}to{opacity:1;transform:scale(1.04)}}
.iasd-deco[data-pat="embers"]{background:radial-gradient(2px 2px at 20% 80%,#ffb347,transparent),radial-gradient(2px 2px at 45% 90%,#ff7a1a,transparent),radial-gradient(3px 3px at 70% 85%,#ffd27a,transparent),radial-gradient(2px 2px at 88% 95%,#ff9a3c,transparent),radial-gradient(2px 2px at 8% 95%,#ffb347,transparent),radial-gradient(2px 2px at 56% 100%,#ffd27a,transparent);animation:decoRise 5s linear infinite}
@keyframes decoRise{from{transform:translateY(10%);opacity:1}to{transform:translateY(-70%);opacity:0}}
.iasd-deco[data-pat="rays"]{background:repeating-conic-gradient(from 0deg at 50% 112%,color-mix(in srgb,var(--c1,#ffd978) 24%,transparent) 0 5deg,transparent 5deg 13deg);-webkit-mask-image:radial-gradient(ellipse at 50% 100%,#000,transparent 75%);mask-image:radial-gradient(ellipse at 50% 100%,#000,transparent 75%);animation:decoBreath 6s ease-in-out infinite alternate}
`;
const CSS_FX=`
.iasd-tm{font-family:var(--tf,Inter,system-ui,Arial,sans-serif)}
.iasd-tm>svg,.iasd-tm>.tmx{position:relative;z-index:1}
.iasd-tm .tmx{width:100%;height:100%;display:grid;place-content:center;justify-items:center;text-align:center;gap:2.4cqh;padding:4cqh 5cqw;color:var(--tx);filter:drop-shadow(0 0 2.5cqh var(--glow))}
.iasd-tm .tmx .ttl2{font-weight:800;letter-spacing:.3em;text-transform:uppercase;font-size:4.4cqh;color:var(--tx);text-indent:.3em}
.iasd-tm .tmx .sub2{font-weight:600;letter-spacing:.26em;text-transform:uppercase;font-size:2.6cqh;color:var(--c2);text-indent:.26em;margin-top:-1.6cqh}
.iasd-tm .tmx .st2{font-weight:800;letter-spacing:.34em;text-transform:uppercase;font-size:2.8cqh;color:var(--c2);min-height:3.4cqh;text-indent:.34em}
.iasd-tm.warn .tmx .st2,.iasd-tm.alert .tmx .st2,.iasd-tm.done .tmx .st2{color:var(--tm)}
.iasd-tm .tmx .time2{font-weight:800;line-height:1;color:var(--tm,var(--tx));font-variant-numeric:tabular-nums;font-feature-settings:'tnum';transition:color .6s;white-space:nowrap}
.iasd-tm .tmx .trk2{position:relative;width:min(80cqw,160cqh);height:2.2cqh;border-radius:99px;background:var(--trk);overflow:hidden}
.iasd-tm .tmx .arc2{position:absolute;inset:0;width:100%;border-radius:99px;background:linear-gradient(90deg,var(--c1),var(--c2));transform-origin:left center;transition:transform .25s linear;box-shadow:0 0 2.4cqh var(--glow)}
.iasd-tm .tmx.digital .time2{font-size:min(30cqh,19cqw);letter-spacing:.02em;text-shadow:0 0 .12em var(--c2),0 0 .5em var(--glow)}
.iasd-tm .tmx.digital .segs{display:grid;grid-template-columns:repeat(60,1fr);gap:.35cqw;width:min(84cqw,170cqh)}
.iasd-tm .tmx.digital .segs i{height:3.2cqh;border-radius:.5cqh;background:var(--trk);transition:background .3s,box-shadow .3s}
.iasd-tm .tmx.digital .segs i.on{background:var(--c1);box-shadow:0 0 1.4cqh var(--glow)}
.iasd-tm .tmx.cards .row2{display:flex;gap:1.4cqw;align-items:center;justify-content:center}
.iasd-tm .tmx.cards .card2{position:relative;width:min(13.5cqw,26cqh);height:min(21cqw,40cqh);border-radius:min(1.6cqw,3cqh);background:linear-gradient(180deg,var(--cd1,rgba(255,255,255,.12)) 0 50%,var(--cd2,rgba(0,0,0,.34)) 50% 100%),var(--cdb,rgba(8,12,30,.78));border:.2cqh solid color-mix(in srgb,var(--c1) 55%,transparent);box-shadow:0 1.2cqh 3cqh rgba(0,0,0,.4);display:grid;place-items:center;font-weight:800;font-size:min(17cqw,33cqh);line-height:1;color:var(--tm,var(--tx));font-variant-numeric:tabular-nums;overflow:hidden;transition:color .6s}
.iasd-tm .tmx.cards .card2:after{content:'';position:absolute;left:0;right:0;top:50%;height:max(2px,.35cqh);background:rgba(0,0,0,.5)}
.iasd-tm .tmx.cards .card2.flip i{animation:tmFlip .45s ease-out}
.iasd-tm .tmx.cards .card2 i{font-style:normal;display:block}
.iasd-tm .tmx.cards .sep2{font-size:min(12cqw,24cqh);font-weight:800;color:var(--c2);opacity:.85;padding-bottom:1cqh}
@keyframes tmFlip{0%{transform:rotateX(90deg);opacity:0}100%{transform:rotateX(0);opacity:1}}
.iasd-tm .tmx.bar .time2{font-size:min(26cqh,16cqw)}
.iasd-tm .tmx.bar .trk2{height:5.2cqh;width:min(88cqw,176cqh)}
.iasd-tm .tmx.bar .pct2{font-weight:700;font-size:2.8cqh;color:var(--c2);letter-spacing:.2em}
.iasd-tm .tmx.min2 .time2{font-size:min(44cqh,26cqw);font-weight:300;letter-spacing:-.02em}
.iasd-tm .tmx.min2 .trk2{height:.7cqh;width:min(60cqw,120cqh)}
.iasd-tm .tmx.min2 .ttl2{font-weight:500;font-size:3.4cqh}
.iasd-tm.is-thin .time,.iasd-tm.is-thin .time2{font-weight:300}
.iasd-tm.an-pulso .time,.iasd-tm.an-pulso .time2,.iasd-tm.an-pulso .card2,.iasd-tm.an-tremor .time,.iasd-tm.an-tremor .time2,.iasd-tm.an-tremor .card2{transform-box:fill-box;transform-origin:center}
.iasd-tm.an-suave.run .time,.iasd-tm.an-suave.run .time2,.iasd-tm.an-suave.run .card2{animation:tmBreath 4s ease-in-out infinite}
@keyframes tmBreath{0%,100%{opacity:1}50%{opacity:.82}}
.iasd-tm.an-pulso.run .time,.iasd-tm.an-pulso.run .time2,.iasd-tm.an-pulso.run .card2{animation:tmBeat 1s ease-in-out infinite}
@keyframes tmBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.iasd-tm.an-neon .time,.iasd-tm.an-neon .time2,.iasd-tm.an-neon .arc,.iasd-tm.an-neon .arc2,.iasd-tm.an-neon .card2{animation:tmNeon 2.2s ease-in-out infinite}
@keyframes tmNeon{0%,100%{filter:drop-shadow(0 0 .8cqh var(--c2)) brightness(1)}45%{filter:drop-shadow(0 0 4cqh var(--c1)) brightness(1.25)}50%{filter:drop-shadow(0 0 .2cqh var(--c2)) brightness(.85)}55%{filter:drop-shadow(0 0 3.6cqh var(--c1)) brightness(1.2)}}
.iasd-tm.an-tremor.run .time,.iasd-tm.an-tremor.run .time2,.iasd-tm.an-tremor.run .card2{animation:tmJitter .22s linear infinite}
@keyframes tmJitter{0%{transform:translate(0,0)}25%{transform:translate(.35cqh,-.25cqh)}50%{transform:translate(-.3cqh,.3cqh)}75%{transform:translate(.25cqh,.2cqh)}100%{transform:translate(0,0)}}
.iasd-tm.an-tremor.alert .time,.iasd-tm.an-tremor.done .time,.iasd-tm.an-tremor.alert .time2,.iasd-tm.an-tremor.done .time2,.iasd-tm.an-tremor.alert .card2,.iasd-tm.an-tremor.done .card2{animation:tmShake .12s linear infinite!important}
@keyframes tmShake{0%{transform:translate(0,0)}25%{transform:translate(1cqh,-.7cqh)}50%{transform:translate(-.9cqh,.8cqh)}75%{transform:translate(.7cqh,.5cqh)}100%{transform:translate(0,0)}}
.iasd-tm.an-nenhuma *,.iasd-tm.an-nenhuma:after{animation:none!important;transition:none!important}
`;
function deco(themeId){const t=THEMES[themeId];if(!t||!t.pat)return null;if(!document.getElementById('iasd-deco-css')){const st=document.createElement('style');st.id='iasd-deco-css';st.textContent=DECO_CSS;document.head.appendChild(st)}const d=document.createElement('div');d.className='iasd-deco';d.dataset.pat=t.pat;d.setAttribute('aria-hidden','true');return d}
const LAYOUTS={ring:'Anel',digital:'Digital',cards:'Cartões',bar:'Barra',minimal:'Minimalista'};
const ANIMS={suave:'Suave',pulso:'Pulso',neon:'Neon',tremor:'Tremor',nenhuma:'Sem animação'};
const CSS=`
.iasd-tm{--tx:#fff;--trk:rgba(255,255,255,.09);--tk:rgba(255,255,255,.22);position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;color:var(--tx);font-family:Inter,system-ui,Arial,sans-serif;background:var(--bg);transition:background .8s}
${Object.keys(THEMES).map(k=>{const t=THEMES[k];return`.iasd-tm[data-theme="${k}"]{--bg:${t.bg};--c1:${t.c1};--c2:${t.c2};--glow:${t.glow};${t.font?`--tf:${FONTS[t.font]};`:''}${t.tx?`--tx:${t.tx};--trk:${t.trk};--tk:${t.tk};--cd1:rgba(255,255,255,.92);--cd2:rgba(255,255,255,.62);--cdb:rgba(255,255,255,.9);`:''}${t.sh1?`--sh1:${t.sh1};--sh2:${t.sh2};`:''}}`}).join('\n')}
.iasd-tm.warn{--c1:#ffb000;--c2:#ffe14d;--glow:rgba(255,176,0,.65);--tm:#ffe14d;--wash:rgba(255,176,0,.42);--wash0:rgba(255,176,0,.12)}
.iasd-tm.alert,.iasd-tm.done{--c1:#ff2d2d;--c2:#ff7a7a;--glow:rgba(255,45,45,.7);--tm:#ff5a5a;--wash:rgba(255,30,30,.55);--wash0:rgba(255,30,30,.2)}
.iasd-tm[data-theme="pergaminho"].warn{--c1:#d97706;--c2:#f59e0b;--glow:rgba(217,119,6,.35);--tm:#b45309;--wash:rgba(245,158,11,.5);--wash0:rgba(245,158,11,.14)}
.iasd-tm[data-theme="pergaminho"].alert,.iasd-tm[data-theme="pergaminho"].done{--c1:#b91c1c;--c2:#dc2626;--glow:rgba(185,28,28,.35);--tm:#b91c1c;--wash:rgba(220,38,38,.5);--wash0:rgba(220,38,38,.18)}
.iasd-tm .time{fill:var(--tm,var(--tx))!important;transition:fill .6s}
.iasd-tm.warn .st,.iasd-tm.alert .st,.iasd-tm.done .st{fill:var(--tm)}
.iasd-tm:after{content:'';position:absolute;inset:0;opacity:0;transition:opacity .8s;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,var(--wash0,transparent) 30%,var(--wash,transparent) 100%)}
.iasd-tm.warn:after,.iasd-tm.alert:after,.iasd-tm.done:after{opacity:1}
.iasd-tm.idle{--c1:#64748b;--c2:#94a3b8;--glow:rgba(148,163,184,.25)}
.iasd-tm:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 18% 12%,var(--sh1,rgba(255,255,255,.08)),transparent 42%),radial-gradient(circle at 88% 92%,var(--sh2,rgba(255,255,255,.05)),transparent 46%);pointer-events:none}
.iasd-tm{container-type:size}
.iasd-tm svg{width:min(96vh,96vw);height:min(96vh,96vw);width:min(96cqh,96cqw);height:min(96cqh,96cqw);display:block;filter:drop-shadow(0 0 3vmin var(--glow))}
.iasd-tm .trk{fill:none;stroke:var(--trk);stroke-width:26}
.iasd-tm .arc{fill:none;stroke:url(#iasd-tm-g);stroke-width:26;stroke-linecap:round}
.iasd-tm .dot{fill:var(--tx);filter:drop-shadow(0 0 14px var(--c2))}
.iasd-tm .tk{stroke:var(--tk);stroke-width:4;stroke-linecap:round}
.iasd-tm .tk.m{stroke-width:7}.iasd-tm .tk.on{stroke:var(--c2)}
.iasd-tm .time{font-weight:800;fill:var(--tx);text-anchor:middle;font-variant-numeric:tabular-nums;letter-spacing:-4px;font-feature-settings:'tnum'}
.iasd-tm .ttl{font-weight:800;fill:var(--tx);text-anchor:middle;letter-spacing:5px;text-transform:uppercase}
.iasd-tm .sub{font-weight:600;fill:var(--c2);text-anchor:middle;letter-spacing:4px;text-transform:uppercase}
.iasd-tm .st{font-weight:800;fill:var(--c2);text-anchor:middle;letter-spacing:6px;text-transform:uppercase}
.iasd-tm .ico{fill:none;stroke:var(--tx);stroke-width:9;stroke-linecap:round;stroke-linejoin:round;opacity:.92}
.iasd-tm.paused .time,.iasd-tm.paused .st{animation:iasdTmBlink 1.4s ease-in-out infinite}
.iasd-tm.done .time,.iasd-tm.done .st{animation:iasdTmPulse .9s ease-in-out infinite}
.iasd-tm.done .arc{animation:iasdTmPulse .9s ease-in-out infinite}
.iasd-tm.alert .time{animation:iasdTmTick 1s ease-in-out infinite;transform-origin:500px 500px}
@keyframes iasdTmBlink{50%{opacity:.35}}
@keyframes iasdTmPulse{50%{opacity:.25}}
@keyframes iasdTmTick{50%{transform:scale(1.025)}}
.iasd-tm .qr{position:absolute;right:3cqh;bottom:3cqh;width:23cqh;padding:1.4cqh 1.4cqh 1.6cqh;border-radius:2.2cqh;background:linear-gradient(160deg,#fff,#f4ecd6);color:#1b1608;text-align:center;box-shadow:0 1.2cqh 4cqh rgba(0,0,0,.45),0 0 0 .35cqh var(--c1);font-family:inherit;z-index:2;transition:box-shadow .8s}
.iasd-tm .qr svg{width:100%;height:auto;display:block;filter:none;border-radius:1cqh}
.iasd-tm .qr b{display:block;margin-top:1.1cqh;font-size:1.75cqh;letter-spacing:.18em;font-weight:800;text-transform:uppercase;line-height:1.25}
.iasd-tm .qr small{display:block;margin-top:.5cqh;font-size:1.45cqh;font-weight:600;opacity:.7;line-height:1.3}
@media (max-aspect-ratio:1/1){.iasd-tm .qr{width:26cqw;right:3cqw;bottom:3cqw}.iasd-tm .qr b{font-size:2cqw}.iasd-tm .qr small{font-size:1.7cqw}}
`;
/* Bip de fim: três toques curtos. Só toca quando o tempo ACABA de zerar com o cronômetro rodando. */
let audioCtx=null;
function beepEnd(){
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  const x=audioCtx;if(x.state==='suspended')x.resume();
  [0,.42,.84].forEach((dl,i)=>{
   const t=x.currentTime+dl,o=x.createOscillator(),g=x.createGain();
   o.type='square';o.frequency.setValueAtTime(i===2?1046:880,t);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.32,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.3);
   o.connect(g);g.connect(x.destination);o.start(t);o.stop(t+.34)})
 }catch(e){}
}
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);if(parent)parent.appendChild(n);return n}
function num(v,min,max,def){v=Number(v);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):def}
function clean(d){
 d=d&&typeof d==='object'?d:{};
 const total=Math.round(num(d.total,1,86400,3600));
 return{
  title:String(d.title||'Escola Sabatina').slice(0,40),
  subtitle:String(d.subtitle||'').slice(0,60),
  total,
  state:['idle','running','paused'].includes(d.state)?d.state:'idle',
  remaining:num(d.remaining,0,total,total),
  endsAt:num(d.endsAt,0,4e12,0),
  warn:Math.round(num(d.warn,0,86400,300)),
  alert:Math.round(num(d.alert,0,86400,60)),
  theme:THEMES[d.theme]?d.theme:DEFAULT_THEME,
  qr:d.qr===true,
  beep:d.beep!==false,
  layout:LAYOUTS[d.layout]?d.layout:'ring',
  anim:ANIMS[d.anim]?d.anim:'suave'
 };
}
function fmt(s){
 s=Math.max(0,Math.ceil(s));
 const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60,p=n=>String(n).padStart(2,'0');
 return h?`${h}:${p(m)}:${p(r)}`:`${p(m)}:${p(r)}`;
}
function mount(root,raw){
 const d=clean(raw);
 if(!document.getElementById('iasd-tm-css')){const st=document.createElement('style');st.id='iasd-tm-css';st.textContent=CSS+CSS_FX;document.head.appendChild(st)}
 const th=THEMES[d.theme]||THEMES[DEFAULT_THEME];
 const box=document.createElement('div');box.className='iasd-tm idle an-'+d.anim+(th.font==='thin'?' is-thin':'');box.dataset.theme=d.theme;
 const dc=deco(d.theme);if(dc)box.appendChild(dc);
 const ui=d.layout==='ring'?buildRing(box,d):buildFlat(box,d);
 if(d.qr){const q=document.createElement('div');q.className='qr';
  q.innerHTML='<svg viewBox="-2 -2 '+(QR_N+4)+' '+(QR_N+4)+'" shape-rendering="crispEdges" role="img" aria-label="QR Code da Lição da Escola Sabatina"><rect x="-2" y="-2" width="'+(QR_N+4)+'" height="'+(QR_N+4)+'" fill="#fff"/><path d="'+QR_PATH+'" fill="#0b1029"/></svg><b>Lição da<br>Escola Sabatina</b><small>Aponte a câmera do celular</small>';
  box.appendChild(q)}
 root.appendChild(box);
 let raf=0,stopped=false,lastTxt='',lastCls='',prevRem=null,beeped=false;
 function left(now){return d.state==='running'?Math.max(0,(d.endsAt-now)/1000):d.remaining}
 function frame(){
  if(stopped)return;
  const now=Date.now(),rem=left(now),txt=fmt(rem);
  const done=d.state!=='idle'&&rem<=0;
  if(d.beep&&d.state==='running'&&done&&!beeped&&prevRem!==null&&prevRem>0){beeped=true;beepEnd()}
  if(rem>0)beeped=false;prevRem=rem;
  let cls=d.state==='idle'?'idle':done?'done':rem<=d.alert&&d.alert>0?'alert':rem<=d.warn&&d.warn>0?'warn':'';
  if(d.state==='paused'&&!done)cls=(rem<=d.alert&&d.alert>0?'alert':rem<=d.warn&&d.warn>0?'warn':'')+' paused';
  if(d.state==='running'&&!done)cls+=' run';
  if(cls!==lastCls){box.className='iasd-tm an-'+d.anim+(th.font==='thin'?' is-thin':'')+' '+cls;lastCls=cls}
  const shown=done?'00:00':txt;
  if(txt!==lastTxt){ui.time(shown,lastTxt!=='');lastTxt=txt}
  const frac=Math.max(0,Math.min(1,rem/d.total));
  ui.frac(frac);
  ui.status(d.state==='idle'?'Pronto':done?'Tempo encerrado':d.state==='paused'?'Pausado':cls.indexOf('alert')>=0?'Últimos instantes':cls.indexOf('warn')>=0?'Tempo final':'');
  raf=requestAnimationFrame(frame);
 }
 frame();
 return{stop(){stopped=true;cancelAnimationFrame(raf);box.remove()},format:fmt,beep:beepEnd};
}
/* formato clássico: anel com marcações */
function buildRing(box,d){
 const svg=el('svg',{viewBox:'0 0 1000 1000',role:'img','aria-label':'Cronômetro'},null);box.appendChild(svg);
 const defs=el('defs',{},svg),g=el('linearGradient',{id:'iasd-tm-g',x1:'0',y1:'0',x2:'1',y2:'1'},defs);
 el('stop',{offset:'0','stop-color':'var(--c2)'},g);el('stop',{offset:'1','stop-color':'var(--c1)'},g);
 const R=430,C=2*Math.PI*R;
 el('circle',{class:'trk',cx:500,cy:500,r:R},svg);
 const ticks=[];
 for(let i=0;i<60;i++){const a=i/60*2*Math.PI-Math.PI/2,r1=R-46,r2=R-(i%5?64:84);
  ticks.push(el('line',{class:'tk'+(i%5?'':' m'),x1:500+Math.cos(a)*r1,y1:500+Math.sin(a)*r1,x2:500+Math.cos(a)*r2,y2:500+Math.sin(a)*r2},svg))}
 const arc=el('circle',{class:'arc',cx:500,cy:500,r:R,transform:'rotate(-90 500 500)','stroke-dasharray':C,'stroke-dashoffset':0},svg);
 const dot=el('circle',{class:'dot',r:15,cx:500,cy:500-R},svg);
 const ico=el('g',{class:'ico',transform:'translate(500 262)'},svg);
 el('path',{d:'M0-28C-22-42-58-44-82-34V34C-58 24-22 26 0 40C22 26 58 24 82 34V-34C58-44 22-42 0-28ZM0-28V40'},ico);
 const time=el('text',{class:'time',x:500,y:575,'font-size':205},svg);
 const ttl=el('text',{class:'ttl',x:500,y:672,'font-size':46},svg);
 const sub=el('text',{class:'sub',x:500,y:722,'font-size':28},svg);
 const st=el('text',{class:'st',x:500,y:772,'font-size':28},svg);
 ttl.textContent=d.title;sub.textContent=d.subtitle;
 let lastTick=-1;
 return{
  time(txt,change){time.textContent=txt;time.setAttribute('font-size',txt.length>5?'150':'205');if(change&&d.anim==='pulso'){time.style.animation='none';void time.getBoundingClientRect();time.style.animation=''}},
  frac(frac){arc.setAttribute('stroke-dashoffset',String(C*(1-frac)));const ang=frac*2*Math.PI-Math.PI/2;dot.setAttribute('cx',500+Math.cos(ang)*R);dot.setAttribute('cy',500+Math.sin(ang)*R);dot.style.display=frac<=0?'none':'';const on=Math.ceil(frac*60);if(on!==lastTick){ticks.forEach((t,i)=>t.classList.toggle('on',i<on));lastTick=on}},
  status(t){st.textContent=t}
 };
}
/* formatos planos (HTML): digital, cartões, barra e minimalista */
function buildFlat(box,d){
 const wrap=document.createElement('div');wrap.className='tmx '+(d.layout==='minimal'?'min2':d.layout);box.appendChild(wrap);
 const ttl=document.createElement('div');ttl.className='ttl2';ttl.textContent=d.title;
 const sub=document.createElement('div');sub.className='sub2';sub.textContent=d.subtitle;
 const st=document.createElement('div');st.className='st2';
 let timeEl=null,arc=null,segs=null,row=null,pct=null;
 if(d.layout==='cards'){row=document.createElement('div');row.className='row2'}
 else{timeEl=document.createElement('div');timeEl.className='time2'}
 if(d.layout==='bar'||d.layout==='minimal'){const trk=document.createElement('div');trk.className='trk2';arc=document.createElement('div');arc.className='arc2';trk.appendChild(arc);segs=trk}
 if(d.layout==='digital'){segs=document.createElement('div');segs.className='segs';for(let i=0;i<60;i++)segs.appendChild(document.createElement('i'))}
 if(d.layout==='bar'){pct=document.createElement('div');pct.className='pct2'}
 if(d.layout==='cards'){wrap.append(ttl,...(d.subtitle?[sub]:[]),row,st)}
 else if(d.layout==='minimal'){wrap.append(...(d.title?[ttl]:[]),timeEl,segs,st)}
 else if(d.layout==='bar'){wrap.append(ttl,...(d.subtitle?[sub]:[]),timeEl,segs,pct,st)}
 else{wrap.append(ttl,...(d.subtitle?[sub]:[]),timeEl,segs,st)}
 let lastOn=-1,cards=[],lastShape='';
 function setCards(txt,animate){
  const shape=txt.replace(/\d/g,'9');
  if(shape!==lastShape){row.replaceChildren();cards=[];[...txt].forEach(ch=>{if(ch===':'){const s=document.createElement('span');s.className='sep2';s.textContent=':';row.appendChild(s);cards.push(null)}else{const c=document.createElement('div');c.className='card2';const i=document.createElement('i');i.textContent=ch;c.appendChild(i);row.appendChild(c);cards.push(c)}});lastShape=shape;return}
  [...txt].forEach((ch,k)=>{const c=cards[k];if(!c)return;const i=c.firstChild;if(i.textContent!==ch){i.textContent=ch;if(animate&&d.anim!=='nenhuma'){c.classList.remove('flip');void c.offsetWidth;c.classList.add('flip')}}})
 }
 return{
  time(txt,change){if(row)setCards(txt,change);else timeEl.textContent=txt},
  frac(frac){
   if(arc)arc.style.transform='scaleX('+frac.toFixed(4)+')';
   if(pct)pct.textContent=Math.round(frac*100)+'%';
   if(d.layout==='digital'){const on=Math.ceil(frac*60);if(on!==lastOn){[...segs.children].forEach((s,i)=>s.classList.toggle('on',i<on));lastOn=on}}
  },
  status(t){st.textContent=t}
 };
}
window.IASDTimerDisplay=Object.freeze({mount,beep:beepEnd,format:fmt,clean,themes:THEMES,defaultTheme:DEFAULT_THEME,layouts:LAYOUTS,anims:ANIMS,fonts:FONTS,deco});
})();
