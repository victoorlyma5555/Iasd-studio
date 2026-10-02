'use strict';
/* Biblioteca do Louvor JA para o site (somente leitura).
   O IASD Projetor lê a pasta do programa neste computador e entrega ao site, sem passar pelo Chrome
   (o Chrome bloqueia pastas como "Program Files"). Nada é enviado para a internet. */
const fs=require('node:fs');
const path=require('node:path');

const AUD=/\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4|m4v|webm)$/i;
const IMG=/\.(jpe?g|png|webp|bmp)$/i;
const MIME={mp3:'audio/mpeg',m4a:'audio/mp4',aac:'audio/aac',wav:'audio/wav',ogg:'audio/ogg',opus:'audio/ogg',flac:'audio/flac',mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',bmp:'image/bmp',db:'application/octet-stream'};
const mimeOf=f=>MIME[String(path.extname(f)).slice(1).toLowerCase()]||'application/octet-stream';
const isDir=p=>{try{return fs.statSync(p).isDirectory()}catch{return false}};
const isFile=p=>{try{return fs.statSync(p).isFile()}catch{return false}};
const yieldLoop=()=>new Promise(r=>setImmediate(r));

function create(userData){
 const cfgFile=path.join(userData,'louvorja.json');
 let cfg={root:'',db:''};
 try{const c=JSON.parse(fs.readFileSync(cfgFile,'utf8'));if(c&&typeof c==='object')cfg={root:String(c.root||''),db:String(c.db||'')}}catch{}
 const save=()=>{try{fs.mkdirSync(userData,{recursive:true});fs.writeFileSync(cfgFile,JSON.stringify(cfg),'utf8')}catch{}};
 let scanning=null,lastScan=null;
 /* capas e fundos podem ficar fora de config: varre a pasta do programa (um nível acima) */
 const scanRootOf=()=>{const r=cfg.root;if(!r||!isDir(r))return '';if(path.basename(r).toLowerCase()==='config'){const up=path.dirname(r);if(up&&up!==r&&isDir(up))return up}return r};

 /* a "raiz" é a pasta que contém musicas/ e imagens/ (config), mesmo que escolham a pasta do programa */
 function configRoot(dir){
  if(!dir)return '';
  if(isDir(path.join(dir,'musicas'))||isDir(path.join(dir,'imagens')))return dir;
  const c=path.join(dir,'config');
  if(isDir(path.join(c,'musicas'))||isDir(path.join(c,'imagens')))return c;
  return dir;
 }
 /* procura o database.db perto da pasta escolhida */
 function findDb(dir){
  if(!dir)return '';
  const seen=new Set(),cand=[];
  const add=d=>{if(d&&!seen.has(d)){seen.add(d);cand.push(d)}};
  add(dir);add(path.join(dir,'config'));add(path.dirname(dir));add(path.join(path.dirname(dir),'config'));
  for(const d of cand){const f=path.join(d,'database.db');if(isFile(f))return f}
  /* busca rasa (até 3 níveis) dentro da pasta do programa */
  const base=path.basename(dir).toLowerCase()==='config'?path.dirname(dir):dir;
  const q=[[base,0]];
  while(q.length){
   const [d,n]=q.shift();let ents;try{ents=fs.readdirSync(d,{withFileTypes:true})}catch{continue}
   for(const e of ents){
    if(e.isFile()&&e.name.toLowerCase()==='database.db')return path.join(d,e.name);
    if(e.isDirectory()&&n<3&&!/^(musicas|imagens|node_modules)$/i.test(e.name))q.push([path.join(d,e.name),n+1]);
   }
  }
  return '';
 }
 function detect(){
  const bases=[process.env['ProgramFiles(x86)'],process.env.ProgramFiles,process.env.ProgramData,process.env.LOCALAPPDATA,'C:\\'].filter(Boolean);
  for(const b of bases)for(const n of ['Louvor JA','LouvorJA','Louvor Ja','louvorja'])if(isDir(path.join(b,n)))return path.join(b,n);
  return '';
 }
 function autoSetup(){
  if(cfg.root&&isDir(cfg.root))return;
  const d=detect();if(!d)return;
  cfg.root=configRoot(d);const db=findDb(d);if(db)cfg.db=db;save();
 }
 function state(){
  autoSetup();
  const root=cfg.root&&isDir(cfg.root)?cfg.root:'';
  if(root&&(!cfg.db||!isFile(cfg.db))){const db=findDb(root);if(db){cfg.db=db;save()}}
  let db=null;
  if(cfg.db&&isFile(cfg.db)){const s=fs.statSync(cfg.db);db={path:cfg.db,size:s.size,mtime:Math.round(s.mtimeMs)}}
  return{ok:true,root,db,scanAt:lastScan?lastScan.at:0,files:lastScan?lastScan.n:0};
 }
 function setRoot(dir){
  if(!dir||!isDir(dir))throw Error('Pasta não encontrada.');
  cfg.root=configRoot(dir);const db=findDb(dir);if(db)cfg.db=db;save();lastScan=null;return state();
 }
 function setDb(file){
  if(!file||!isFile(file))throw Error('Arquivo não encontrado.');
  cfg.db=file;save();return state();
 }
 /* lista (nome, pasta relativa, tipo, tamanho) de áudios e imagens */
 async function scan(){
  if(scanning)return scanning;
  scanning=(async()=>{
   const root=scanRootOf();if(!root)throw Error('Escolha a pasta do Louvor JA no IASD Projetor.');
   const out=[];let steps=0;
   async function walk(dir,rel,depth){
    let ents;try{ents=await fs.promises.readdir(dir,{withFileTypes:true})}catch{return}
    for(const e of ents){
     if(e.isDirectory()){if(depth<6&&!/^(node_modules|\$recycle\.bin)$/i.test(e.name))await walk(path.join(dir,e.name),rel?rel+'/'+e.name:e.name,depth+1)}
     else if(e.isFile()){
      const k=AUD.test(e.name)?'a':IMG.test(e.name)?'i':'';
      if(k){out.push([e.name,rel,k]);if(++steps%400===0)await yieldLoop()}
     }
    }
   }
   await walk(root,'',0);
   lastScan={at:Date.now(),n:out.length};
   return{ok:true,at:lastScan.at,root:path.basename(root),items:out};
  })();
  try{return await scanning}finally{scanning=null}
 }
 /* caminho seguro dentro da raiz ('/' como separador) */
 function resolveRel(rel){
  const root=scanRootOf();if(!root||typeof rel!=='string'||!rel||rel.length>600)return '';
  const base=path.resolve(root),full=path.resolve(base,...rel.split('/'));
  if(!full.startsWith(base+path.sep))return '';
  return isFile(full)?full:'';
 }
 function sendFile(req,res,file,headers){
  const size=fs.statSync(file).size,range=req.headers.range;let start=0,end=size-1,status=200;
  if(range){
   const m=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(!m){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return}
   if(m[1])start=Number(m[1]);if(m[2])end=Number(m[2]);
   if(!m[1]&&m[2]){start=Math.max(0,size-Number(m[2]));end=size-1}
   if(start>=size||end>=size||start>end){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return}
   status=206;
  }
  const h=Object.assign({'Content-Type':mimeOf(file),'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store'},headers);
  if(status===206)h['Content-Range']='bytes '+start+'-'+end+'/'+size;
  res.writeHead(status,h);
  if(req.method==='HEAD'||size===0){res.end();return}
  const s=fs.createReadStream(file,{start,end});s.on('error',()=>{try{res.destroy()}catch{}});s.pipe(res);
 }
 return{state,setRoot,setDb,scan,resolveRel,sendFile,dbPath:()=>cfg.db&&isFile(cfg.db)?cfg.db:'',configRoot,findDb,detect};
}
module.exports={create,AUD,IMG,mimeOf};
