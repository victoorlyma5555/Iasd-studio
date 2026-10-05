/* Cronômetro projetável do IASD APP.
   Uso: IASDTimerDisplay.mount(elemento, dados) -> { stop() }
   dados: { title, subtitle, total (s), state: 'idle'|'running'|'paused', remaining (s), endsAt (ms epoch), warn (s), alert (s) }
   A tela calcula o tempo sozinha a partir de endsAt: o Studio só envia quando algo muda. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const THEMES={
 noturno:{name:'Noturno Dourado',bg:'radial-gradient(ellipse at 50% 28%,#1d2760 0%,#0b1029 58%,#04060f 100%)',c1:'#c9a24a',c2:'#f5e3a6',glow:'rgba(214,170,80,.4)',pat:'dust'},
 esmeralda:{name:'Esmeralda',bg:'radial-gradient(ellipse at 50% 28%,#124b40 0%,#072a24 58%,#02100d 100%)',c1:'#34d399',c2:'#b7f5db',glow:'rgba(52,211,153,.4)',pat:'ribbon'},
 ouro:{name:'Ouro Real',bg:'radial-gradient(ellipse at 50% 30%,#35290f 0%,#14100a 60%,#060503 100%)',c1:'#d4a73d',c2:'#fde9a2',glow:'rgba(212,167,61,.42)',pat:'shine'},
 vinho:{name:'Vinho',bg:'radial-gradient(ellipse at 50% 28%,#5a1630 0%,#2a0a18 58%,#0c0308 100%)',c1:'#e9a08f',c2:'#fde2d9',glow:'rgba(233,160,143,.38)',pat:'pulse'},
 aurora:{name:'Aurora',bg:'linear-gradient(135deg,#0c2f52 0%,#3a1f63 52%,#0a1a33 100%)',c1:'#5cc8f5',c2:'#d6c8ff',glow:'rgba(120,170,255,.42)',pat:'borealis'},
 grafite:{name:'Grafite',bg:'radial-gradient(ellipse at 50% 28%,#2c313c 0%,#14171d 60%,#07080b 100%)',c1:'#94a3b8',c2:'#e8edf4',glow:'rgba(148,163,184,.3)',pat:'stripes'},
 pergaminho:{name:'Pergaminho (claro)',bg:'radial-gradient(ellipse at 50% 35%,#fff8e8 0%,#f0e0bd 65%,#dcc797 100%)',c1:'#9a6418',c2:'#c58a2b',glow:'rgba(154,100,24,.22)',tx:'#2a1f0c',trk:'rgba(60,40,10,.12)',tk:'rgba(60,40,10,.3)',sh1:'rgba(255,255,255,.5)',sh2:'rgba(120,80,20,.08)',pat:'candle'},
 safira:{name:'Safira Real',bg:'radial-gradient(ellipse at 50% 26%,#1d3f94 0%,#0d1f55 56%,#050b24 100%)',c1:'#7aa2ff',c2:'#dbe6ff',glow:'rgba(122,162,255,.42)',pat:'facets'},
 oceano:{name:'Oceano Profundo',bg:'linear-gradient(160deg,#0b5a6b 0%,#083a52 50%,#03182b 100%)',c1:'#2dd4d4',c2:'#c8fbff',glow:'rgba(45,212,212,.4)',pat:'waves'},
 floresta:{name:'Floresta',bg:'radial-gradient(ellipse at 50% 28%,#1f5a2b 0%,#0d2f17 58%,#041008 100%)',c1:'#86d38a',c2:'#e3f9d8',glow:'rgba(134,211,138,.36)',pat:'fireflies'},
 imperial:{name:'Roxo Imperial',bg:'radial-gradient(ellipse at 50% 26%,#4a1f8a 0%,#22104d 56%,#090320 100%)',c1:'#c4a3ff',c2:'#f1e6ff',glow:'rgba(196,163,255,.42)',pat:'ripple'},
 rose:{name:'Rosé ao Anoitecer',bg:'linear-gradient(145deg,#6b2a66 0%,#3b1454 52%,#13071f 100%)',c1:'#f59fb8',c2:'#ffe0ea',glow:'rgba(245,159,184,.4)',pat:'float'},
 cobre:{name:'Cobre e Noite',bg:'radial-gradient(ellipse at 50% 30%,#4a2415 0%,#20100a 60%,#090403 100%)',c1:'#e08a4f',c2:'#ffd9b8',glow:'rgba(224,138,79,.4)',pat:'sparks'},
 amanhecer:{name:'Amanhecer',bg:'linear-gradient(165deg,#2b1650 0%,#7b2f6e 46%,#dd6a52 100%)',c1:'#ffc27a',c2:'#fff0d6',glow:'rgba(255,194,122,.44)',pat:'dawn'},
 lavanda:{name:'Lavanda (claro)',bg:'radial-gradient(ellipse at 50% 35%,#f6f1ff 0%,#dfd4fb 62%,#c3b3f0 100%)',c1:'#6d4fd1',c2:'#8b6cf0',glow:'rgba(109,79,209,.22)',tx:'#241a4c',trk:'rgba(40,25,90,.12)',tk:'rgba(40,25,90,.3)',sh1:'rgba(255,255,255,.55)',sh2:'rgba(70,40,150,.08)',pat:'blobs'},
 ceu:{name:'Céu de Manhã (claro)',bg:'radial-gradient(ellipse at 50% 32%,#f2faff 0%,#cfe8fb 62%,#a8d1f2 100%)',c1:'#1d6fb8',c2:'#2f8fd8',glow:'rgba(29,111,184,.22)',tx:'#0e2a47',trk:'rgba(14,42,71,.12)',tk:'rgba(14,42,71,.3)',sh1:'rgba(255,255,255,.55)',sh2:'rgba(20,80,140,.08)',pat:'clouds'},
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
/* ===== Fundos animados por tema (CSS puro; só transform/opacity para não pesar) ===== */
.iasd-deco[data-pat]:before,.iasd-deco[data-pat]:after{pointer-events:none}
.iasd-deco[data-off],.iasd-deco[data-off]:before,.iasd-deco[data-off]:after{animation:none!important}
/* poeira dourada subindo (Noturno Dourado) */
.iasd-deco[data-pat="dust"]:before,.iasd-deco[data-pat="dust"]:after{content:'';position:absolute;left:0;right:0;top:0;height:200vh;animation:decoUp 60s linear infinite;opacity:.8;background:radial-gradient(circle at 20% 30%,var(--c2) 0 .28vmin,transparent .5vmin) 0 0/25vh 25vh,radial-gradient(circle at 70% 60%,var(--c1) 0 .35vmin,transparent .6vmin) 0 0/25vh 25vh,radial-gradient(circle at 45% 85%,var(--c2) 0 .22vmin,transparent .45vmin) 0 0/25vh 25vh,radial-gradient(circle at 88% 12%,var(--c1) 0 .3vmin,transparent .55vmin) 0 0/25vh 25vh}
.iasd-deco[data-pat="dust"]:after{animation-duration:90s;opacity:.45;background-size:50vh 50vh,50vh 50vh,50vh 50vh,50vh 50vh;transform:translateX(7vw)}
@keyframes decoUp{to{transform:translateY(-100vh)}}
/* fitas de luz deslizando (Esmeralda) */
.iasd-deco[data-pat="ribbon"]:before,.iasd-deco[data-pat="ribbon"]:after{content:'';position:absolute;top:-10%;bottom:-10%;left:-30%;width:160%;background:linear-gradient(100deg,transparent 18%,color-mix(in srgb,var(--c1) 26%,transparent) 36%,transparent 52%),linear-gradient(100deg,transparent 52%,color-mix(in srgb,var(--c2) 16%,transparent) 66%,transparent 80%);animation:decoSway 16s ease-in-out infinite alternate}
.iasd-deco[data-pat="ribbon"]:after{transform:scaleX(-1);animation-duration:23s;animation-delay:-9s;opacity:.7}
@keyframes decoSway{from{transform:translateX(-14%) skewX(-6deg)}to{transform:translateX(14%) skewX(6deg)}}
.iasd-deco[data-pat="ribbon"]:after{animation-name:decoSway2}
@keyframes decoSway2{from{transform:scaleX(-1) translateX(-12%) skewX(5deg)}to{transform:scaleX(-1) translateX(12%) skewX(-5deg)}}
/* brilho que atravessa a tela (Ouro Real, Vitral) */
.iasd-deco[data-pat="shine"]:before{content:'';position:absolute;top:-10%;bottom:-10%;left:0;width:45%;background:linear-gradient(105deg,transparent 30%,color-mix(in srgb,var(--c2) 34%,transparent) 50%,transparent 70%);transform:translateX(-130%) skewX(-12deg);animation:decoShine 9s ease-in-out infinite}
@keyframes decoShine{0%,25%{transform:translateX(-130%) skewX(-12deg)}75%,100%{transform:translateX(330%) skewX(-12deg)}}
/* respiração de luz + pétalas (Vinho) */
.iasd-deco[data-pat="pulse"]:before{content:'';position:absolute;inset:-10%;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--c1) 26%,transparent),transparent 58%);animation:decoPulse 7s ease-in-out infinite alternate}
.iasd-deco[data-pat="pulse"]:after{content:'';position:absolute;left:0;right:0;top:0;height:200vh;opacity:.5;background:radial-gradient(ellipse 1vmin .6vmin at 25% 40%,var(--c1),transparent) 0 0/33vh 33vh,radial-gradient(ellipse 1.2vmin .7vmin at 75% 75%,var(--c2),transparent) 0 0/50vh 50vh;animation:decoUp 70s linear infinite}
@keyframes decoPulse{from{transform:scale(.85);opacity:.55}to{transform:scale(1.15);opacity:1}}
/* cortinas de aurora boreal (Aurora) */
.iasd-deco[data-pat="borealis"]:before,.iasd-deco[data-pat="borealis"]:after{content:'';position:absolute;top:-5%;bottom:20%;left:-10%;width:120%;-webkit-mask-image:linear-gradient(180deg,#000 10%,transparent 95%);mask-image:linear-gradient(180deg,#000 10%,transparent 95%);background:linear-gradient(90deg,transparent 8%,color-mix(in srgb,var(--c1) 34%,transparent) 16%,transparent 26%),linear-gradient(90deg,transparent 40%,color-mix(in srgb,var(--c2) 28%,transparent) 50%,transparent 62%),linear-gradient(90deg,transparent 70%,color-mix(in srgb,var(--c1) 30%,transparent) 80%,transparent 92%);transform-origin:50% 100%;animation:decoCurtain 12s ease-in-out infinite alternate}
.iasd-deco[data-pat="borealis"]:after{animation-duration:17s;animation-delay:-6s;opacity:.65;transform:scaleX(-1)}
@keyframes decoCurtain{from{transform:translateX(-6%) skewX(-9deg) scaleY(.9)}to{transform:translateX(6%) skewX(9deg) scaleY(1.08)}}
.iasd-deco[data-pat="borealis"]:after{animation-name:decoCurtain2}
@keyframes decoCurtain2{from{transform:scaleX(-1) translateX(5%) skewX(8deg) scaleY(1.05)}to{transform:scaleX(-1) translateX(-5%) skewX(-8deg) scaleY(.88)}}
/* listras diagonais correndo (Grafite) */
.iasd-deco[data-pat="stripes"]:before{content:'';position:absolute;top:0;bottom:0;left:-20vmin;right:0;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--c2) 7%,transparent) 0 3vmin,transparent 3vmin 6vmin);animation:decoStripe 7s linear infinite}
@keyframes decoStripe{to{transform:translateX(8.485vmin)}}
/* luz de vela oscilando + poeira (Pergaminho) */
.iasd-deco[data-pat="candle"]:before{content:'';position:absolute;inset:-10%;background:radial-gradient(ellipse at 50% 62%,rgba(255,196,96,.34),transparent 66%);animation:decoFlick 5s steps(1,end) infinite}
.iasd-deco[data-pat="candle"]:after{content:'';position:absolute;left:0;right:0;top:0;height:200vh;opacity:.55;background:radial-gradient(circle at 30% 30%,rgba(120,80,20,.5) 0 .25vmin,transparent .45vmin) 0 0/25vh 25vh,radial-gradient(circle at 75% 70%,rgba(120,80,20,.4) 0 .3vmin,transparent .5vmin) 0 0/50vh 50vh;animation:decoUp 80s linear infinite}
@keyframes decoFlick{0%{opacity:.85}12%{opacity:.6}25%{opacity:.95}38%{opacity:.7}52%{opacity:1}66%{opacity:.65}80%{opacity:.9}92%{opacity:.75}100%{opacity:.85}}
/* facetas de joia girando (Safira) */
.iasd-deco[data-pat="facets"]:before{content:'';position:absolute;left:50%;top:50%;width:230vmax;height:230vmax;margin:-115vmax 0 0 -115vmax;background:conic-gradient(from 0deg,transparent 0 12deg,color-mix(in srgb,var(--c2) 22%,transparent) 22deg,transparent 34deg 70deg,color-mix(in srgb,var(--c1) 20%,transparent) 84deg,transparent 98deg 150deg,color-mix(in srgb,var(--c2) 18%,transparent) 160deg,transparent 175deg 230deg,color-mix(in srgb,var(--c1) 22%,transparent) 245deg,transparent 262deg 320deg,color-mix(in srgb,var(--c2) 16%,transparent) 332deg,transparent 346deg);animation:decoSpin 90s linear infinite;-webkit-mask-image:radial-gradient(circle,transparent 4%,#000 24%,#000 100%);mask-image:radial-gradient(circle,transparent 4%,#000 24%,#000 100%)}
@keyframes decoSpin{to{transform:rotate(360deg)}}
/* ondas e bolhas (Oceano) */
.iasd-deco[data-pat="waves"]:before{content:'';position:absolute;left:-12vmin;right:0;top:55%;bottom:0;background:radial-gradient(circle at 50% 100%,transparent 0 3.4vmin,rgba(255,255,255,.09) 3.5vmin 4vmin,transparent 4.2vmin) 0 0/12vmin 7vmin,radial-gradient(circle at 50% 100%,transparent 0 2.4vmin,color-mix(in srgb,var(--c1) 16%,transparent) 2.5vmin 3vmin,transparent 3.2vmin) 6vmin 3.5vmin/12vmin 7vmin;animation:decoWave 9s linear infinite}
@keyframes decoWave{to{transform:translateX(12vmin)}}
.iasd-deco[data-pat="waves"]:after{content:'';position:absolute;left:0;right:0;top:0;height:200vh;opacity:.55;background:radial-gradient(circle at 30% 70%,transparent 0 .7vmin,rgba(255,255,255,.35) .8vmin .95vmin,transparent 1.1vmin) 0 0/25vh 25vh,radial-gradient(circle at 72% 30%,transparent 0 .45vmin,rgba(255,255,255,.3) .55vmin .7vmin,transparent .85vmin) 0 0/50vh 50vh;animation:decoUp 45s linear infinite}
/* vaga-lumes (Floresta) */
.iasd-deco[data-pat="fireflies"]:before,.iasd-deco[data-pat="fireflies"]:after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 18% 70%,#f6ff9a 0 .3vmin,rgba(246,255,154,.3) .55vmin,transparent 1.3vmin),radial-gradient(circle at 42% 40%,#f6ff9a 0 .25vmin,rgba(246,255,154,.3) .5vmin,transparent 1.2vmin),radial-gradient(circle at 66% 78%,#f6ff9a 0 .3vmin,rgba(246,255,154,.3) .55vmin,transparent 1.3vmin),radial-gradient(circle at 84% 34%,#f6ff9a 0 .25vmin,rgba(246,255,154,.3) .5vmin,transparent 1.2vmin),radial-gradient(circle at 54% 14%,#f6ff9a 0 .2vmin,rgba(246,255,154,.3) .45vmin,transparent 1.1vmin);animation:decoFly 9s ease-in-out infinite alternate}
.iasd-deco[data-pat="fireflies"]:after{transform:translate(-9vmin,5vmin) scale(.9);animation-duration:13s;animation-delay:-5s}
@keyframes decoFly{0%{transform:translate(0,0);opacity:.25}35%{opacity:1}70%{opacity:.4}100%{transform:translate(5vmin,-7vmin);opacity:.95}}
/* ondas de luz saindo do centro (Roxo Imperial) */
.iasd-deco[data-pat="ripple"]:before,.iasd-deco[data-pat="ripple"]:after{content:'';position:absolute;left:50%;top:50%;width:70vmin;height:70vmin;margin:-35vmin 0 0 -35vmin;border-radius:50%;border:.5vmin solid color-mix(in srgb,var(--c1) 55%,transparent);box-shadow:0 0 4vmin color-mix(in srgb,var(--c1) 30%,transparent) inset;opacity:0;animation:decoRing 10s ease-out infinite}
.iasd-deco[data-pat="ripple"]:after{animation-delay:-5s}
@keyframes decoRing{0%{transform:scale(.15);opacity:.9}100%{transform:scale(2.6);opacity:0}}
/* bolhas suaves flutuando (Rosé) */
.iasd-deco[data-pat="float"]:before,.iasd-deco[data-pat="float"]:after{content:'';position:absolute;left:0;right:0;top:0;height:200vh;animation:decoUp 50s linear infinite;opacity:.8;background:radial-gradient(circle at 22% 40%,color-mix(in srgb,var(--c1) 22%,transparent) 0 3.2vmin,transparent 3.5vmin) 0 0/50vh 50vh,radial-gradient(circle at 72% 72%,color-mix(in srgb,var(--c2) 16%,transparent) 0 5vmin,transparent 5.3vmin) 0 0/50vh 50vh,radial-gradient(circle at 48% 12%,color-mix(in srgb,var(--c1) 18%,transparent) 0 2vmin,transparent 2.3vmin) 0 0/25vh 25vh}
.iasd-deco[data-pat="float"]:after{animation-duration:75s;opacity:.5;transform:translateX(-12vw);background-size:100vh 100vh,100vh 100vh,50vh 50vh}
/* faíscas subindo (Cobre) */
.iasd-deco[data-pat="sparks"]:before,.iasd-deco[data-pat="sparks"]:after{content:'';position:absolute;left:0;right:0;top:0;height:200vh;animation:decoUp 22s linear infinite;background:radial-gradient(circle at 15% 25%,#ffb36b 0 .28vmin,transparent .5vmin) 0 0/25vh 25vh,radial-gradient(circle at 60% 70%,#ff8a3c 0 .35vmin,transparent .6vmin) 0 0/25vh 25vh,radial-gradient(circle at 85% 40%,#ffd9b8 0 .22vmin,transparent .45vmin) 0 0/25vh 25vh,radial-gradient(circle at 38% 90%,#ff8a3c 0 .3vmin,transparent .55vmin) 0 0/25vh 25vh}
.iasd-deco[data-pat="sparks"]:after{animation-duration:34s;transform:translateX(9vw);background-size:50vh 50vh,50vh 50vh,50vh 50vh,50vh 50vh;opacity:.7}
/* sol nascendo com raios girando (Amanhecer) */
.iasd-deco[data-pat="dawn"]:before{content:'';position:absolute;left:50%;top:112%;width:260vmax;height:260vmax;margin:-130vmax 0 0 -130vmax;background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--c1) 22%,transparent) 0 5deg,transparent 5deg 14deg);-webkit-mask-image:radial-gradient(circle,#000 0,transparent 36%);mask-image:radial-gradient(circle,#000 0,transparent 36%);animation:decoSpin 160s linear infinite}
.iasd-deco[data-pat="dawn"]:after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 100%,color-mix(in srgb,var(--c2) 55%,transparent) 0 12vmin,transparent 55vmin);animation:decoPulse 8s ease-in-out infinite alternate;transform-origin:50% 100%}
/* manchas de cor à deriva (Lavanda) */
.iasd-deco[data-pat="blobs"]:before,.iasd-deco[data-pat="blobs"]:after{content:'';position:absolute;inset:-15%;background:radial-gradient(circle at 25% 30%,color-mix(in srgb,var(--c1) 22%,transparent) 0 18vmin,transparent 36vmin),radial-gradient(circle at 78% 70%,color-mix(in srgb,var(--c2) 22%,transparent) 0 22vmin,transparent 40vmin);animation:decoDrift 19s ease-in-out infinite alternate}
.iasd-deco[data-pat="blobs"]:after{animation-duration:27s;animation-delay:-11s;opacity:.7;transform:rotate(180deg)}
@keyframes decoDrift{from{transform:translate(-5%,3%) rotate(0deg) scale(1)}to{transform:translate(5%,-4%) rotate(25deg) scale(1.12)}}
.iasd-deco[data-pat="blobs"]:after{animation-name:decoDrift2}
@keyframes decoDrift2{from{transform:rotate(180deg) translate(4%,-3%) scale(1.1)}to{transform:rotate(150deg) translate(-5%,4%) scale(.96)}}
/* nuvens passando (Céu de Manhã) */
.iasd-deco[data-pat="clouds"]:before,.iasd-deco[data-pat="clouds"]:after{content:'';position:absolute;top:0;bottom:0;left:0;width:200vw;background:radial-gradient(ellipse 14vw 5vh at 20% 22%,rgba(255,255,255,.75),transparent),radial-gradient(ellipse 10vw 4vh at 24% 25%,rgba(255,255,255,.6),transparent),radial-gradient(ellipse 16vw 6vh at 62% 58%,rgba(255,255,255,.65),transparent),radial-gradient(ellipse 11vw 4vh at 80% 18%,rgba(255,255,255,.6),transparent),radial-gradient(ellipse 13vw 5vh at 45% 82%,rgba(255,255,255,.55),transparent);background-size:100vw 100%;animation:decoCloud 80s linear infinite}
.iasd-deco[data-pat="clouds"]:after{opacity:.6;animation-duration:130s;transform:scale(1,-1);background-position:30vw 0}
@keyframes decoCloud{to{transform:translateX(-100vw)}}
.iasd-deco[data-pat="clouds"]:after{animation-name:decoCloud2}
@keyframes decoCloud2{from{transform:scale(1,-1) translateX(0)}to{transform:scale(1,-1) translateX(-100vw)}}
/* temas que já tinham fundo parado ganham movimento leve */
.iasd-deco[data-pat="scan"]:before{content:'';position:absolute;left:0;right:0;top:-20vh;height:20vh;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--c1) 14%,transparent),transparent);animation:decoScan 7s linear infinite}
@keyframes decoScan{to{transform:translateY(130vh)}}
.iasd-deco[data-pat="diamonds"]:before{content:'';position:absolute;top:-10%;bottom:-10%;left:0;width:40%;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.14) 50%,transparent 70%);transform:translateX(-130%) skewX(-12deg);animation:decoShine 11s ease-in-out infinite}
.iasd-deco[data-pat="sun"]{animation:decoBreath 6s ease-in-out infinite alternate;transform-origin:50% 82%}
.iasd-deco[data-pat="frame"]{animation:decoFrame 5s ease-in-out infinite alternate}
@keyframes decoFrame{from{opacity:.5}to{opacity:.95}}
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
function deco(themeId){const off=/~0$/.test(String(themeId||''));themeId=String(themeId||'').split('~')[0];const t=THEMES[themeId];if(!t||!t.pat)return null;if(!document.getElementById('iasd-deco-css')){const st=document.createElement('style');st.id='iasd-deco-css';st.textContent=DECO_CSS;document.head.appendChild(st)}const d=document.createElement('div');d.className='iasd-deco';d.dataset.pat=t.pat;if(off)d.dataset.off='1';d.setAttribute('aria-hidden','true');return d}
const LAYOUTS={ring:'Anel',digital:'Digital',cards:'Cartões',bar:'Barra',minimal:'Minimalista',neonsign:'Néon',radar:'Radar',liquido:'Líquido',pulsar:'Pulsar',orbita:'Órbita',codigo:'Terminal',listras:'Listras',blocos:'Blocos',ondas:'Ondas',placar:'Placar'};
const FXL=['neonsign','radar','liquido','pulsar','orbita','codigo','listras','blocos','ondas','placar'];
const ANIMS={suave:'Suave',pulso:'Pulso',neon:'Neon',tremor:'Tremor',nenhuma:'Sem animação'};

