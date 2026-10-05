/* Studio de Projeção — PowerPoint: importa .pptx, converte cada slide em imagem (no navegador, sem servidor),
   salva no site (Supabase) e projeta slide a slide. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
if(!$('ppt'))return;
const BUCKET='iasd-slides',W=1920;
const NS_A='http://schemas.openxmlformats.org/drawingml/2006/main';
const EMU_PT=12700;

/* ---------- ZIP (sem bibliotecas: DecompressionStream) ---------- */
async function readZip(buf){
 const dv=new DataView(buf);let i=buf.byteLength-22;
 while(i>=0&&dv.getUint32(i,true)!==0x06054b50)i--;
 if(i<0)throw Error('Arquivo inválido (não é um .pptx).');
 const n=dv.getUint16(i+10,true),off=dv.getUint32(i+16,true),files={};let p=off;
 for(let k=0;k<n;k++){
  if(dv.getUint32(p,true)!==0x02014b50)break;
  const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lho=dv.getUint32(p+42,true);
  const name=new TextDecoder().decode(new Uint8Array(buf,p+46,nl));
  files[name]={method,csize,lho};p+=46+nl+el+cl;
 }
 return{
  has:n=>!!files[n],names:()=>Object.keys(files),
  async get(name){
   const f=files[name];if(!f)return null;
   const nl=dv.getUint16(f.lho+26,true),el=dv.getUint16(f.lho+28,true),start=f.lho+30+nl+el;
   const raw=new Uint8Array(buf,start,f.csize);
   if(f.method===0)return raw;
   const st=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
   return new Uint8Array(await new Response(st).arrayBuffer());
  },
  async text(name){const b=await this.get(name);return b?new TextDecoder().decode(b):null}
 };
}

/* ---------- XML ---------- */
const parse=s=>new DOMParser().parseFromString(s,'application/xml');
const kids=(e,n)=>e?[...e.children].filter(c=>c.localName===n):[];
const kid=(e,n)=>e?[...e.children].find(c=>c.localName===n)||null:null;
const path=(e,...ns)=>{let c=e;for(const n of ns){c=kid(c,n);if(!c)return null}return c};
const attr=(e,n,d)=>{if(!e)return d;const v=e.getAttribute(n);return v==null?d:v};
const num=(e,n,d)=>{const v=attr(e,n,null);return v==null?d:Number(v)};
function relsOf(rels){const m={};if(!rels)return m;for(const r of parse(rels).getElementsByTagName('Relationship'))m[r.getAttribute('Id')]={type:r.getAttribute('Type'),target:r.getAttribute('Target')};return m}
function resolve(base,target){
 if(target.startsWith('/'))return target.slice(1);
 const parts=base.split('/');parts.pop();
 for(const s of target.split('/')){if(s==='..')parts.pop();else if(s&&s!=='.')parts.push(s)}
 return parts.join('/');
}

/* ---------- cores ---------- */
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return[h,s,l]}
function hsl2rgb(h,s,l){if(s===0){const v=Math.round(l*255);return[v,v,v]}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p};return[Math.round(f(h+1/3)*255),Math.round(f(h)*255),Math.round(f(h-1/3)*255)]}
const hex2rgb=h=>{h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return[parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0]};
const PRESET={black:'000000',white:'ffffff',red:'ff0000',green:'008000',blue:'0000ff',yellow:'ffff00',gray:'808080',grey:'808080',orange:'ffa500',purple:'800080'};

