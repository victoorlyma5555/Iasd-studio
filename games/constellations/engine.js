(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ConstellationEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SIZE=8,LENGTH=5,TARGET=2,HAND=5;
const copy=x=>JSON.parse(JSON.stringify(x));
function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function create(names,seconds=45,rng=Math.random,now=Date.now()){
 if(!Array.isArray(names)||names.length<2||names.length>12||names.length%2)throw Error('Use de 2 a 12 participantes, em duas equipes iguais.');
 const values=shuffle(Array.from({length:64},(_,i)=>i%32),rng);
 const deck=shuffle([...Array.from({length:128},(_,i)=>i%32),...Array(4).fill('remove'),...Array(4).fill('shield')],rng);
 const players=names.map((name,i)=>({id:'p'+i,name:String(name).trim().slice(0,32)||'Jogador '+(i+1),team:i%2,hand:deck.splice(0,HAND)}));
 const turn=Math.floor(rng()*players.length);
 return {schema:1,id:'c-'+now+'-'+Math.floor(rng()*1e9),revision:0,board:values.map(value=>({value,owner:null,shield:false})),players,deck,discard:[],turn,seconds:[0,30,45,60].includes(Number(seconds))?Number(seconds):45,deadline:seconds?now+Number(seconds)*1000:null,sequences:[[],[]],status:'playing',winner:null,stalls:0,last:null};
}
function locked(s,index){return s.sequences.some(lines=>lines.some(line=>line.includes(index)))}
function valid(s,card){const team=s.players[s.turn].team;return s.board.flatMap((cell,i)=>{
 const yes=card==='remove'?cell.owner!==null&&cell.owner!==team&&!cell.shield&&!locked(s,i):card==='shield'?cell.owner===team&&!cell.shield&&!locked(s,i):cell.value===card&&cell.owner===null;
 return yes?[i]:[];
})}
function lines(s,index,team){const found=[];const row=Math.floor(index/8),col=index%8;
 for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])for(let offset=0;offset<5;offset++){
  const cells=[];for(let k=0;k<5;k++){const r=row+(k-offset)*dr,c=col+(k-offset)*dc;if(r<0||r>=8||c<0||c>=8)break;cells.push(r*8+c)}
  if(cells.length===5&&cells.every(i=>s.board[i].owner===team)&&[...s.sequences[team],...found].every(line=>line.filter(i=>cells.includes(i)).length<=1))found.push(cells);
 }return found;
}
function draw(s,rng){if(!s.deck.length&&s.discard.length)s.deck=shuffle(s.discard.splice(0),rng);return s.deck.pop()}
function apply(state,action,now=Date.now(),rng=Math.random){
 const s=copy(state),p=s.players[s.turn];
 if(s.status!=='playing')throw Error('A partida terminou.');
 if(action.match!==s.id||action.revision!==s.revision||action.player!==p.id)throw Error('Jogada antiga, duplicada ou fora do turno.');
 const expired=s.deadline!==null&&now>=s.deadline;
 if(action.type==='timeout'&&!expired)throw Error('O tempo ainda não terminou.');
 if(action.type!=='timeout'&&expired)throw Error('O tempo terminou.');
 let formed=[];
 if(action.type==='play'||action.type==='exchange'){
  if(!Number.isInteger(action.card)||action.card<0||action.card>=p.hand.length)throw Error('Carta inválida.');
  const card=p.hand[action.card],positions=valid(s,card);
  if(action.type==='exchange'){if(positions.length)throw Error('Só pode trocar uma carta sem posição válida.');s.stalls++}
  else {if(!positions.includes(action.cell))throw Error('Posição inválida.');const cell=s.board[action.cell];
   if(card==='remove'){cell.owner=null;cell.shield=false}else if(card==='shield')cell.shield=true;else {cell.owner=p.team;formed=lines(s,action.cell,p.team);s.sequences[p.team].push(...formed)}
   s.stalls=0;
  }
  p.hand.splice(action.card,1);s.discard.push(card);const next=draw(s,rng);if(next!==undefined)p.hand.push(next);
  s.last={type:action.type,cell:action.cell??null,card,team:p.team,formed,player:p.name};
 }else if(action.type==='timeout'||action.type==='pass'){s.stalls++;s.last={type:action.type,player:p.name,formed:[]}}
 else throw Error('Ação inválida.');
 s.revision++;
 if(s.sequences[p.team].length>=TARGET){s.status='won';s.winner=p.team;s.deadline=null}
 else if(s.board.every(c=>c.owner!==null)||s.stalls>=s.players.length*2||s.revision>=500){s.status='draw';s.deadline=null}
 else {s.turn=(s.turn+1)%s.players.length;s.deadline=s.seconds?now+s.seconds*1000:null}
 return s;
}
function restore(raw){
 const s=typeof raw==='string'?JSON.parse(raw):copy(raw),card=c=>Number.isInteger(c)&&c>=0&&c<32||c==='remove'||c==='shield';
 if(!s||s.schema!==1||typeof s.id!=='string'||s.id.length>128||!Array.isArray(s.board)||s.board.length!==64||!s.board.every(c=>c&&Number.isInteger(c.value)&&c.value>=0&&c.value<32&&[null,0,1].includes(c.owner)&&typeof c.shield==='boolean')||!Array.isArray(s.players)||s.players.length<2||s.players.length>12||s.players.length%2||!Number.isInteger(s.turn)||!s.players[s.turn]||!Number.isInteger(s.revision)||s.revision<0||!['playing','won','draw'].includes(s.status)||![null,0,1].includes(s.winner)||![0,30,45,60].includes(s.seconds)||!(s.deadline===null||Number.isFinite(s.deadline))||!Number.isInteger(s.stalls)||s.stalls<0||!Array.isArray(s.deck)||!s.deck.every(card)||!Array.isArray(s.discard)||!s.discard.every(card)||!Array.isArray(s.sequences)||s.sequences.length!==2||!s.sequences.every(lines=>Array.isArray(lines)&&lines.every(line=>Array.isArray(line)&&line.length===5&&line.every(i=>Number.isInteger(i)&&i>=0&&i<64)))||!s.players.every((p,i)=>p&&p.id==='p'+i&&p.team===i%2&&typeof p.name==='string'&&p.name.length<=32&&Array.isArray(p.hand)&&p.hand.length<=5&&p.hand.every(card)))throw Error('Partida salva inválida.');
 return s;
}
return {SIZE,LENGTH,TARGET,HAND,create,valid,lines,locked,apply,restore};
});
