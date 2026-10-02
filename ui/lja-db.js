/* Leitor SQLite somente-leitura, direto do arquivo database.db do Louvor JA que está no computador da igreja.
   Nada é enviado para a internet: o arquivo é lido por partes no próprio navegador. */
(function(){
'use strict';
const TD=new TextDecoder('utf-8');
const u32=(b,p)=>((b[p]*16777216)+(b[p+1]<<16)+(b[p+2]<<8)+b[p+3]);
function vi(b,p){let v=0;for(let i=0;i<8;i++){const c=b[p+i];v=v*128+(c&127);if(c<128)return[v,i+1]}v=v*256+b[p+8];return[v,9]}
function sint(b,q,n){let v=0;for(let i=0;i<n;i++)v=v*256+b[q+i];if(b[q]&128)v-=Math.pow(2,8*n);return v}
function rec(b){
 const h=vi(b,0),hs=h[0];let p=h[1];const ty=[];
 while(p<hs){const t=vi(b,p);ty.push(t[0]);p+=t[1]}
 let q=hs;const out=[];const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
 for(const t of ty){
  if(t===0)out.push(null);
  else if(t>=1&&t<=6){const n=[0,1,2,3,4,6,8][t];out.push(sint(b,q,n));q+=n}
  else if(t===7){out.push(dv.getFloat64(q));q+=8}
  else if(t===8)out.push(0);
  else if(t===9)out.push(1);
  else if(t>=12){const n=t%2===0?(t-12)/2:(t-13)/2;out.push(t%2===0?b.subarray(q,q+n):TD.decode(b.subarray(q,q+n)));q+=n}
  else out.push(null)
 }
 return out
}
function DB(file){this.f=file;this.cache=new Map();this.CH=128}
DB.prototype.page=async function(n){
 const ps=this.ps,CH=this.CH,ci=Math.floor((n-1)/CH);let c=this.cache.get(ci);
 if(!c){const s=ci*CH*ps;c=new Uint8Array(await this.f.slice(s,s+CH*ps).arrayBuffer());this.cache.set(ci,c);if(this.cache.size>6)this.cache.delete(this.cache.keys().next().value)}
 const o=((n-1)%CH)*ps;return c.subarray(o,o+ps)
};
DB.prototype.scan=async function(root,cb){
 const self=this,U=this.U;
 async function walk(n){
  const pg=await self.page(n),off=n===1?100:0,type=pg[off],cnt=(pg[off+3]<<8)|pg[off+4];
  if(type===13){
   for(let i=0;i<cnt;i++){
    const ptr=(pg[off+8+2*i]<<8)|pg[off+9+2*i];
    const a=vi(pg,ptr),P=a[0],b=vi(pg,ptr+a[1]),rowid=b[0],pos=ptr+a[1]+b[1];let pl;
    const maxL=U-35;
    if(P<=maxL)pl=pg.subarray(pos,pos+P);
    else{
     const minL=Math.floor((U-12)*32/255)-23,K=minL+((P-minL)%(U-4)),loc=K<=maxL?K:minL;
     pl=new Uint8Array(P);pl.set(pg.subarray(pos,pos+loc));let ov=u32(pg,pos+loc),got=loc;
     while(ov&&got<P){const op=await self.page(ov),m=Math.min(U-4,P-got);pl.set(op.subarray(4,4+m),got);got+=m;ov=u32(op,0)}
    }
    const row=rec(pl);if(row[0]===null)row[0]=rowid;cb(row)
   }
  }else if(type===5){
   for(let i=0;i<cnt;i++){const ptr=(pg[off+12+2*i]<<8)|pg[off+13+2*i];await walk(u32(pg,ptr))}
   await walk(u32(pg,off+8))
  }
 }
 await walk(root)
};
async function open(file){
 const h=new Uint8Array(await file.slice(0,100).arrayBuffer());
 if(TD.decode(h.subarray(0,15))!=='SQLite format 3')throw Error('Este arquivo não é um banco SQLite (esperado: database.db do Louvor JA).');
 const db=new DB(file);let ps=(h[16]<<8)|h[17];if(ps===1)ps=65536;db.ps=ps;db.U=ps-h[20];
 if(u32(h,56)!==1)throw Error('Banco em codificação não suportada.');
 db.tables={};await db.scan(1,r=>{if(r[0]==='table')db.tables[r[1]]=r[3]});return db
}
const sec=t=>{const m=/^(\d+):(\d+):(\d+)(?:[.,](\d+))?/.exec(String(t||''));return m?(+m[1])*3600+(+m[2])*60+(+m[3])+(m[4]?+('0.'+m[4]):0):0};
/* Coleções que o IASD Studio mostra (as mesmas do Louvor JA que a igreja usa) */
const COLS=[
 {id:'novo',slugs:['hymnal']},{id:'antigo',slugs:['hymnal_1996']},
 {id:'jamin',slugs:['aym']},
 {id:'misc',slugs:['misc','worshipers','singers','celebrate_sp']},
 {id:'kids',slugs:['children']}
];
/* Lê só o que o IASD Studio precisa: músicas, letras com tempo, capas e nomes dos arquivos */
async function buildIndex(file,prog){
 const say=s=>{try{prog&&prog(s)}catch(e){}};
 say('Abrindo o banco…');const db=await open(file);
 for(const t of ['categories','categories_albums','albums','albums_musics','musics','lyrics','files'])if(!db.tables[t])throw Error('Banco sem a tabela "'+t+'". Versão do Louvor JA não reconhecida.');
 const slugCol={};COLS.forEach(c=>c.slugs.forEach(sl=>slugCol[sl]=c.id));
 const cat={};await db.scan(db.tables.categories,r=>{if(slugCol[r[2]])cat[r[0]]={col:slugCol[r[2]],name:r[1],ord:r[3]}});
 const alb={};await db.scan(db.tables.categories_albums,r=>{const c=cat[r[1]];if(c&&!alb[r[2]])alb[r[2]]={col:c.col,cat:c.name,corder:c.ord,name:r[3],order:r[4]}});
 const albRow={};await db.scan(db.tables.albums,r=>{if(alb[r[0]])albRow[r[0]]={name:r[1],cover:r[2]}});
 say('Lendo as coletâneas…');
 const am=[];await db.scan(db.tables.albums_musics,r=>{if(alb[r[1]])am.push({a:r[1],m:r[2],tr:r[3]})});
 const need={};am.forEach(x=>need[x.m]=1);
 const mus={};await db.scan(db.tables.musics,r=>{if(need[r[0]])mus[r[0]]={name:r[1],img:r[2],mp3:r[3],pb:r[4]}});
 say('Lendo letras e tempos…');
 const lyr={},fneed={};
 Object.values(mus).forEach(m=>{[m.img,m.mp3,m.pb].forEach(f=>{if(f)fneed[f]=1})});
 Object.values(albRow).forEach(a=>{if(a.cover)fneed[a.cover]=1});
 await db.scan(db.tables.lyrics,r=>{if(!need[r[1]])return;(lyr[r[1]]=lyr[r[1]]||[]).push({o:r[8],t:sec(r[5]),tp:sec(r[6]),x:r[2],ax:r[3],img:r[4],s:r[7]});if(r[4])fneed[r[4]]=1});
 say('Lendo nomes dos arquivos…');
 const files={};await db.scan(db.tables.files,r=>{if(fneed[r[0]])files[r[0]]={dir:r[4],name:r[5]}});
 const f=id=>id&&files[id]?files[id].name:'',fd=id=>id&&files[id]?files[id].dir:'';
 const albums={};
 am.forEach(x=>{const m=mus[x.m];if(!m)return;const ls=(lyr[x.m]||[]).sort((p,q)=>p.o-q.o);const A=alb[x.a];
  (albums[x.a]=albums[x.a]||{aid:x.a,col:A.col,cat:A.cat,corder:A.corder,order:A.order,name:(albRow[x.a]&&albRow[x.a].name)||A.name||A.cat,cover:albRow[x.a]?f(albRow[x.a].cover):'',tracks:[]}).tracks.push(
   {tr:x.tr,name:m.name,mp3:f(m.mp3),mp3dir:fd(m.mp3),pb:f(m.pb),pbdir:fd(m.pb),img:f(m.img),
    L:ls.filter(l=>l.s&&String(l.x||'').trim()).map(l=>[l.t,l.tp,String(l.x).trim(),f(l.img)||f(m.img),l.ax||''])})});
 const out={v:2,at:Date.now(),cols:{}};COLS.forEach(c=>out.cols[c.id]=[]);
 Object.values(albums).forEach(a=>{a.tracks.sort((p,q)=>p.tr-q.tr);out.cols[a.col].push(a)});
 Object.values(out.cols).forEach(arr=>arr.sort((p,q)=>(p.corder-q.corder)||(p.order-q.order)||String(p.name).localeCompare(String(q.name))));
 const cnt=id=>out.cols[id].reduce((n,a)=>n+a.tracks.length,0);
 say('Pronto: '+cnt('novo')+' hinos (novo), '+cnt('antigo')+' (1996), '+cnt('jamin')+' em JA/Min., '+cnt('misc')+' em Diversas, '+cnt('kids')+' infantis.');
 return out
}
window.LJADB={open,buildIndex,rec,sec};
})();
