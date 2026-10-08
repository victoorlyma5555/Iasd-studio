/* Só comandos assinados pela chave registrada pelo dirigente são aceitos. */
(function(root){
 const HOST=new Set('md lk st pos rev gr exp vo chs chr chx hl brk call mute end hp chh'.split(' '));
 const bytes=s=>new TextEncoder().encode(s),hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
 const unhex=s=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));
 async function keys(){const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);return{privateKey:await crypto.subtle.exportKey('jwk',pair.privateKey),publicKey:await crypto.subtle.exportKey('jwk',pair.publicKey)};}
 async function sign(key,code,event,payload){const data=JSON.stringify({code,event,payload,time:Date.now(),nonce:crypto.randomUUID()});const imported=await crypto.subtle.importKey('jwk',key,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);return{data,signature:hex(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},imported,bytes(data)))};}
 async function verify(key,code,event,message,seen){try{if(typeof message?.data!=='string'||message.data.length>1000000||typeof message.signature!=='string'||!/^[a-f0-9]{128}$/.test(message.signature))return null;const data=JSON.parse(message.data);if(data.code!==code||data.event!==event||!Number.isFinite(data.time)||Math.abs(Date.now()-data.time)>60000||typeof data.nonce!=='string'||seen.has(data.nonce))return null;const imported=await crypto.subtle.importKey('jwk',key,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},imported,unhex(message.signature),bytes(message.data)))return null;seen.add(data.nonce);if(seen.size>1000)seen.delete(seen.values().next().value);return data.payload;}catch{return null;}}
 const api={HOST,keys,sign,verify};if(typeof module==='object'&&module.exports)module.exports=api;else root.IASDStudyRoomSecurity=api;
})(typeof window==='object'?window:globalThis);