/* ---------- renderizador ---------- */
async function convert(file,onProgress){
 const zip=await readZip(await file.arrayBuffer());
 const pres=parse(await zip.text('ppt/presentation.xml'));
 const sz=pres.getElementsByTagNameNS('*','sldSz')[0];
 const cx=num(sz,'cx',9144000),cy=num(sz,'cy',5143500),H=Math.round(W*cy/cx),S=W/cx;
 const presRels=relsOf(await zip.text('ppt/_rels/presentation.xml.rels'));
 const order=[...pres.getElementsByTagNameNS('*','sldId')].map(e=>presRels[e.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||e.getAttribute('r:id')]).filter(Boolean).map(r=>resolve('ppt/presentation.xml',r.target));
 if(!order.length)throw Error('Nenhum slide encontrado na apresentação.');
 const defTextStyle=path(pres.documentElement,'defaultTextStyle');
 const cache={xml:{},img:{}};
 async function xml(n){if(!cache.xml[n]){const t=await zip.text(n);cache.xml[n]=t?parse(t):null}return cache.xml[n]}
 async function bitmap(n){
  if(n in cache.img)return cache.img[n];
  let bm=null;
  try{const b=await zip.get(n);if(b){const ext=n.split('.').pop().toLowerCase();const type={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',bmp:'image/bmp',svg:'image/svg+xml'}[ext];if(type)bm=await createImageBitmap(new Blob([b],{type}))}}catch(e){bm=null}
  return cache.img[n]=bm;
 }
 /* tema */
 const themeName=Object.keys({}).length;
 let themeXml=null;for(const n of zip.names())if(/^ppt\/theme\/theme\d+\.xml$/.test(n)){themeXml=await xml(n);break}
 const scheme={},fonts={major:'Calibri',minor:'Calibri'};
 if(themeXml){
  const cs=themeXml.getElementsByTagNameNS('*','clrScheme')[0];
  if(cs)for(const c of cs.children){const v=c.firstElementChild;if(!v)continue;scheme[c.localName]=v.localName==='sysClr'?attr(v,'lastClr','000000'):attr(v,'val','000000')}
  const fs=themeXml.getElementsByTagNameNS('*','fontScheme')[0];
  if(fs){const mj=path(fs,'majorFont','latin'),mn=path(fs,'minorFont','latin');if(mj)fonts.major=attr(mj,'typeface','Calibri');if(mn)fonts.minor=attr(mn,'typeface','Calibri')}
 }
 /* mestre: clrMap e estilos de texto */
 const firstMasterRel=Object.values(await relsOfFile('ppt/_rels/presentation.xml.rels')).find(r=>/slideMaster$/.test(r.type));
 async function relsOfFile(n){return relsOf(await zip.text(n))}
 const masterPath=firstMasterRel?resolve('ppt/presentation.xml',firstMasterRel.target):null;
 const clrMap={bg1:'lt1',tx1:'dk1',bg2:'lt2',tx2:'dk2'};
 function pickColor(el,ctxMap){
  if(!el)return null;
  const c=[...el.children].find(k=>['srgbClr','schemeClr','sysClr','prstClr','scrgbClr','hslClr'].includes(k.localName));
  if(!c)return null;
  let rgb=null;
  if(c.localName==='srgbClr')rgb=hex2rgb(attr(c,'val','000000'));
  else if(c.localName==='sysClr')rgb=hex2rgb(attr(c,'lastClr','000000'));
  else if(c.localName==='prstClr')rgb=hex2rgb(PRESET[attr(c,'val','black')]||'000000');
  else if(c.localName==='schemeClr'){let v=attr(c,'val','tx1');const map=ctxMap||clrMap;v=map[v]||v;if(v==='phClr')return null;rgb=hex2rgb(scheme[v]||scheme[{tx1:'dk1',bg1:'lt1'}[v]]||'000000')}
  else return null;
  let alpha=1;
  for(const m of c.children){
   const v=num(m,'val',100000)/100000;
   if(m.localName==='lumMod'||m.localName==='lumOff'||m.localName==='tint'||m.localName==='shade'||m.localName==='satMod'){
    let[h,s,l]=rgb2hsl(...rgb);
    if(m.localName==='lumMod')l*=v;else if(m.localName==='lumOff')l+=v;else if(m.localName==='satMod')s*=v;
    else if(m.localName==='tint')l=l+(1-l)*(1-v);else if(m.localName==='shade')l*=v;
    l=Math.max(0,Math.min(1,l));s=Math.max(0,Math.min(1,s));rgb=hsl2rgb(h,s,l);
   }else if(m.localName==='alpha')alpha=v;
  }
  return alpha<1?`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`:`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
 }
 const master=masterPath?await xml(masterPath):null;
 if(master){const cm=path(master.documentElement,'clrMap');if(cm)for(const a of cm.attributes)clrMap[a.name]=a.value}
 const txStyles=master?path(master.documentElement,'txStyles'):null;
 const fontFace=f=>{f=f||'+mn-lt';if(f==='+mj-lt')f=fonts.major;else if(f==='+mn-lt')f=fonts.minor;return `"${f}", Calibri, Carlito, "Segoe UI", Arial, sans-serif`};

 /* geometria/herança de placeholders */
 function xfrmOf(sp){const spPr=kid(sp,'spPr')||kid(sp,'grpSpPr');const x=spPr&&kid(spPr,'xfrm');if(!x)return null;const off=kid(x,'off'),ext=kid(x,'ext');if(!off||!ext)return null;return{x:num(off,'x',0),y:num(off,'y',0),w:num(ext,'cx',0),h:num(ext,'cy',0),rot:num(x,'rot',0)/60000,fh:attr(x,'flipH','0')==='1',fv:attr(x,'flipV','0')==='1',chOff:kid(x,'chOff')?{x:num(kid(x,'chOff'),'x',0),y:num(kid(x,'chOff'),'y',0)}:null,chExt:kid(x,'chExt')?{w:num(kid(x,'chExt'),'cx',0),h:num(kid(x,'chExt'),'cy',0)}:null}}
 const phOf=sp=>{const nv=kid(sp,'nvSpPr')||kid(sp,'nvPicPr');const ph=nv&&path(nv,'nvPr','ph');return ph?{type:attr(ph,'type','body'),idx:attr(ph,'idx',null)}:null};
 function findPh(tree,ph){
  if(!tree||!ph)return null;
  const list=kids(path(tree.documentElement,'cSld','spTree'),'sp');
  return list.find(s=>{const p=phOf(s);return p&&((ph.idx!=null&&p.idx===ph.idx)||(p.type===ph.type&&(ph.type!=='body'||ph.idx==null)))})||list.find(s=>{const p=phOf(s);return p&&p.type===ph.type})||null;
 }
 function styleFromTx(type){
  if(!txStyles)return null;
  if(type==='title'||type==='ctrTitle')return kid(txStyles,'titleStyle');
  if(['body','subTitle','obj','tbl','chart'].includes(type))return kid(txStyles,'bodyStyle');
  return kid(txStyles,'otherStyle');
 }
 /* mescla propriedades de nível (lvlNpPr) de várias fontes por prioridade */
 function lvlProps(sources,lvl){
  const out={rpr:{}};
  for(const src of sources){
   const l=src&&kid(src,'lvl'+(lvl+1)+'pPr');if(!l)continue;
   for(const k of ['algn','marL','indent'])if(l.hasAttribute(k)&&out[k]==null)out[k]=l.getAttribute(k);
   const ls=kid(l,'lnSpc');if(ls&&out.lnSpc==null){const pc=kid(ls,'spcPct');if(pc)out.lnSpc=num(pc,'val',100000)/100000}
   for(const nm of ['spcBef','spcAft']){const sp=kid(l,nm);if(sp&&out[nm]==null){const pt=kid(sp,'spcPts'),pc=kid(sp,'spcPct');out[nm]=pt?{pt:num(pt,'val',0)/100}:pc?{pct:num(pc,'val',0)/100000}:null}}
   if(out.bu==null){if(kid(l,'buNone'))out.bu='';else if(kid(l,'buChar'))out.bu=attr(kid(l,'buChar'),'char','•');else if(kid(l,'buAutoNum'))out.bu='•'}
   const d=kid(l,'defRPr');if(d){for(const k of ['sz','b','i','u'])if(d.hasAttribute(k)&&out.rpr[k]==null)out.rpr[k]=d.getAttribute(k);const c=pickColor(kid(d,'solidFill'));if(c&&!out.rpr.color)out.rpr.color=c;const lat=kid(d,'latin');if(lat&&!out.rpr.font)out.rpr.font=attr(lat,'typeface',null)}
  }
  return out;
 }
 /* ---------- desenho ---------- */
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
 async function fillOf(spPr,styleEl,rctx){
  if(!spPr)return null;
  if(kid(spPr,'noFill'))return null;
  const sf=kid(spPr,'solidFill');if(sf)return pickColor(sf);
  const gf=kid(spPr,'gradFill');if(gf){const gs=kids(kid(gf,'gsLst'),'gs');if(gs.length){const stops=gs.map(g=>({pos:num(g,'pos',0)/100000,c:pickColor(g)||'#000'}));const lin=kid(gf,'lin');return{grad:stops,ang:lin?num(lin,'ang',0)/60000:90}}}
  const bf=kid(spPr,'blipFill');if(bf){const bl=kid(bf,'blip'),rid=bl&&(bl.getAttribute('r:embed')||bl.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed'));if(rid&&rctx.rels[rid]){const bm=await bitmap(resolve(rctx.path,rctx.rels[rid].target));if(bm)return{img:bm}}}
  if(styleEl){const fr=kid(styleEl,'fillRef');if(fr&&attr(fr,'idx','0')!=='0')return pickColor(fr)}
  return undefined;
 }
 function setFill(f,x,y,w,h){
  if(typeof f==='string'){ctx.fillStyle=f;return true}
  if(f&&f.grad){const a=(f.ang||0)*Math.PI/180,cxm=x+w/2,cym=y+h/2,dx=Math.cos(a)*w/2,dy=Math.sin(a)*h/2;const g=ctx.createLinearGradient(cxm-dx,cym-dy,cxm+dx,cym+dy);f.grad.forEach(s=>g.addColorStop(Math.max(0,Math.min(1,s.pos)),s.c));ctx.fillStyle=g;return true}
  return false;
 }
 function shapePath(prst,x,y,w,h,spPr){
  ctx.beginPath();
  if(prst==='ellipse'){ctx.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,Math.PI*2);return}
  if(prst==='roundRect'||prst==='round2SameRect'||prst==='snipRoundRect'){const av=kid(kid(kid(spPr,'prstGeom'),'avLst')||spPr,'gd');const adj=av?Number(String(attr(av,'fmla','val 16667')).replace(/[^0-9.]/g,''))/100000:.16667;const r=Math.min(w,h)*Math.min(.5,adj||.16667);ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();return}
  if(prst==='triangle'){ctx.moveTo(x+w/2,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath();return}
  ctx.rect(x,y,w,h);
 }
 async function drawBlip(bm,x,y,w,h,srcRect){
  let sx=0,sy=0,sw=bm.width,sh=bm.height;
  if(srcRect){const l=num(srcRect,'l',0)/100000,t=num(srcRect,'t',0)/100000,r=num(srcRect,'r',0)/100000,b=num(srcRect,'b',0)/100000;sx=bm.width*l;sy=bm.height*t;sw=bm.width*(1-l-r);sh=bm.height*(1-t-b)}
  if(sw>0&&sh>0)ctx.drawImage(bm,sx,sy,sw,sh,x,y,w,h);
 }
 /* texto */
 function layoutText(paras,boxW,scale){
  const lines=[];
  for(const P of paras){
   const fs=P.size*scale,marL=(P.marL||0)*S,indent=(P.indent||0)*S;
   const avail=Math.max(10,boxW-marL);
   const toks=[];
   for(const r of P.runs){
    if(r.br){toks.push({br:true,size:r.size*scale});continue}
    const size=r.size*scale;
    const font=`${r.i?'italic ':''}${r.b?'bold ':''}${size}px ${r.font}`;
    ctx.font=font;
    const parts=r.text.split(/(\s+)/).filter(s=>s!=='');
    for(const w of parts)toks.push({text:w,font,color:r.color,u:r.u,size,w:ctx.measureText(w).width});
   }
   const para={lines:[],align:P.algn,spB:P.spB*scale,spA:P.spA*scale,lnSpc:P.lnSpc};
   let cur=null;
   const newLine=first=>({segs:[],w:0,size:fs,first,max:fs});
   cur=newLine(true);
   const startX=first=>marL+(first?indent:0);
   let bulletDone=false;
   const flush=()=>{para.lines.push(cur);cur=newLine(false)};
   for(const t of toks){
    if(t.br){flush();continue}
    const limit=avail-(cur.first?Math.min(0,indent)*0:0);
    if(!/^\s+$/.test(t.text)&&cur.w+t.w>limit-(cur.first?Math.max(0,-indent*S*0):0)&&cur.segs.length){while(cur.segs.length&&/^\s+$/.test(cur.segs[cur.segs.length-1].text)){cur.w-=cur.segs.pop().w}flush()}
    if(/^\s+$/.test(t.text)&&!cur.segs.length)continue;
    cur.segs.push(t);cur.w+=t.w;cur.max=Math.max(cur.max,t.size);
   }
   para.lines.push(cur);
   para.bu=P.bu;para.buSize=fs;para.marL=marL;para.indent=indent;para.buColor=P.runs[0]&&P.runs[0].color;para.buFont=P.runs[0]&&P.runs[0].font;
   lines.push(para);
  }
  return lines;
 }
 const textHeight=ps=>ps.reduce((a,p)=>a+p.spB+p.spA+p.lines.reduce((b,l)=>b+l.max*1.2*(p.lnSpc||1),0),0);
 async function drawText(sp,box,phInfo,rctx,tree){
  const tb=kid(sp,'txBody');if(!tb)return;
  const text=[...tb.getElementsByTagNameNS(NS_A,'t')].map(t=>t.textContent).join('');
  if(!text.trim())return;
  let bp=kid(tb,'bodyPr');
  const phL=phInfo&&findPh(rctx.layout,phInfo),phM=phInfo&&findPh(master?{documentElement:master.documentElement}:null,phInfo);
  const bpL=phL&&path(phL,'txBody','bodyPr'),bpM=phM&&path(phM,'txBody','bodyPr');
  const bpAttr=(n,d)=>{for(const b of [bp,bpL,bpM])if(b&&b.hasAttribute(n))return b.getAttribute(n);return d};
  const lIns=Number(bpAttr('lIns',91440))*S,rIns=Number(bpAttr('rIns',91440))*S,tIns=Number(bpAttr('tIns',45720))*S,bIns=Number(bpAttr('bIns',45720))*S;
  const cnv=path(sp,'nvSpPr','cNvSpPr'),isShape=!phInfo&&!(cnv&&cnv.getAttribute('txBox')==='1');const fontRef=kid(kid(sp,'style'),'fontRef'),refColor=fontRef&&pickColor(fontRef);const anchor=bpAttr('anchor',isShape?'ctr':'t'),wrap=bpAttr('wrap','square');
  const na=kid(bp,'normAutofit')||(bpL&&kid(bpL,'normAutofit'))||(bpM&&kid(bpM,'normAutofit'));
  const fscale=na&&na.hasAttribute('fontScale')?Number(na.getAttribute('fontScale'))/100000:1;
  const lstSp=kid(tb,'lstStyle');
  const src=lvl=>[lstSp,phL&&path(phL,'txBody','lstStyle'),phM&&path(phM,'txBody','lstStyle'),styleFromTx(phInfo&&phInfo.type),phInfo?null:defTextStyle];
  const paras=[];
  for(const p of kids(tb,'p')){
   const pPr=kid(p,'pPr'),lvl=num(pPr,'lvl',0);
   const props=lvlProps(src(),lvl);
   const pr=k=>pPr&&pPr.hasAttribute(k)?pPr.getAttribute(k):props[k];
   const para={algn:(pPr&&pPr.getAttribute('algn'))||(isShape?'ctr':props.algn||'l'),marL:Number(pr('marL')||0),indent:Number(pr('indent')||0),size:0,runs:[],lnSpc:props.lnSpc||1,spB:0,spA:0,bu:props.bu};
   if(pPr){if(kid(pPr,'buNone'))para.bu='';else if(kid(pPr,'buChar'))para.bu=attr(kid(pPr,'buChar'),'char','•');else if(kid(pPr,'buAutoNum'))para.bu='•';const ls=kid(pPr,'lnSpc'),pc=ls&&kid(ls,'spcPct');if(pc)para.lnSpc=num(pc,'val',100000)/100000}
   if(!pPr||!kid(pPr,'buNone')&&!kid(pPr,'buChar')&&!kid(pPr,'buAutoNum')){}
   const mk=(rPr)=>{
    const base=props.rpr;const g=k=>rPr&&rPr.hasAttribute(k)?rPr.getAttribute(k):base[k];
    const c=(rPr&&pickColor(kid(rPr,'solidFill')))||(isShape&&refColor)||base.color||'rgb(0,0,0)';
    const lat=rPr&&kid(rPr,'latin');
    const sz=Number(g('sz')||1800)/100;
    return{size:sz*(96/72)*(W/(cx/9525)),b:g('b')==='1',i:g('i')==='1',u:g('u')&&g('u')!=='none',color:c,font:fontFace((lat&&attr(lat,'typeface',null))||base.font)};
   };
   for(const r of p.children){
    if(r.localName==='r'||r.localName==='fld'){const t=kid(r,'t');const st=mk(kid(r,'rPr'));st.text=t?t.textContent:'';if(st.text)para.runs.push(st)}
    else if(r.localName==='br'){const st=mk(kid(r,'rPr'));st.br=true;para.runs.push(st)}
   }
   const ref=para.runs.find(r=>!r.br)||mk(kid(p,'endParaRPr'));
   para.size=ref.size;
   const px=pt=>pt*(96/72)*(W/(cx/9525));
   const sb=props.spcBef,sa=props.spcAft;
   if(sb)para.spB=sb.pt!=null?px(sb.pt):sb.pct*para.size;
   if(sa)para.spA=sa.pt!=null?px(sa.pt):sa.pct*para.size;
   if(!para.runs.length){para.runs.push({text:' ',size:para.size,b:false,i:false,color:'#000',font:fontFace(),u:false})}
   paras.push(para);
  }
  const boxW=Math.max(10,box.w-lIns-rIns),boxH=box.h-tIns-bIns;
  let scale=fscale,lines=layoutText(paras,boxW,scale),th=textHeight(lines);
  if(na)for(let k=0;k<12&&th>boxH&&scale>.35;k++){scale*=.92;lines=layoutText(paras,boxW,scale);th=textHeight(lines)}
  let y=box.y+tIns+(anchor==='ctr'?Math.max(0,(boxH-th)/2):anchor==='b'?Math.max(0,boxH-th):0);
  ctx.save();ctx.textBaseline='alphabetic';
  for(const P of lines){
   y+=P.spB;
   P.lines.forEach((L,li)=>{
    const lh=L.max*1.2*(P.lnSpc||1);y+=lh;
    const base=y-lh*.22;
    const startX=box.x+lIns+P.marL+(li===0?Math.min(0,P.indent):0)+(li===0&&P.indent<0?0:0);
    let x;const avail=boxW-P.marL;
    const first=li===0;const left=box.x+lIns+P.marL;
    if(P.align==='ctr')x=left+(avail-L.w)/2;else if(P.align==='r')x=left+avail-L.w;else x=left+(first&&P.indent>0?P.indent:0);
    if(first&&P.bu){ctx.font=`${P.buSize}px ${P.buFont||fontFace()}`;ctx.fillStyle=P.buColor||'#000';ctx.fillText(P.bu,box.x+lIns+P.marL+Math.min(0,P.indent),base)}
    for(const t of L.segs){ctx.font=t.font;ctx.fillStyle=t.color;ctx.fillText(t.text,x,base);if(t.u){ctx.fillRect(x,base+t.size*.08,t.w,Math.max(1,t.size*.05))}x+=t.w}
   });
   y+=P.spA;
  }
  ctx.restore();
 }
 async function drawShapes(tree,rctx,opts){
  const spTree=path(tree.documentElement,'cSld','spTree');if(!spTree)return;
  await drawGroup(spTree,rctx,{ox:0,oy:0,sx:1,sy:1},opts);
 }
 async function drawGroup(parent,rctx,T,opts){
  for(const el of parent.children){
   const ln=el.localName;
   if(ln==='grpSp'){
    const xf=xfrmOf(el);
    if(xf&&xf.chExt&&xf.chExt.w&&xf.chExt.h){
     const sx=xf.w/xf.chExt.w,sy=xf.h/xf.chExt.h;
     const T2={ox:T.ox+(xf.x-xf.chOff.x*sx)*T.sx,oy:T.oy+(xf.y-xf.chOff.y*sy)*T.sy,sx:T.sx*sx,sy:T.sy*sy};
     await drawGroup(el,rctx,T2,opts);
    }else await drawGroup(el,rctx,T,opts);
    continue;
   }
   if(ln!=='sp'&&ln!=='pic'&&ln!=='cxnSp')continue;
   const ph=phOf(el);
   if(opts.skipPh&&ph)continue;
   if(ph&&['dt','ftr','sldNum','hdr'].includes(ph.type))continue;
   let xf=xfrmOf(el);
   if(!xf&&ph){for(const t of [rctx.layout,master?{documentElement:master.documentElement}:null]){const f=findPh(t,ph);if(f){xf=xfrmOf(f);if(xf)break}}}
   if(!xf)continue;
   const x=(T.ox+xf.x*T.sx)*S,y=(T.oy+xf.y*T.sy)*S,w=xf.w*T.sx*S,h=xf.h*T.sy*S;
   ctx.save();
   if(xf.rot||xf.fh||xf.fv){ctx.translate(x+w/2,y+h/2);if(xf.rot)ctx.rotate(xf.rot*Math.PI/180);ctx.scale(xf.fh?-1:1,xf.fv?-1:1);ctx.translate(-(x+w/2),-(y+h/2))}
   if(ln==='pic'){
    const bf=kid(el,'blipFill'),bl=bf&&kid(bf,'blip');
    const rid=bl&&(bl.getAttribute('r:embed')||bl.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed'));
    if(rid&&rctx.rels[rid]){const bm=await bitmap(resolve(rctx.path,rctx.rels[rid].target));if(bm)await drawBlip(bm,x,y,w,h,bf&&kid(bf,'srcRect'))}
   }else{
    const spPr=kid(el,'spPr'),style=kid(el,'style');
    const prst=attr(path(spPr,'prstGeom'),'prst','rect');
    const f=await fillOf(spPr,style,rctx);
    const lnEl=spPr&&kid(spPr,'ln');
    const lf=lnEl&&!kid(lnEl,'noFill')?(pickColor(kid(lnEl,'solidFill'))||(style&&attr(kid(style,'lnRef'),'idx','0')!=='0'?pickColor(kid(style,'lnRef')):null)):(!lnEl&&style&&attr(kid(style,'lnRef'),'idx','0')!=='0'?pickColor(kid(style,'lnRef')):null);
    const drawable=prst!=='line'&&prst!=='straightConnector1'&&!kid(spPr,'custGeom');
    if(f&&drawable){
     shapePath(prst,x,y,w,h,spPr);
     if(f.img){ctx.save();ctx.clip();await drawBlip(f.img,x,y,w,h,null);ctx.restore()}
     else if(setFill(f,x,y,w,h))ctx.fill();
    }
    if(lf){const lw=Math.max(1,(lnEl?num(lnEl,'w',12700):12700)*S*T.sx);ctx.strokeStyle=lf;ctx.lineWidth=lw;if(drawable){shapePath(prst,x,y,w,h,spPr);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y+h);ctx.stroke()}}
    if(ln==='sp')await drawText(el,{x,y,w,h},ph,rctx);
   }
   ctx.restore();
  }
 }
 async function drawBg(tree,rctx){
  const bg=path(tree.documentElement,'cSld','bg');if(!bg)return false;
  const bgPr=kid(bg,'bgPr');
  if(bgPr){const f=await fillOf(bgPr,null,rctx);if(f){if(f.img){await drawBlip(f.img,0,0,W,H,null);return true}if(setFill(f,0,0,W,H)){ctx.fillRect(0,0,W,H);return true}}}
  const ref=kid(bg,'bgRef');if(ref){const c=pickColor(ref);if(c){ctx.fillStyle=c;ctx.fillRect(0,0,W,H);return true}}
  return false;
 }
 const out=[];
 for(let n=0;n<order.length;n++){
  onProgress&&onProgress(n+1,order.length);
  const sp=order[n],sTree=await xml(sp);if(!sTree)continue;
  const sRels=relsOf(await zip.text(resolve(sp,'../_rels/'+sp.split('/').pop()+'.rels').replace(/^\//,'')))||{};
  const sRelsReal=relsOf(await zip.text(sp.replace(/([^/]+)$/,'_rels/$1.rels')));
  const layRel=Object.values(sRelsReal).find(r=>/slideLayout$/.test(r.type));
  const layPath=layRel?resolve(sp,layRel.target):null,layTree=layPath?await xml(layPath):null;
  const layRels=layPath?relsOf(await zip.text(layPath.replace(/([^/]+)$/,'_rels/$1.rels'))):{};
  const mRels=masterPath?relsOf(await zip.text(masterPath.replace(/([^/]+)$/,'_rels/$1.rels'))):{};
  const sctx={rels:sRelsReal,path:sp,layout:layTree},lctx={rels:layRels,path:layPath||'',layout:layTree},mctx={rels:mRels,path:masterPath||'',layout:layTree};
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  let done=await drawBg(sTree,sctx);
  if(!done&&layTree)done=await drawBg(layTree,lctx);
  if(!done&&master)await drawBg({documentElement:master.documentElement},mctx);
  const showM=attr(sTree.documentElement,'showMasterSp','1')!=='0',showL=layTree?attr(layTree.documentElement,'showMasterSp','1')!=='0':true;
  if(showM&&showL&&master)await drawShapes({documentElement:master.documentElement},mctx,{skipPh:true});
  if(showM&&layTree)await drawShapes(layTree,lctx,{skipPh:true});
  await drawShapes(sTree,sctx,{});
  const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.88));
  out.push(blob);
 }
 return{slides:out,ratio:cx/cy};
}

/* ---------- nuvem ---------- */
const cloud=()=>{const c=window.parent&&window.parent.iasdCloud;if(!c)throw Error('Abra o Studio pelo IASD APP e entre na conta de sonoplastia.');return c};
const user=()=>{try{return window.parent.iasdCurrentUser&&window.parent.iasdCurrentUser()}catch(e){return null}};
const pubUrl=p=>cloud().storage.from(BUCKET).getPublicUrl(p).data.publicUrl;
let decks=[],cur=null,idx=0,liveIdx=-1;
const st=(t)=>{const e=$('pptStatus');if(!e)return;e.hidden=!t;e.textContent=t||''};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function loadDecks(){
 const box=$('pptDecks');
 try{
  const {data,error}=await cloud().from('iasd_presentations').select('id,title,slides,ratio,created_at').order('created_at',{ascending:false});
  if(error)throw error;decks=data||[];
 }catch(e){decks=[];if(box)box.innerHTML='<span class="muted">'+esc(e.message||'Entre na conta de sonoplastia para ver as apresentações.')+'</span>';return}
 renderDecks();
}
function renderDecks(){
 const box=$('pptDecks');if(!box)return;box.replaceChildren();
 if(!decks.length){box.innerHTML='<span class="muted">Nenhuma apresentação ainda. Use “＋ Importar PowerPoint”.</span>';return}
 decks.forEach(d=>{
  const b=document.createElement('button');b.type='button';b.className='ppt-deck'+(cur&&cur.id===d.id?' on':'');
  b.innerHTML='<span>'+esc(d.title)+'</span><small>'+d.slides.length+' slides</small>';
  b.onclick=()=>open(d.id);
  const x=document.createElement('span');x.className='x';x.textContent='✕';x.title='Excluir apresentação';x.onclick=ev=>{ev.stopPropagation();del(d.id)};
  b.append(x);box.append(b);
 });
}
function open(id){
 cur=decks.find(d=>d.id===id)||null;idx=0;liveIdx=-1;renderDecks();renderViewer();
}
function renderViewer(){
 const v=$('pptViewer');if(!cur){v.hidden=true;return}
 v.hidden=false;$('pptTitle').textContent=cur.title;$('pptCount').textContent=cur.slides.length+' slides';
 const g=$('pptSlides');g.replaceChildren();
 cur.slides.forEach((p,i)=>{
  const b=document.createElement('button');b.type='button';b.className=(i===idx?'on':'')+(i===liveIdx?' live':'');
  const im=document.createElement('img');im.loading='lazy';im.alt='Slide '+(i+1);im.src=pubUrl(p);
  const n=document.createElement('i');n.textContent=i+1;b.append(im,n);
  b.onclick=()=>{idx=i;show()};g.append(b);
 });
}
function mark(){document.querySelectorAll('#pptSlides button').forEach((b,i)=>{b.classList.toggle('on',i===idx);b.classList.toggle('live',i===liveIdx)})}
function show(){
 if(!cur)return;
 try{stTakeover('ppt')}catch(e){}
 liveIdx=idx;mark();
 const payload='IASD_SLIDE:'+JSON.stringify({u:pubUrl(cur.slides[idx]),n:idx+1,t:cur.slides.length});
 try{project(payload)}catch(e){}
 for(const k of [1,2]){const p=cur.slides[idx+k];if(p){const im=new Image();im.src=pubUrl(p)}}
 const sel=document.querySelectorAll('#pptSlides button')[idx];if(sel&&sel.scrollIntoView)sel.scrollIntoView({block:'nearest'});
}
function nav(d){
 if(!cur)return;const n=Math.max(0,Math.min(cur.slides.length-1,idx+d));if(n===idx)return;idx=n;
 if(liveIdx>=0)show();else mark();
}
async function del(id){
 const d=decks.find(x=>x.id===id);if(!d)return;
 const ok=window.IASDDialog&&IASDDialog.confirm?await IASDDialog.confirm('Excluir “'+d.title+'”?'):confirm('Excluir “'+d.title+'”?');if(!ok)return;
 try{
  const c=cloud();await c.storage.from(BUCKET).remove(d.slides);
  const {error}=await c.from('iasd_presentations').delete().eq('id',id);if(error)throw error;
  if(cur&&cur.id===id){cur=null;renderViewer()}
  await loadDecks();
 }catch(e){st('Não foi possível excluir: '+(e.message||e))}
}
/* ---------- outros formatos ---------- */
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
function loadScript(src){return new Promise((res,rej)=>{const e=document.createElement('script');e.src=src;e.onload=res;e.onerror=()=>rej(Error('Não foi possível carregar o leitor de PDF (verifique a internet).'));document.head.append(e)})}
const toJpg=(cv,q=.88)=>new Promise(r=>cv.toBlob(r,'image/jpeg',q));
async function convertPdf(file,onProgress){
 if(!window.pdfjsLib){await loadScript(PDFJS+'pdf.min.js')}
 pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';
 const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,out=[];let ratio=16/9;
 for(let n=1;n<=pdf.numPages;n++){
  onProgress&&onProgress(n,pdf.numPages);
  const pg=await pdf.getPage(n),v0=pg.getViewport({scale:1}),sc=W/v0.width,vp=pg.getViewport({scale:sc});
  const cv=document.createElement('canvas');cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);
  const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
  await pg.render({canvasContext:cx,viewport:vp}).promise;
  if(n===1)ratio=v0.width/v0.height;
  out.push(await toJpg(cv));
 }
 return{slides:out,ratio};
}
async function convertImages(files,onProgress){
 const out=[];let ratio=16/9;
 const list=[...files].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
 for(let i=0;i<list.length;i++){
  onProgress&&onProgress(i+1,list.length);
  const bm=await createImageBitmap(list[i]);
  const w=Math.min(bm.width,W),h=Math.round(w*bm.height/bm.width);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');cx.fillStyle='#000';cx.fillRect(0,0,w,h);cx.drawImage(bm,0,0,w,h);
  if(i===0)ratio=bm.width/bm.height;
  out.push(await toJpg(cv,.9));
 }
 return{slides:out,ratio};
}
/* descobre o formato pelo conteúdo (não só pela extensão) */
async function detect(file){
 const head=new Uint8Array(await file.slice(0,8).arrayBuffer()),n=file.name.toLowerCase();
 if(head[0]===0x25&&head[1]===0x50&&head[2]===0x44&&head[3]===0x46)return'pdf';
 if(/^image\//.test(file.type)||/\.(png|jpe?g|webp|gif|bmp)$/.test(n))return'img';
 if(head[0]===0xD0&&head[1]===0xCF)return'ppt';
 if(head[0]===0x50&&head[1]===0x4B){
  try{const z=await readZip(await file.arrayBuffer());
   if(z.has('ppt/presentation.xml'))return'pptx';
   if(z.has('content.xml')&&z.has('mimetype'))return'odp';
   if(z.names().some(x=>/^Index\//.test(x)))return'key';
  }catch(e){}
 }
 return'';
}
const HOW={ppt:'Arquivo .ppt (PowerPoint antigo). Abra no PowerPoint e use Arquivo › Salvar como › .pptx ou PDF.',odp:'Arquivo .odp (LibreOffice/OpenOffice). Use Arquivo › Exportar como › PDF ou salve como .pptx.',key:'Arquivo do Keynote. Use Arquivo › Exportar para › PDF ou PowerPoint.','':'Formato não reconhecido. Use .pptx, .ppsx, PDF ou imagens (PNG/JPG). No Google Slides: Arquivo › Fazer download › PDF ou .pptx.'};
async function importFile(input){
 const files=input&&input.length!=null?[...input]:(input?[input]:[]);
 if(!files.length)return;
 try{
  const u=user();if(!u)throw Error('Entre na conta de sonoplastia antes de importar.');
  if(files.reduce((a,f)=>a+f.size,0)>150*1024*1024)throw Error('Arquivos muito grandes (limite de 150 MB).');
  st('Lendo apresentação…');
  const kinds=await Promise.all(files.map(detect)),kind=kinds[0];
  if(kinds.some(k=>k!==kind))throw Error('Envie arquivos de um só tipo por vez (ou várias imagens juntas).');
  const prog=(n,t)=>st('Convertendo '+(kind==='img'?'imagem':kind==='pdf'?'página':'slide')+' '+n+' de '+t+'…');
  let conv;
  if(kind==='pptx')conv=await convert(files[0],prog);
  else if(kind==='pdf')conv=await convertPdf(files[0],prog);
  else if(kind==='img')conv=await convertImages(files,prog);
  else throw Error(HOW[kind]!==undefined?HOW[kind]:HOW['']);
  const c=cloud(),id=crypto.randomUUID(),paths=[];
  for(let i=0;i<conv.slides.length;i++){
   st('Enviando slide '+(i+1)+' de '+conv.slides.length+'…');
   const p=id+'/'+String(i+1).padStart(3,'0')+'.jpg';
   const {error}=await c.storage.from(BUCKET).upload(p,conv.slides[i],{contentType:'image/jpeg',upsert:false});
   if(error)throw error;paths.push(p);
  }
  const title=(files.length>1?'Imagens — '+files[0].name:files[0].name).replace(/\.[a-z0-9]{2,5}$/i,'').slice(0,120)||'Apresentação';
  const {error}=await c.from('iasd_presentations').insert({id,title,slides:paths,ratio:conv.ratio,created_by:u.id});
  if(error)throw error;
  st('');await loadDecks();open(id);
  try{feedback('Apresentação importada: '+conv.slides.length+' slides.')}catch(e){}
 }catch(e){st('Não foi possível importar: '+(e.message||e))}
}
$('pptFile').addEventListener('change',e=>{const f=[...(e.target.files||[])];e.target.value='';importFile(f)});
document.addEventListener('keydown',e=>{
 if(document.body.dataset.tool!=='ppt'||!cur)return;
 if(/input|select|textarea/i.test((e.target.tagName||'')))return;
 if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();nav(1)}
 else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();nav(-1)}
 else if(e.key==='Enter'){e.preventDefault();show()}
});
window.STPpt={nav,show,import:importFile,convert,convertPdf,convertImages,detect,reload:loadDecks};
const _show=window.showTool;
if(typeof _show==='function')window.showTool=function(name){const r=_show.apply(this,arguments);if(name==='ppt'&&!window.__pptLoaded){window.__pptLoaded=true;loadDecks()}return r};
})();
