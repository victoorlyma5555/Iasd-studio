(function(){
'use strict';
function getClient(){return window.iasdCloud||null}
function currentUser(){return typeof window.iasdCurrentUser==='function'?window.iasdCurrentUser():null}
async function session(){const client=getClient();if(!client)return null;const r=await client.auth.getSession();if(r.error)throw r.error;return r.data.session||null}
async function signIn(email,password){const client=getClient();if(!client)throw Error('Conexão indisponível.');const r=await client.auth.signInWithPassword({email,password});if(r.error)throw r.error;return r.data}
async function signOut(){const client=getClient();if(!client)return;const r=await client.auth.signOut();if(r.error)throw r.error}
async function profile(userId){const client=getClient();if(!client||!userId)return null;const r=await client.from('iasd_profiles').select('*').eq('user_id',userId).maybeSingle();if(r.error)throw r.error;return r.data}
async function role(userId){const client=getClient();if(!client||!userId)return null;const r=await client.from('iasd_members').select('role').eq('user_id',userId).maybeSingle();if(r.error)throw r.error;return r.data?.role||null}
async function schedules(){const client=getClient();if(!client)return [];const r=await client.from('iasd_schedules').select('*').order('updated_at',{ascending:false});if(r.error)throw r.error;return (r.data||[]).map(x=>({id:x.id,name:x.name,date:x.service_date||'',items:x.items}))}
window.IASDCloudService=Object.freeze({getClient,currentUser,session,signIn,signOut,profile,role,schedules});
})();