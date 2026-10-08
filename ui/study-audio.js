/* Roteamento para aparelhos que compartilham o mesmo ambiente físico. */
(function(root){
 function leader(people,group){const all=people.filter(p=>p.group===group&&!p.away);const active=all.filter(p=>p.mic);return(active.length?active:all).sort((a,b)=>Number(!!b.host)-Number(!!a.host)||String(a.id).localeCompare(String(b.id)))[0]?.id;}
 function muted(people,me,id){const mine=people.find(p=>p.id===me),peer=people.find(p=>p.id===id);if(!mine||!peer)return false;if(mine.group){if(peer.group===mine.group)return true;if(leader(people,mine.group)!==me)return true;}return !!peer.group&&leader(people,peer.group)!==id;}
 const api={leader,muted};if(typeof module==='object'&&module.exports)module.exports=api;else root.IASDStudyAudio=api;
})(typeof window==='object'?window:globalThis);
