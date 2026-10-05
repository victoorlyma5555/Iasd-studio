/* Studio de Projeção — modelos visuais da Bíblia no telão (10 modelos + Padrão).
   O botão "Escolher modelo" fica ao lado da tradução e abre um popup com a prévia de cada um.
   O modelo escolhido vai junto com a passagem (campo bt) e vale para as próximas projeções. */
(function(){
'use strict';
const KEY='iasd-bible-tpl';
/* o popup abre na janela principal (centralizado na tela), não dentro do iframe do Studio, que é tão alto quanto a página */
const DOC=(()=>{try{return window.parent&&window.parent!==window?window.parent.document:document}catch(e){return document}})();
const LIST=[
 ['','Padrão','Segue o tema escolhido em Temas'],
 ['pergaminho','Pergaminho','Papel antigo, letras escuras'],
 ['estrelada','Noite estrelada','Céu profundo com estrelas'],
 ['aurora','Aurora','Degradê verde, azul e roxo'],
 ['minimalista','Minimalista','Fundo branco, limpo e leve'],
 ['dourado','Dourado clássico','Preto com moldura dourada'],
 ['amanhecer','Amanhecer','Tons quentes do nascer do sol'],
 ['floresta','Floresta','Verde profundo, letras creme'],
 ['oceano','Oceano','Azul marinho com brilho'],
 ['contraste','Alto contraste','Amarelo no preto, leitura à distância'],
 ['editorial','Editorial','Alinhado à esquerda, com aspas'],
 ['marfim','Marfim','Papel claro com moldura fina'],
 ['vinho','Vinho nobre','Bordô profundo e ouro'],
 ['grafite','Grafite','Cinza escuro sóbrio'],
 ['ceu','Céu claro','Azul bem suave, letras escuras'],
 ['aurora-viva','Aurora viva','Animado: luzes verdes e roxas em movimento'],
 ['estrelas-vivas','Céu em movimento','Animado: estrelas em deriva suave'],
 ['ondas','Ondas','Animado: mar calmo ondulando'],
 ['brasas','Brasas','Animado: faíscas douradas subindo'],
 ['nevoa','Névoa de luz','Animado: orbes de luz flutuando'],
 ['luz-dourada','Brilho dourado','Animado: reflexo de luz passando']
];
const LAY=[['','Centralizado'],['esq','À esquerda'],['topo','Referência no topo'],['quote','Com aspas'],['moldura','Moldura']];
let bl='';try{bl=localStorage.getItem('iasd-bible-lay')||''}catch(e){}
if(!LAY.some(x=>x[0]===bl))bl='';
window.btLay=()=>bl;
let cur='';try{cur=localStorage.getItem(KEY)||''}catch(e){}
if(!LIST.some(x=>x[0]===cur))cur='';
const name=id=>(LIST.find(x=>x[0]===id)||LIST[0])[1];
window.btCur=()=>cur;
const PKEY='iasd-bible-pt';let pg=true;try{pg=localStorage.getItem(PKEY)!=='0'}catch(e){}
window.btPage=()=>pg;
window.btPageToggle=function(){pg=!pg;try{localStorage.setItem(PKEY,pg?'1':'0')}catch(e){}pageLabel();try{window.feedback&&feedback('Virar página: '+(pg?'ligado':'desligado')+'.')}catch(e){}};
function pageLabel(){const b=document.getElementById('btPage'),l=document.getElementById('btPageLabel');if(l)l.textContent='📖 Virar página: '+(pg?'ligado':'desligado');if(b){b.classList.toggle('on',pg);b.setAttribute('aria-pressed',String(pg))}}
function label(){pageLabel();const l=document.getElementById('btOpenLabel');if(l)l.textContent=cur?name(cur):'Escolher modelo';const b=document.getElementById('btOpen');if(b)b.classList.toggle('on',!!cur)}
function pick(id){
 cur=id;try{localStorage.setItem(KEY,id)}catch(e){}
 label();close();
 try{window.stRethemeLive&&stRethemeLive()}catch(e){}
 try{window.feedback&&feedback('Modelo da Bíblia: '+name(id)+'.')}catch(e){}
}
function close(){const o=DOC.getElementById('btPop');if(o){o.classList.remove('on');setTimeout(()=>o.remove(),150)}DOC.removeEventListener('keydown',onKey)}
function onKey(e){if(e.key==='Escape')close()}
function btnCss(){if(document.getElementById('btBtnCss'))return;const s=document.createElement('style');s.id='btBtnCss';s.textContent='.bt-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}'
+'.bt-open{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--bd2,#2a4385);background:var(--sf2,#0f1f3d);color:var(--tx,#e8eefc);font:700 12.5px Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}.bt-open:hover{border-color:#3b82f6}.bt-open.on{border-color:#f59e0b}';document.head.appendChild(s)}
function css(){if(!DOC.getElementById('btTplLink')){const l=DOC.createElement('link');l.id='btTplLink';l.rel='stylesheet';l.href='/shared/bible-templates.css?v=3';DOC.head.appendChild(l)}if(DOC.getElementById('btPopCss'))return;const s=DOC.createElement('style');s.id='btPopCss';s.textContent=
''
+'#btPop{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:16px;background:rgba(2,8,23,.7);backdrop-filter:blur(3px);opacity:0;transition:opacity .15s}#btPop.on{opacity:1}'
+'#btPop .bt-box{width:min(980px,100%);max-height:92vh;display:flex;flex-direction:column;border-radius:18px;background:#0b1730;color:#f4f7ff;border:1px solid rgba(245,183,58,.45);box-shadow:0 24px 70px rgba(0,0,0,.6);font-family:Inter,system-ui,sans-serif}'
+'#btPop .bt-hd{display:flex;align-items:center;gap:12px;padding:16px 18px 10px}#btPop .bt-hd h3{margin:0;font-size:18px;flex:1}#btPop .bt-hd p{margin:2px 0 0;font-size:12.5px;color:#9db0d6;font-weight:500}'
+'#btPop .bt-x{width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:15px;cursor:pointer}'
+'#btPop .bt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;padding:8px 18px 18px;overflow:auto}'
+'#btPop .bt-card{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:7px;padding:8px;border-radius:13px;border:2px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);cursor:pointer;transition:.15s}'
+'#btPop .bt-card:hover{border-color:#5b8cff;transform:translateY(-2px)}#btPop .bt-card:focus-visible{outline:2px solid #5b8cff}#btPop .bt-card.sel{border-color:#f59e0b;background:rgba(245,158,11,.1)}'
+'#btPop .bt-card b{font-size:13.5px;display:flex;align-items:center;gap:6px}#btPop .bt-card b i{font-style:normal;font-size:11px;font-weight:800;color:#f59e0b;margin-left:auto}#btPop .bt-lay{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:0 4px 10px}#btPop .bt-lay b{font-size:12px;color:#9db0d6;margin-right:4px}#btPop .bt-lay button{padding:6px 12px;border-radius:999px;border:1px solid #2a4385;background:#0f1f3d;color:#e8eefc;font:700 12px Inter,system-ui,sans-serif;cursor:pointer}#btPop .bt-lay button.on{background:#f59e0b!important;color:#111!important;border-color:#f59e0b!important}#btPop .bt-lay{padding-left:14px!important}#btPop .bt-card small{font-size:11.5px;color:#9db0d6;line-height:1.3}'
;DOC.head.appendChild(s)}
function preview(id){
 const d=DOC.createElement('div');d.className='btp bt-'+(id||'default')+(bl?' bl-'+bl:'');
 const a=DOC.createElement('article');a.className='bible-slide';
 const t=DOC.createElement('p');t.className='bible-text';t.textContent='Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.';
 const r=DOC.createElement('div');r.className='bible-reference';r.textContent='Salmos 119:105';
 const v=DOC.createElement('div');v.className='bible-version';v.textContent='João Ferreira de Almeida';
 a.append(t,r,v);d.append(a);return d}
window.btOpen=function(){
 if(DOC.getElementById('btPop'))return;css();
 const o=DOC.createElement('div');o.id='btPop';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Escolher modelo da Bíblia');
 const box=DOC.createElement('div');box.className='bt-box';
 const hd=DOC.createElement('div');hd.className='bt-hd';
 const ttl=DOC.createElement('div');ttl.style.flex='1';ttl.innerHTML='<h3>Modelo da Bíblia no telão</h3><p>Escolha como as passagens aparecem. A troca vale também para o que já está no telão.</p>';
 const x=DOC.createElement('button');x.type='button';x.className='bt-x';x.setAttribute('aria-label','Fechar');x.textContent='✕';x.onclick=close;
 hd.append(ttl,x);
 const grid=DOC.createElement('div');grid.className='bt-grid';
 LIST.forEach(([id,nm,ds])=>{
  const c=DOC.createElement('button');c.type='button';c.className='bt-card'+(id===cur?' sel':'');
  const b=DOC.createElement('b');b.textContent=nm;if(id===cur){const i=DOC.createElement('i');i.textContent='EM USO';b.append(i)}
  const sm=DOC.createElement('small');sm.textContent=ds;
  c.append(preview(id),b,sm);c.onclick=()=>pick(id);grid.append(c)});
 const lay=DOC.createElement('div');lay.className='bt-lay';lay.innerHTML='<b>Disposição</b>';LAY.forEach(([k,nm])=>{const c=DOC.createElement('button');c.type='button';c.textContent=nm;if(k===bl)c.className='on';c.onclick=()=>{bl=k;try{localStorage.setItem('iasd-bible-lay',k)}catch(e){}lay.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===c));grid.querySelectorAll('.btp').forEach(pv=>{[...pv.classList].filter(x=>x.startsWith('bl-')).forEach(x=>pv.classList.remove(x));if(k)pv.classList.add('bl-'+k)});try{window.stRethemeLive&&stRethemeLive()}catch(e){}};lay.append(c)});
 box.append(hd,lay,grid);o.append(box);o.addEventListener('click',e=>{if(e.target===o)close()});
 DOC.body.append(o);requestAnimationFrame(()=>o.classList.add('on'));DOC.addEventListener('keydown',onKey);
 const sel=grid.querySelector('.sel');if(sel)sel.focus()};
btnCss();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',label);else label();
})();
