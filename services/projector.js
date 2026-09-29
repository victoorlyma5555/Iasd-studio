(function(){
'use strict';
const BASE='http://127.0.0.1:38741';
function token(){return localStorage.getItem('iasd-projetor-token')||''}
async function request(route,payload,authToken=token()){
 const res=await fetch(BASE+route,{method:'POST',headers:{'Content-Type':'application/json',...(authToken?{'Authorization':'Bearer '+authToken}:{})},body:JSON.stringify(payload||{})});
 const body=await res.json();
 if(!res.ok)throw Error(body.error||'IASD Projetor indisponível');
 return body;
}
async function status(){const t=token();if(!t)return null;return request('/status',{})}
window.IASDProjectorService=Object.freeze({BASE,token,request,status});
})();