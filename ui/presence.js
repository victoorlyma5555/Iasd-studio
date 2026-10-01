/* Presença dos sonoplastas — Supabase Realtime Presence (sem tabelas novas, nada fica gravado).
   Cada sonoplasta que ativa "Aparecer na lista" publica nome, horário de chegada e estado do Projetor.
   A escala vem do cadastro de Escalas deste aparelho (data.escalas). */
(function(){
'use strict';
const CHANNEL='iasd-sonoplastia-presence',VKEY='iasd-presence-visible',AKEY='iasd-presence-arrival';
const st={ch:null,uid:null,subscribed:false,people:[],listeners:new Set(),timer:null};
const g=f=>{try{return f()}catch(e){return undefined}};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const pad=n=>String(n).padStart(2,'0');
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const hm=ms=>{const d=new Date(ms);return pad(d.getHours())+':'+pad(d.getMinutes())};
const isFounder=()=>g(()=>cloudRole)==='founder';
/* Só o fundador pode ficar invisível; sonoplastas sempre aparecem (não há escolha para eles). */
function visible(){if(!isFounder())return true;try{return localStorage.getItem(VKEY)!=='0'}catch(e){return true}}
function setVisible(v){if(!isFounder())return;try{localStorage.setItem(VKEY,v?'1':'0')}catch(e){}if(v)track();else untrack();notify()}
/* 1ª vez que a pessoa ficou visível hoje, neste aparelho: é o "bateu o horário". */
function arrivalToday(){
  const day=todayISO();
  try{const o=JSON.parse(localStorage.getItem(AKEY)||'null');if(o&&o.day===day&&o.uid===st.uid)return o.at}catch(e){}
  const at=Date.now();try{localStorage.setItem(AKEY,JSON.stringify({day,uid:st.uid,at}))}catch(e){}
  return at;
}
/* Escalas de hoje (Sonoplastia/Projeção) cadastradas neste aparelho. */
function escalasHoje(){
  const list=g(()=>data.escalas);if(!Array.isArray(list))return[];
  const today=todayISO(),out=[];
  list.forEach(raw=>{
    const parts=String(raw).split(/\s+[—–-]\s+/).map(x=>x.trim());
    let iso='';const m=(parts[0]||'').match(/(\d{4})-(\d{2})-(\d{2})/);
    if(m)iso=m[0];else{const b=(parts[0]||'').match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);if(b){let y=b[3]?+b[3]:new Date().getFullYear();if(y<100)y+=2000;iso=y+'-'+pad(+b[2])+'-'+pad(+b[1])}}
    if(iso!==today)return;
    const rest=parts.slice(1);let time='';
    const r2=rest.filter(x=>{if(/^\d{1,2}:\d{2}$/.test(x)){time=x.length===4?'0'+x:x;return false}return true});
    const name=r2[0]||'',area=norm(r2[1]||'');
    if(area==='sonoplastia'||area==='projecao')out.push({name,time});
  });
  return out;
}
function sameName(a,b){const x=norm(a),y=norm(b);if(!x||!y)return false;if(x===y)return true;const fx=x.split(' ')[0],fy=y.split(' ')[0];return fx.length>2&&fx===fy&&(x.includes(y)||y.includes(x)||x.split(' ').length===1||y.split(' ').length===1)}
function payload(){
  const name=g(()=>loggedUserName())||'Sonoplasta';
  return {name,since:arrivalToday(),device:/Mobi|Android|iPhone/i.test(navigator.userAgent)?'celular':'computador',projetor:g(()=>window.IASDUI.projState&&window.IASDUI.projState())||'idle',page:g(()=>current)||''};
}
function track(){if(st.ch&&st.subscribed&&visible()&&g(()=>canUseSound()))st.ch.track(payload()).catch(()=>{})}
function untrack(){if(st.ch&&st.subscribed)st.ch.untrack().catch(()=>{})}
function sync(){
  if(!st.ch)return;
  const s=st.ch.presenceState(),people=[];
  Object.keys(s).forEach(k=>{const metas=s[k]||[];if(!metas.length)return;const m=metas.slice().sort((a,b)=>(a.since||0)-(b.since||0))[0];people.push({uid:k,name:m.name,since:m.since,device:m.device,projetor:m.projetor,page:m.page,me:k===st.uid})});
  people.sort((a,b)=>(a.since||0)-(b.since||0));
  st.people=people;notify();
}
function notify(){st.listeners.forEach(f=>{try{f()}catch(e){}})}
function ensure(){
  const cl=g(()=>cloud),user=g(()=>cloudUser);
  if(!cl||!user||!g(()=>canUseSound())){stop();return}
  if(st.ch&&st.uid===user.id)return;
  stop();st.uid=user.id;
  try{
    st.ch=cl.channel(CHANNEL,{config:{presence:{key:user.id}}});
    st.ch.on('presence',{event:'sync'},sync)
      .subscribe(status=>{st.subscribed=status==='SUBSCRIBED';if(st.subscribed){track();sync()}notify()});
    st.timer=setInterval(()=>{if(document.visibilityState==='visible'){track();notify()}},30000);
  }catch(e){console.warn('Presença indisponível',e)}
}
function stop(){
  if(st.timer){clearInterval(st.timer);st.timer=null}
  if(st.ch){try{const c=g(()=>cloud);st.ch.untrack();c&&c.removeChannel(st.ch)}catch(e){}}
  st.ch=null;st.subscribed=false;st.people=[];st.uid=null;
}
/* Estado de cada pessoa em relação à escala de hoje (cadastro deste aparelho + hora de chegada). */
function view(){
  const esc=escalasHoje(),now=Date.now(),day=todayISO();
  const rows=st.people.map(p=>{
    const e=esc.find(x=>sameName(x.name,p.name));
    let tag='none',label='Sem escala hoje';
    if(e){
      if(e.time){const [h,m]=e.time.split(':').map(Number),sched=new Date();sched.setHours(h,m,0,0);const late=Math.round((p.since-sched.getTime())/60000);
        if(late<=5){tag='ok';label='No horário · escala '+e.time}else{tag='late';label='Atrasou '+late+' min · escala '+e.time}}
      else{tag='ok';label='Na escala de hoje'}
    }
    const mins=Math.max(0,Math.round((now-p.since)/60000));
    return {...p,tag,label,arrived:hm(p.since),online:mins<60?mins+' min':Math.floor(mins/60)+' h '+pad(mins%60)+' min'};
  });
  const absent=esc.filter(e=>!rows.some(r=>sameName(e.name,r.name))).map(e=>({name:e.name,time:e.time}));
  return {rows,absent,subscribed:st.subscribed,visible:visible(),total:rows.length,day};
}
window.IASDPresence={isFounder,ensure,stop,view,setVisible,isVisible:visible,onChange:f=>{st.listeners.add(f);return()=>st.listeners.delete(f)}};
})();
