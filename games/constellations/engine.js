/* Constelações · regras compartilhadas (cliente).
   O servidor (docs/supabase-sequencia.sql) é o dono oficial da partida e valida TUDO. Este módulo só espelha
   as regras para destacar casas válidas, desenhar cartas e animar — nunca decide uma jogada. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ConstellationEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SIZE=8,LENGTH=5,TARGET=2,WILD=32,REMOVE=33;
const SUITS=[{id:0,name:'Estrela',color:'#d99a14'},{id:1,name:'Gota',color:'#2563eb'},{id:2,name:'Folha',color:'#0f9f6e'},{id:3,name:'Coroa',color:'#c0364d'}];
const RANKS=['A','2','3','4','5','6','7','8'];
const TEAMS=[{id:0,name:'Azul',color:'#3b82f6'},{id:1,name:'Ouro',color:'#f5b73a'}];
const MODES={'1v1':{size:2,label:'1 × 1'},'2v2':{size:4,label:'2 × 2'},'3v3':{size:6,label:'3 × 3'},'4v4':{size:8,label:'4 × 4'},'5v5':{size:10,label:'5 × 5'},'6v6':{size:12,label:'6 × 6'}};
function info(c){
  if(c===WILD)return {kind:'wild',label:'Coringa'};
  if(c===REMOVE)return {kind:'remove',label:'Remover'};
  const suit=Math.floor(c/8),rank=c%8;
  return {kind:'normal',suit,rank,label:SUITS[suit].name+' '+RANKS[rank]};
}
const locked=(lines,cell)=>(lines||[]).some(l=>l.c.includes(cell));
/* casas válidas para uma carta e uma equipe (espelha seqg.valid_cells) */
function validCells(pub,card,team){
  const out=[];if(!pub||!pub.board)return out;
  for(let i=0;i<pub.board.length;i++){
    const [bc,own]=pub.board[i];
    if(card===REMOVE){if(own!==-1&&own!==team&&!locked(pub.lines,i))out.push(i)}
    else if(card===WILD){if(own===-1)out.push(i)}
    else if(bc===card&&own===-1)out.push(i);
  }
  return out;
}
const canPlay=(pub,hand,team)=>(hand||[]).some(c=>validCells(pub,c,team).length>0);
const linesOf=(pub,team)=>(pub.lines||[]).filter(l=>l.t===team);
const count=(pub,team)=>linesOf(pub,team).length;
function order(pub){return (pub.order||[]).map(id=>(pub.players||[]).find(p=>p.id===id)).filter(Boolean)}
const initials=n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(s=>Array.from(s)[0]||'').join('').toUpperCase()||'?';
return {SIZE,LENGTH,TARGET,WILD,REMOVE,SUITS,RANKS,TEAMS,MODES,info,validCells,canPlay,locked,linesOf,count,order,initials};
});