const CSS_L=`
.iasd-tm .tmx.fx{gap:2.6cqh}
.iasd-tm .fx .stg{position:relative;display:grid;place-items:center}
.iasd-tm .fx .time2{position:relative;z-index:2}
/* Néon: letreiro piscando */
.iasd-tm .fx.neonsign .time2{font-size:min(34cqh,21cqw);color:var(--c2);text-shadow:0 0 .06em #fff,0 0 .2em var(--c2),0 0 .5em var(--c1),0 0 1em var(--glow);animation:lyFlick 5s linear infinite}
.iasd-tm .fx.neonsign .ln{width:min(70cqw,140cqh);height:.8cqh;border-radius:9px;background:var(--c2);box-shadow:0 0 1.2cqh var(--c2),0 0 3.4cqh var(--c1);transform-origin:left;transform:scaleX(var(--f,1));transition:transform .25s linear}
@keyframes lyFlick{0%,19%,21%,62%,64%,100%{opacity:1}20%,63%{opacity:.35}22%{opacity:.8}}
/* Radar: varredura girando */
.iasd-tm .fx.radar .stg{width:min(64cqh,64cqw);aspect-ratio:1}
.iasd-tm .fx.radar .rd{position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 11%,var(--trk) 11.4% 12%),var(--cdb,rgba(0,0,0,.25));overflow:hidden}
.iasd-tm .fx.radar .rd:before{content:'';position:absolute;inset:0;background:conic-gradient(from 0deg,transparent 0 75%,var(--c1) 100%);opacity:.55;animation:lySpin 3.2s linear infinite}
.iasd-tm .fx.radar .pg{position:absolute;inset:0;border-radius:50%;background:conic-gradient(var(--c2) calc(var(--f,1)*360deg),transparent 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 1.8cqh),#000 calc(100% - 1.8cqh));mask:radial-gradient(farthest-side,transparent calc(100% - 1.8cqh),#000 calc(100% - 1.8cqh))}
.iasd-tm .fx.radar .time2{font-size:min(15cqh,11cqw)}
@keyframes lySpin{to{transform:rotate(360deg)}}
/* Líquido: círculo que esvazia com ondas */
.iasd-tm .fx.liquido .stg{width:min(60cqh,60cqw);aspect-ratio:1;border-radius:50%;overflow:hidden;border:.7cqh solid var(--c2);background:var(--trk)}
.iasd-tm .fx.liquido .lq{position:absolute;left:0;right:0;bottom:0;height:calc(var(--f,1)*100%);background:linear-gradient(180deg,var(--c2),var(--c1));transition:height .4s linear}
.iasd-tm .fx.liquido .lq:before,.iasd-tm .fx.liquido .lq:after{content:'';position:absolute;left:-50%;width:200%;height:14cqh;top:-7cqh;border-radius:42%;background:var(--c2);opacity:.6;animation:lySpin 6s linear infinite}
.iasd-tm .fx.liquido .lq:after{opacity:.35;animation-duration:9s;animation-direction:reverse}
.iasd-tm .fx.liquido .time2{font-size:min(14cqh,10.5cqw);text-shadow:0 .4cqh 1.6cqh rgba(0,0,0,.6);color:#fff}
/* Pulsar: anéis expandindo */
.iasd-tm .fx.pulsar .stg{width:min(64cqh,64cqw);aspect-ratio:1}
.iasd-tm .fx.pulsar .pr{position:absolute;inset:14%;border-radius:50%;border:.5cqh solid var(--c2);opacity:0;animation:lyRing 3.6s ease-out infinite}
.iasd-tm .fx.pulsar .pr:nth-child(2){animation-delay:1.2s}.iasd-tm .fx.pulsar .pr:nth-child(3){animation-delay:2.4s}
.iasd-tm .fx.pulsar .cr{position:absolute;inset:26%;border-radius:50%;background:radial-gradient(circle,var(--c1),transparent 70%);opacity:.5;animation:lyBeat 1.8s ease-in-out infinite}
.iasd-tm .fx.pulsar .time2{font-size:min(17cqh,12.5cqw)}
@keyframes lyRing{0%{transform:scale(.5);opacity:.9}100%{transform:scale(1.5);opacity:0}}
@keyframes lyBeat{50%{transform:scale(1.12);opacity:.8}}
/* Órbita: pontos girando ao redor */
.iasd-tm .fx.orbita .stg{width:min(64cqh,64cqw);aspect-ratio:1}
.iasd-tm .fx.orbita .o1,.iasd-tm .fx.orbita .o2{position:absolute;border-radius:50%;border:.35cqh dashed var(--trk)}
.iasd-tm .fx.orbita .o1{inset:2%;animation:lySpin 14s linear infinite}.iasd-tm .fx.orbita .o2{inset:16%;animation:lySpin 9s linear infinite reverse}
.iasd-tm .fx.orbita .o1:before,.iasd-tm .fx.orbita .o2:before{content:'';position:absolute;top:-1.5cqh;left:50%;width:3cqh;height:3cqh;margin-left:-1.5cqh;border-radius:50%;background:var(--c2);box-shadow:0 0 2cqh var(--c1)}
.iasd-tm .fx.orbita .pg{position:absolute;inset:8%;border-radius:50%;background:conic-gradient(var(--c1) calc(var(--f,1)*360deg),transparent 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 1cqh),#000 calc(100% - 1cqh));mask:radial-gradient(farthest-side,transparent calc(100% - 1cqh),#000 calc(100% - 1cqh));opacity:.9}
.iasd-tm .fx.orbita .time2{font-size:min(15cqh,11cqw)}
/* Terminal: texto de código com cursor */
.iasd-tm .fx.codigo .stg{padding:4cqh 6cqw;border:.4cqh solid var(--c2);border-radius:1.6cqh;background:rgba(0,0,0,.45);overflow:hidden;box-shadow:0 0 3cqh var(--glow)}
.iasd-tm .fx.codigo .stg:before{content:'';position:absolute;left:0;right:0;height:30%;top:-30%;background:linear-gradient(180deg,transparent,rgba(255,255,255,.08),transparent);animation:lyScan 4s linear infinite}
.iasd-tm .fx.codigo .time2{font-family:"JetBrains Mono",ui-monospace,Consolas,monospace;font-size:min(26cqh,16cqw);color:var(--c2);font-weight:700;letter-spacing:.04em}
.iasd-tm .fx.codigo .time2:before{content:'> ';opacity:.6}
.iasd-tm .fx.codigo .time2:after{content:'_';animation:lyBlink 1s steps(1) infinite}
@keyframes lyScan{to{top:130%}}@keyframes lyBlink{50%{opacity:0}}
/* Listras: barra de listras deslizantes */
.iasd-tm .fx.listras .time2{font-size:min(26cqh,16cqw)}
.iasd-tm .fx.listras .tk3{width:min(88cqw,176cqh);height:6cqh;border-radius:99px;background:var(--trk);overflow:hidden}
.iasd-tm .fx.listras .tk3 i{display:block;height:100%;width:100%;transform-origin:left;transform:scaleX(var(--f,1));transition:transform .25s linear;border-radius:99px;background:repeating-linear-gradient(45deg,var(--c1) 0 2.4cqh,var(--c2) 2.4cqh 4.8cqh);background-size:6.8cqh 6.8cqh;animation:lyStripe 1s linear infinite}
@keyframes lyStripe{to{background-position:6.8cqh 0}}
/* Blocos: grade de 20 blocos que apagam */
.iasd-tm .fx.blocos .time2{font-size:min(26cqh,16cqw)}
.iasd-tm .fx.blocos .gr{display:grid;grid-template-columns:repeat(10,1fr);gap:.8cqh;width:min(80cqw,150cqh)}
.iasd-tm .fx.blocos .gr i{height:6cqh;border-radius:1cqh;background:var(--trk);transition:background .4s,transform .4s}
.iasd-tm .fx.blocos .gr i.on{background:linear-gradient(160deg,var(--c2),var(--c1));box-shadow:0 0 1.4cqh var(--glow);animation:lyGlow 2.4s ease-in-out infinite;animation-delay:calc(var(--i)*.12s)}
@keyframes lyGlow{50%{transform:scale(.86);filter:brightness(1.35)}}
/* Ondas: mar subindo/descendo ao fundo */
.iasd-tm .fx.ondas{position:relative}
.iasd-tm .fx.ondas .time2{font-size:min(30cqh,19cqw)}
.iasd-tm .fx.ondas .wv{position:absolute;left:0;right:0;bottom:0;height:36cqh;overflow:hidden;z-index:0;pointer-events:none}
.iasd-tm .fx.ondas .wv div{position:absolute;left:0;right:0;bottom:0;height:100%;transform:translateY(calc((1 - var(--f,1))*80%));transition:transform .4s linear}
.iasd-tm .fx.ondas .wv i{position:absolute;left:0;right:0;bottom:0;height:70%;background-repeat:repeat-x;background-size:50cqh 100%;opacity:.55;animation:lyWave 9s linear infinite}
.iasd-tm .fx.ondas .wv i:nth-child(2){opacity:.35;height:84%;animation-duration:14s;animation-direction:reverse}
.iasd-tm .fx.ondas .wv i{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'%3E%3Cpath d='M0 20 Q25 0 50 20 T100 20 V40 H0Z' fill='%2338bdf8'/%3E%3C/svg%3E")}
@keyframes lyWave{to{background-position:50cqh 0}}
.iasd-tm .tmx.fx.ondas>*:not(.wv){position:relative;z-index:1}
/* Placar: painel de LED âmbar */
.iasd-tm .fx.placar .stg{padding:3cqh 5cqw;border-radius:2cqh;background:#0a0a0c;border:.6cqh solid #2a2a30;box-shadow:inset 0 0 4cqh rgba(0,0,0,.9),0 0 3cqh var(--glow)}
.iasd-tm .fx.placar .ghost{position:absolute;opacity:.09;font:800 min(26cqh,16cqw) "JetBrains Mono",ui-monospace,Consolas,monospace;color:#ff9a1f;letter-spacing:.06em}
.iasd-tm .fx.placar .time2{font-family:"JetBrains Mono",ui-monospace,Consolas,monospace;font-size:min(26cqh,16cqw);letter-spacing:.06em;color:#ff9a1f;text-shadow:0 0 .25em #ff7a00,0 0 .7em rgba(255,122,0,.5)}
.iasd-tm.warn .fx.placar .time2{color:#ffe14d}.iasd-tm.alert .fx.placar .time2,.iasd-tm.done .fx.placar .time2{color:#ff4a3a}
.iasd-tm .fx.placar .cl{animation:lyBlink 1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){.iasd-tm .fx *,.iasd-tm .fx *:before,.iasd-tm .fx *:after{animation:none!important}}
`;
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
  theme:THEMES[String(d.theme).split('~')[0]]?String(d.theme).split('~')[0]:DEFAULT_THEME,
  fxoff:/~0$/.test(String(d.theme||'')),
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
 if(!document.getElementById('iasd-tm-css')){const st=document.createElement('style');st.id='iasd-tm-css';st.textContent=CSS+CSS_FX+CSS_L;document.head.appendChild(st)}
 const th=THEMES[d.theme]||THEMES[DEFAULT_THEME];
 const box=document.createElement('div');box.className='iasd-tm idle an-'+d.anim+(th.font==='thin'?' is-thin':'');box.dataset.theme=d.theme;
 const dc=deco(d.theme+(d.fxoff?'~0':''));if(dc)box.appendChild(dc);
 const ui=d.layout==='ring'?buildRing(box,d):FXL.includes(d.layout)?buildFx(box,d):buildFlat(box,d);
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

