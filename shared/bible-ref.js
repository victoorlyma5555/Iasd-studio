/* Referência bíblica em um só campo: "João 3:16", "Jo 3 16-18", "Sl 23", "1 co 13:4-7".
   Capítulo ou versículo 0 viram 1 automaticamente. */
(function(){
'use strict';
const ALIAS={gn:'genesis',ex:'exodus',lv:'leviticus',nm:'numbers',dt:'deuteronomy',js:'joshua',jz:'judges',rt:'ruth',jo:'john',jn:'jonah',jl:'joel',jr:'jeremiah',is:'isaiah',ez:'ezekiel',dn:'daniel',os:'hosea',am:'amos',ob:'obadiah',mq:'micah',na:'nahum',hc:'habakkuk',sf:'zephaniah',ag:'haggai',zc:'zechariah',ml:'malachi',mt:'matthew',mc:'mark',lc:'luke',at:'acts',rm:'romans',gl:'galatians',ef:'ephesians',fp:'philippians',cl:'colossians',hb:'hebrews',tg:'james',jd:'jude',ap:'revelation',sl:'psalms',pv:'proverbs',ec:'ecclesiastes',ct:'song of solomon',lm:'lamentations',et:'esther',ed:'ezra',ne:'nehemiah',tt:'titus',fm:'philemon'};
const NUMALIAS={sm:'samuel',rs:'kings',cr:'chronicles',co:'corinthians',ts:'thessalonians',tm:'timothy',pe:'peter',pd:'peter',jo:'john',jn:'john'};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function parse(text,books){
  /* books: [[nomePt, chaveEn], ...] */
  let s=norm(text).replace(/[:.,;]/g,' ').replace(/[–—]/g,'-').replace(/(\d)([a-z])/g,'$1 $2').replace(/([a-z])(\d)/g,'$1 $2').replace(/\s*-\s*/g,'-').replace(/\s+/g,' ').trim();
  if(!s)return null;
  const tokens=s.split(' ');let num='';
  if(/^[1-3]$/.test(tokens[0])&&tokens[1]&&/^[a-z]/.test(tokens[1])){num=tokens.shift()}
  const words=[];while(tokens.length&&/^[a-z]+$/.test(tokens[0]))words.push(tokens.shift());
  if(!words.length)return null;
  const q=words.join(' '),nums=tokens.join(' ').split(' ').filter(Boolean);
  const list=books.map(([pt,en])=>({pt,en,n:norm(pt),e:norm(en)}));
  let hit=null;
  const key=(num?num+' ':'')+q;
  if(!num&&q==='jo'&&/jó/i.test(text))hit=list.find(b=>b.e==='job')||null;
  if(!hit&&!num&&ALIAS[q])hit=list.find(b=>b.e===ALIAS[q])||null;
  if(!hit)hit=list.find(b=>b.n===key||b.e===key)||null;
  
  if(!hit&&num&&NUMALIAS[q.replace(/\s/g,'')])hit=list.find(b=>b.e===num+' '+NUMALIAS[q.replace(/\s/g,'')])||null;
  if(!hit)hit=list.find(b=>b.n.startsWith(key)||b.e.startsWith(key))||null;
  if(!hit&&q.length>=2)hit=list.find(b=>b.n.replace(/ /g,'').startsWith(key.replace(/ /g,''))||b.n.split(' ').some(w=>w.startsWith(q)&&(!num||b.n.startsWith(num))))||null;
  if(!hit)return null;
  let chapter=1,from=null,to=null;
  const rest=nums.join(' ');
  const m=rest.match(/^(\d+)(?:\s+(\d+)(?:-(\d+))?)?$/)||rest.match(/^(\d+)-(\d+)$/);
  if(rest){
    if(!m)return null;
    if(/^\d+-\d+$/.test(rest)){/* "sl 23-25" não é versículo: trata como capítulo e ignora */ chapter=+m[1]}
    else{chapter=+m[1];if(m[2]!==undefined){from=+m[2];to=m[3]!==undefined?+m[3]:null}}
  }
  return normalize({book:hit.en,name:hit.pt,chapter,from,to});
}
/* 0 vira 1; intervalo invertido é corrigido; sem versículo = capítulo inteiro (from=0). */
function normalize(r){
  const o={...r};
  o.chapter=Math.max(1,parseInt(o.chapter,10)||1);
  if(o.from!=null&&o.from!==''){o.from=Math.max(1,parseInt(o.from,10)||1);if(o.to!=null&&o.to!==''&&o.to!==0||o.to===0&&false){o.to=Math.max(1,parseInt(o.to,10)||o.from);if(o.to<o.from){const t=o.from;o.from=o.to;o.to=t}if(o.to===o.from)o.to=0}else o.to=0}
  else{o.from=0;o.to=0}
  return o;
}
window.IASDBibleRef={parse,normalize};
})();