/* formatos animados (cada um com sua própria animação) */
function buildFx(box,d){
 const L=d.layout,wrap=document.createElement('div');wrap.className='tmx fx '+L;box.appendChild(wrap);
 const mk=(c,t)=>{const n=document.createElement(t||'div');if(c)n.className=c;return n};
 const ttl=mk('ttl2');ttl.textContent=d.title;const sub=mk('sub2');sub.textContent=d.subtitle;const st=mk('st2');
 const stg=mk('stg'),timeEl=mk('time2');let blocks=null;
 if(L==='radar'){stg.append(mk('rd'),mk('pg'))}
 else if(L==='liquido'){stg.append(mk('lq'))}
 else if(L==='pulsar'){stg.append(mk('pr'),mk('pr'),mk('pr'),mk('cr'))}
 else if(L==='orbita'){stg.append(mk('o1'),mk('o2'),mk('pg'))}
 else if(L==='placar'){const g=mk('ghost');g.textContent='88:88';stg.append(g)}
 stg.append(timeEl);
 const head=[...(d.title?[ttl]:[]),...(d.subtitle?[sub]:[])];
 if(L==='neonsign'){wrap.append(...head,stg,mk('ln'),st)}
 else if(L==='listras'){const t=mk('tk3');t.append(mk('','i'));wrap.append(...head,stg,t,st)}
 else if(L==='blocos'){const g=mk('gr');blocks=[];for(let i=0;i<20;i++){const b=mk('','i');b.style.setProperty('--i',i);g.append(b);blocks.push(b)}wrap.append(...head,stg,g,st)}
 else if(L==='ondas'){const w=mk('wv'),inn=mk('');inn.append(mk('','i'),mk('','i'));w.append(inn);wrap.append(w,...head,stg,st)}
 else wrap.append(...head,stg,st);
 let lastOn=-1;
 return{
  time(txt){if(L==='placar')timeEl.innerHTML=txt.replace(/:/g,'<span class="cl">:</span>');else timeEl.textContent=txt},
  frac(f){wrap.style.setProperty('--f',f.toFixed(4));if(blocks){const on=Math.ceil(f*20);if(on!==lastOn){blocks.forEach((b,i)=>b.classList.toggle('on',i<on));lastOn=on}}},
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
