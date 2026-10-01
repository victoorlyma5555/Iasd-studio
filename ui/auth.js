/* IASD APP · Telas de entrar e criar conta (tela cheia, tema claro/escuro).
   Substitui renderAuthModal/submitAuthModal de app/main.js. Mantém: Google, e-mail+senha, confirmação de e-mail,
   aprovação pelo fundador. Acrescenta: lembrar de mim, esqueci a senha (com tela de nova senha), nome e WhatsApp no cadastro. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const DDI=[['🇧🇷','+55','Brasil'],['🇵🇹','+351','Portugal'],['🇦🇴','+244','Angola'],['🇲🇿','+258','Moçambique'],['🇺🇸','+1','EUA / Canadá'],['🇦🇷','+54','Argentina'],['🇵🇾','+595','Paraguai'],['🇺🇾','+598','Uruguai'],['🇨🇱','+56','Chile'],['🇧🇴','+591','Bolívia'],['🇯🇵','+81','Japão'],['🇪🇸','+34','Espanha']];
let mode='login',forgot=false,notice='',busy=false,keep={};
const isDark=()=>document.documentElement.getAttribute('data-theme')!=='light';
const ic={
 mail:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
 lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
 user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"/></svg>',
 eye:'<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.6"/></svg>',
 wa:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z"/><path d="M8.6 8.4c.3 2.6 2.7 5 5.4 5.4l1.2-1.4-2-1-.8.8c-.9-.4-1.7-1.2-2.1-2.1l.8-.8-1-2Z"/></svg>',
 arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 add:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21c.8-4 3.8-6 7-6s6.200 2 7 6M19 8v6M16 11h6"/></svg>',
 lockS:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
 sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
 moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500Z"/></svg>'
};
const GOOGLE='<svg viewBox="0 0 18 18" width="22" height="22"><path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.703-1.568 2.684-3.878 2.684-6.614Z"/><path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.348 2.827.956 4.038l3.007-2.332Z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"/></svg>';
function css(){if($('auth2-css'))return;const s=document.createElement('style');s.id='auth2-css';s.textContent=`
.au{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:18px;overflow:auto;font-family:Inter,system-ui,sans-serif;animation:auin .3s both;--ac:#e8eefc;--am:#9fb0d3;--ab:rgba(140,170,230,.35);--af:rgba(8,18,44,.55);--ag:rgba(10,24,56,.72);--ap:#2b8bff}
@keyframes auin{from{opacity:0}}
.au.light{--ac:#0f1c3a;--am:#51617f;--ab:rgba(120,150,200,.4);--af:rgba(255,255,255,.75);--ag:rgba(255,255,255,.68)}
.au-bg{position:fixed;inset:0;z-index:-1;background-size:cover;background-position:center}
.au.dark .au-bg.fb{background:radial-gradient(900px 500px at 82% 30%,rgba(255,170,90,.35),transparent 60%),radial-gradient(700px 500px at 15% 10%,#24357e,transparent 65%),linear-gradient(180deg,#070d26 0%,#0e1c4a 55%,#1b1a3a 100%)}
.au.light .au-bg.fb{background:radial-gradient(900px 500px at 85% 55%,rgba(255,190,110,.75),transparent 60%),radial-gradient(800px 500px at 10% 10%,#bcd8ff,transparent 65%),linear-gradient(180deg,#9ec8f5 0%,#f8d9b0 60%,#ffc58a 100%)}
.au-bg:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.25))}.au.light .au-bg:after{background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.25))}
.au.dark .au-bg.fb:before{content:'';position:absolute;inset:0;background-image:radial-gradient(1.5px 1.5px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 120px 80px,#fff9,transparent),radial-gradient(1.5px 1.5px at 210px 20px,#fff,transparent),radial-gradient(1px 1px at 60px 140px,#fff9,transparent);background-size:240px 180px;opacity:.7}
.au-th{position:fixed;top:18px;right:18px;z-index:3;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;border:1px solid var(--ab);background:var(--af);backdrop-filter:blur(10px);color:var(--ac);font:600 14px Inter,sans-serif;cursor:pointer}
.au-th svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}
.au-x{position:fixed;top:18px;left:18px;z-index:3;width:42px;height:42px;border-radius:50%;border:1px solid var(--ab);background:var(--af);backdrop-filter:blur(10px);color:var(--ac);font-size:20px;cursor:pointer}
.au-card{width:min(470px,100%);padding:26px 30px 22px;border-radius:30px;background:var(--ag);border:1px solid var(--ab);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2);color:var(--ac);box-shadow:0 30px 90px rgba(0,0,0,.4),inset 0 0 0 1px rgba(255,255,255,.05);animation:aupop .4s cubic-bezier(.2,1.2,.4,1) both;margin:auto}
@keyframes aupop{from{opacity:0;transform:translateY(14px) scale(.97)}}
.au-br{display:grid;justify-items:center;gap:2px;margin-bottom:10px;text-align:center}.au-br img{width:70px;height:70px;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.au-br b{font-size:28px;letter-spacing:.01em;font-weight:900}.au-br b i{font-style:normal;color:#f5b73a}.au-br small{font-size:10.5px;letter-spacing:.22em;opacity:.8;font-weight:700}
.au-h{text-align:center;margin:12px 0 16px}.au-h h2{margin:0;font-size:30px;font-weight:900;line-height:1.1}.au-h p{margin:6px 0 0;color:var(--am);font-size:15.5px}
.au-g{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:14px;border:0;background:#fff;color:#1f2937;font:700 16px Inter,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.18);transition:.15s}.au-g:hover{transform:translateY(-1px)}
.au-dv{display:flex;align-items:center;gap:12px;margin:16px 0 14px;color:var(--am);font-size:13px}.au-dv:before,.au-dv:after{content:'';flex:1;height:1px;background:var(--ab)}
.au-f{position:relative;display:flex;align-items:center;margin-bottom:11px;border-radius:14px;border:1px solid var(--ab);background:var(--af);transition:.15s}.au-f:focus-within{border-color:var(--ap);box-shadow:0 0 0 3px rgba(43,139,255,.25)}
.au-f>svg{flex:none;width:22px;height:22px;margin-left:14px;fill:none;stroke:var(--ac);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.au-f input{flex:1;min-width:0;border:0!important;outline:0!important;box-shadow:none!important;border-radius:0!important;background:transparent!important;color:var(--ac);font:500 16px Inter,sans-serif;padding:16px 14px}.au-f input::placeholder{color:var(--am)}
.au-f .eye{border:0;background:none;padding:0 14px;cursor:pointer;color:var(--ac);display:grid;place-items:center}.au-f .eye svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7}
.au-f select{border:0;background:none;color:var(--ac);font:600 14px Inter,sans-serif;padding:0 6px 0 4px;outline:0;cursor:pointer;max-width:92px}.au-f select option{color:#111}
.au-rw{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:2px 0 14px;font-size:14px}
.au-ck{display:flex;align-items:center;gap:9px;cursor:pointer;color:var(--ac)}.au-ck input{width:18px;height:18px;accent-color:var(--ap)}
.au a,.au .lk{color:#6fb4ff;text-decoration:underline;background:none;border:0;padding:0;font:inherit;cursor:pointer}.au.light a,.au.light .lk{color:#1a5fd0}
.au-go{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;border:0;border-radius:14px;background:linear-gradient(180deg,#3a97ff,#1f6fe0);color:#fff;font:800 17px Inter,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(31,111,224,.5);transition:.15s}.au-go:hover{transform:translateY(-1px);filter:brightness(1.06)}.au-go:disabled{opacity:.6;cursor:default;transform:none}
.au-go svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.au-ol{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:14px;border-radius:14px;border:1px solid var(--ac);background:transparent;color:var(--ac);font:700 16px Inter,sans-serif;cursor:pointer}.au-ol:hover{background:var(--af)}
.au-ol svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.au-sw{text-align:center;margin-top:14px;font-size:14.5px;color:var(--am);display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}.au-sw .au-ol{width:auto;padding:9px 18px;font-size:15px;border-color:var(--ap);color:#5aa8ff}.au.light .au-sw .au-ol{color:#1a5fd0}
.au-ft{margin-top:16px;text-align:center;font-size:12.5px;color:var(--am);line-height:1.6}.au-ft svg{width:14px;height:14px;vertical-align:-2px;fill:none;stroke:currentColor;stroke-width:2}.au-ft b{color:var(--ac);font-weight:600}
.au-fb{min-height:0;margin:0 0 10px;padding:0;font-size:14px;border-radius:12px}.au-fb.err{padding:10px 12px;background:rgba(239,68,68,.15);color:#fda4af;border:1px solid rgba(239,68,68,.4)}.au.light .au-fb.err{color:#b91c1c}
.au-fb.warn,.au-ok{padding:10px 12px;background:rgba(245,183,58,.16);color:#fde68a;border:1px solid rgba(245,183,58,.45);border-radius:12px;margin-bottom:12px;font-size:14px;line-height:1.45}.au.light .au-fb.warn,.au.light .au-ok{color:#7c4a03}
.au-ok b{display:block;margin-bottom:2px}
.au-tm{position:fixed;inset:0;z-index:2100;background:rgba(3,8,20,.7);display:grid;place-items:center;padding:16px}.au-tm div{width:min(520px,100%);max-height:80vh;overflow:auto;background:#fff;color:#0f1c3a;border-radius:18px;padding:22px;line-height:1.55}.au-tm h3{margin:0 0 8px}.au-tm button{margin-top:12px;border:0;border-radius:12px;padding:10px 18px;background:#1f6fe0;color:#fff;font-weight:800;cursor:pointer}

.rp-art{position:absolute;right:-30px;top:-10px;width:62%;height:330px;background:radial-gradient(240px 200px at 70% 35%,rgba(255,176,96,.55),transparent 70%),linear-gradient(200deg,#3a2f7a,#1b3a7a 60%,transparent);background-size:cover;background-position:center;opacity:.85;-webkit-mask-image:linear-gradient(to left,#000 35%,transparent);mask-image:linear-gradient(to left,#000 35%,transparent)}
.au.light .rp-art{background:radial-gradient(240px 200px at 70% 35%,rgba(255,190,110,.85),transparent 70%),linear-gradient(200deg,#bcd8ff,#f3d3a8 60%,transparent);background-size:cover;background-position:center}
.rp-st{position:relative;display:flex;align-items:center;gap:10px;margin:0 0 18px;font-size:14px}.rp-st .n{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;border:1px solid var(--ab);background:var(--af)}.rp-st .n.on{background:#2b8bff;border-color:#2b8bff;color:#fff}.rp-st i{flex:1;height:2px;background:linear-gradient(90deg,#2b8bff,var(--ab));border-radius:2px}.rp-st b{color:var(--ac)}.rp-st span:last-child{color:var(--am)}
@media(max-width:520px){.au{padding:12px}.au-card{padding:20px 18px 18px;border-radius:24px}.au-h h2{font-size:26px}.au-th span{display:none}}
`;document.head.appendChild(s)}
function bgUrl(){try{const p=siteAssets[isDark()?'auth_bg_dark':'auth_bg_light'];return p?imageUrl(p):''}catch(e){return ''}}
function val(id){return $(id)?.value||''}
function snap(){keep={name:val('au-name'),email:val('au-email'),phone:val('au-phone'),ddi:val('au-ddi')||'+55',remember:$('au-rem')?$('au-rem').checked:true,terms:$('au-terms')?$('au-terms').checked:false}}
function field(id,icon,ph,type,extra){return '<label class="au-f">'+ic[icon]+'<input id="'+id+'" type="'+type+'" placeholder="'+ph+'" '+(extra||'')+'></label>'}
function render(){
 css();const root=$('auth-modal-root');if(!root)return;
 const dark=isDark(),bg=bgUrl();
 const signup=mode==='signup';
 let body='';
 const head='<div class="au-br"><img src="/apple-touch-icon.png?v=4" alt="IASD APP"><b>IASD <i>APP</i></b><small>IGREJA ADVENTISTA DO SÉTIMO DIA</small></div>';
 const ft='<div class="au-ft">'+ic.lockS.replace('<svg','<svg')+' Seus dados estão seguros.<br><b>IASD APP • Igreja Adventista do Sétimo Dia</b></div>';
 const note=notice?'<div class="au-ok" role="status"><b>✉ Cadastro recebido!</b>'+esc(notice)+'</div>':'';
 if(forgot){
  body=head+'<div class="au-h"><h2>Recuperar senha</h2><p>Informe seu e-mail e enviaremos um link para criar uma nova senha.</p></div>'+note+'<div id="au-fb" class="au-fb"></div>'+field('au-email','mail','Seu e-mail','email','autocomplete="email"')+'<button class="au-go" id="au-go" onclick="IASDAuth.reset()">Enviar link '+ic.arrow+'</button><div class="au-sw"><button class="lk" onclick="IASDAuth.show(\'login\')">← Voltar para entrar</button></div>'+ft;
 }else if(!signup){
  body=head+'<div class="au-h"><h2>Bem-vindo de volta!</h2><p>Acesse sua conta para continuar.</p></div>'+note+
  '<button class="au-g" onclick="signInWithGoogle()">'+GOOGLE+' Continuar com o Google</button><div class="au-dv">ou entre com seu e-mail</div><div id="au-fb" class="au-fb" role="alert"></div>'+
  field('au-email','mail','Seu e-mail','email','autocomplete="email" inputmode="email"')+
  '<label class="au-f">'+ic.lock+'<input id="au-pass" type="password" placeholder="Sua senha" autocomplete="current-password"><button type="button" class="eye" onclick="IASDAuth.eye(\'au-pass\')" aria-label="Mostrar senha">'+ic.eye+'</button></label>'+
  '<div class="au-rw"><label class="au-ck"><input type="checkbox" id="au-rem" '+(keep.remember===false?'':'checked')+'> Lembrar de mim</label><button class="lk" onclick="IASDAuth.forgot()">Esqueceu a senha?</button></div>'+
  '<button class="au-go" id="au-go" onclick="IASDAuth.submit()">Entrar '+ic.arrow+'</button><div class="au-dv">Ainda não tem uma conta?</div><button class="au-ol" onclick="IASDAuth.show(\'signup\')">'+ic.add+' Criar conta</button>'+ft;
 }else{
  body=head+'<div class="au-h"><h2>Crie sua conta</h2><p>Faça parte da nossa comunidade.</p></div>'+
  '<button class="au-g" onclick="signInWithGoogle()">'+GOOGLE+' Continuar com o Google</button><div class="au-dv">ou cadastre-se com seu e-mail</div><div id="au-fb" class="au-fb" role="alert"></div>'+
  field('au-name','user','Nome completo','text','autocomplete="name" maxlength="80"')+field('au-email','mail','E-mail','email','autocomplete="email" inputmode="email"')+
  '<label class="au-f">'+ic.lock+'<input id="au-pass" type="password" placeholder="Senha (mínimo de 6 caracteres)" autocomplete="new-password"><button type="button" class="eye" onclick="IASDAuth.eye(\'au-pass\')" aria-label="Mostrar senha">'+ic.eye+'</button></label>'+
  '<label class="au-f">'+ic.wa+'<input id="au-phone" type="tel" inputmode="tel" placeholder="WhatsApp (opcional)" autocomplete="tel-national"><select id="au-ddi" aria-label="País">'+DDI.map(d=>'<option value="'+d[1]+'" '+((keep.ddi||'+55')===d[1]?'selected':'')+'>'+d[0]+' '+d[1]+'</option>').join('')+'</select></label>'+
  '<div class="au-rw" style="margin-bottom:14px"><label class="au-ck"><input type="checkbox" id="au-terms" '+(keep.terms?'checked':'')+'> <span>Concordo com os <button class="lk" type="button" onclick="IASDAuth.doc(\'t\')">Termos de Uso</button> e <button class="lk" type="button" onclick="IASDAuth.doc(\'p\')">Política de Privacidade</button></span></label></div>'+
  '<button class="au-go" id="au-go" onclick="IASDAuth.submit()">Criar conta '+ic.arrow+'</button><div class="au-sw">Já tem uma conta? <button class="au-ol" onclick="IASDAuth.show(\'login\')">Entrar</button></div>'+ft;
 }
 root.innerHTML='<div class="au '+(dark?'dark':'light')+'" role="dialog" aria-modal="true" aria-label="'+(signup?'Criar conta':'Entrar')+'"><div class="au-bg '+(bg?'':'fb')+'" style="'+(bg?'background-image:url('+esc(bg)+')':'')+'"></div><button class="au-x" onclick="closeAuthModal()" aria-label="Fechar">×</button><button class="au-th" onclick="IASDAuth.theme()">'+(dark?ic.sun+'<span>Tema claro</span>':ic.moon+'<span>Tema escuro</span>')+'</button><form class="au-card" onsubmit="event.preventDefault();IASDAuth.submit()" novalidate>'+body+'</form></div>';
 root.querySelectorAll('button').forEach(b=>{b.type=b.id==='au-go'?'submit':'button';if(b.id==='au-go')b.removeAttribute('onclick')});
 const set=(id,v)=>{const e=$(id);if(e&&v)e.value=v};set('au-name',keep.name);set('au-email',keep.email);set('au-phone',keep.phone);
 (($('au-name')&&!keep.name)?$('au-name'):$('au-email'))?.focus();
}
function fb(msg,cls){const e=$('au-fb');if(!e)return;e.className='au-fb '+(cls||'err');e.innerHTML=msg}
function show(m){snap();mode=m;forgot=false;notice='';busy=false;render()}
function openAuth(signup){if(typeof cloudUser!=='undefined'&&cloudUser){go('Perfil');return}keep={};mode=signup?'signup':'login';forgot=false;notice='';busy=false;render()}
function theme(){snap();try{toggleTheme()}catch(e){}setTimeout(render,50)}
function eye(id){const i=$(id);if(i)i.type=i.type==='password'?'text':'password'}
const DOCS={t:['Termos de Uso','O IASD APP é uma ferramenta da igreja para organizar cultos, escalas, cronogramas, sonoplastia e atividades da comunidade. Ao criar uma conta você se compromete a usar o aplicativo de forma respeitosa, a manter seus dados corretos e a não compartilhar seu acesso. Algumas áreas são liberadas somente após aprovação da liderança da igreja, que pode alterar ou remover acessos quando necessário.'],p:['Política de Privacidade','Coletamos apenas o necessário para o funcionamento do app: nome, e-mail, WhatsApp (opcional), foto de perfil e sua participação nos jogos. Esses dados são usados somente para a organização da igreja (escalas, avisos e contato) e não são vendidos nem repassados a terceiros. Você pode pedir a correção ou a exclusão dos seus dados à liderança da igreja a qualquer momento.']};
function doc(k){const d=document.createElement('div');d.className='au-tm';d.onclick=e=>{if(e.target===d)d.remove()};d.innerHTML='<div><h3>'+DOCS[k][0]+'</h3><p>'+DOCS[k][1]+'</p><button onclick="this.closest(\'.au-tm\').remove()">Entendi</button></div>';document.body.appendChild(d)}
function forgotOpen(){snap();forgot=true;notice='';render()}
async function reset(){
 const email=val('au-email').trim();if(!/^\S+@\S+\.\S+$/.test(email))return fb('Informe um e-mail válido.');
 if(busy)return;busy=true;const b=$('au-go');b.disabled=true;
 const r=await cloud.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/'});busy=false;b.disabled=false;
 if(r.error&&/rate|limit|429/i.test(r.error.message||''))return fb('<b>Limite temporário de e-mails.</b> Tente de novo em alguns minutos.','warn');
 fb('Se este e-mail tiver cadastro, enviamos um link para criar uma nova senha. Confira também o spam.','warn');
}
async function submit(){
 if(busy)return;const signup=mode==='signup';
 const email=val('au-email').trim(),password=val('au-pass');
 const name=val('au-name').trim(),ddi=val('au-ddi')||'+55',rawPhone=val('au-phone').replace(/\D/g,'');
 if(signup&&name.length<3)return fb('Informe seu nome completo.');
 if(!/^\S+@\S+\.\S+$/.test(email))return fb('Informe um e-mail válido.');
 if(!password||password.length<6)return fb('A senha precisa ter pelo menos 6 caracteres.');
 if(signup&&rawPhone&&rawPhone.length<8)return fb('WhatsApp incompleto. Deixe em branco ou informe o número com DDD.');
 if(signup&&!$('au-terms').checked)return fb('Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.');
 keep.remember=$('au-rem')?$('au-rem').checked:true;
 busy=true;const b=$('au-go');b.disabled=true;b.firstChild.textContent='Aguarde… ';fb('','');
 try{
  let data;
  if(signup){
   const phone=rawPhone?(ddi==='+55'?rawPhone:ddi+rawPhone):'';
   const r=await cloud.auth.signUp({email,password,options:{data:{full_name:name,phone,whatsapp:phone}}});if(r.error)throw r.error;data=r.data;
   mode='login';notice='Se o cadastro for novo, enviamos um link de confirmação para '+email+'. Confira a caixa de entrada e o spam antes de entrar. Após confirmar, aguarde a liberação do fundador.';
   if(data.session){await cloud.auth.signOut();cloudUser=null;cloudRole=null}
   busy=false;keep={email,remember:true};render();return;
  }
  const r=await cloud.auth.signInWithPassword({email,password});
  if(r.error){
   const msg=String(r.error.message||'');
   if(/email.not.confirmed|email.not.verified|confirm.*email/i.test(msg)||r.error.code==='email_not_confirmed'){busy=false;b.disabled=false;return fb('<b>✉ Confirme seu e-mail primeiro.</b> Abra sua caixa de entrada e clique no link de confirmação (veja também o spam).','warn')}
   if(/rate.limit|429/i.test(msg)||r.error.status===429){busy=false;b.disabled=false;return fb('<b>Muitas tentativas.</b> Aguarde um pouco e tente novamente.','warn')}
   if(/invalid.login|invalid.credentials/i.test(msg))throw Error('E-mail ou senha incorretos.');
   throw r.error;
  }
  data=r.data;
  if(!data.user?.email_confirmed_at){await cloud.auth.signOut();cloudUser=null;cloudRole=null;busy=false;b.disabled=false;return fb('<b>✉ Confirme seu e-mail primeiro.</b> Verifique sua caixa de entrada e o spam.','warn')}
  try{if(keep.remember===false){localStorage.setItem('iasd-noremember','1');sessionStorage.setItem('iasd-alive','1')}else localStorage.removeItem('iasd-noremember')}catch(e){}
  cloudUser=data.user;authNotice='';closeAuthModal();await loadCloud();await loadMyProfile();go('Painel');
  const dn=(myProfile?.full_name||data.user.user_metadata?.full_name||data.user.email?.split('@')[0]||'').trim();showWelcomePopup(dn);
 }catch(e){busy=false;const x=$('au-go');if(x){x.disabled=false;x.firstChild.textContent=(mode==='signup'?'Criar conta':'Entrar')+' '}fb(esc(e.message||'Não foi possível acessar sua conta.'))}
}

/* ---------- primeiro acesso (obrigatório, também depois do Google) ---------- */
function maskBR(v){const d=v.replace(/\D/g,'').slice(0,11);if(d.length<=2)return d?'('+d:'';if(d.length<=6)return '('+d.slice(0,2)+') '+d.slice(2);if(d.length<=10)return '('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7)}
function rpPhone(){const i=$('rp-phone'),ddi=$('rp-ddi');if(i&&ddi&&ddi.value==='+55')i.value=maskBR(i.value)}
function rpFb(m){const e=$('rp-fb');if(e){e.className='au-fb '+(m?'err':'');e.textContent=m||''}}
function ensureRequired(){
 if(typeof cloudUser==='undefined'||!cloudUser||profileIsComplete())return;
 css();let root=$('required-profile-root');if(!root){root=document.createElement('div');root.id='required-profile-root';document.body.appendChild(root)}
 if(root.querySelector('.au-card'))return;
 const dark=isDark(),md=cloudUser.user_metadata||{};
 const name=String((typeof myProfile!=='undefined'&&myProfile?.full_name)||md.full_name||md.name||'').trim();
 let ph=String((typeof myProfile!=='undefined'&&myProfile?.phone)||md.phone||md.whatsapp||'');let ddi='+55';
 const m=ph.match(/^\+(\d{1,3})\s*(\d+)/);if(m){const f=DDI.find(d=>d[1]==='+'+m[1]);if(f){ddi=f[1];ph=m[2]}}
 const bg=bgUrl();
 root.innerHTML='<div class="au '+(dark?'dark':'light')+'" style="z-index:1901" role="dialog" aria-modal="true" aria-label="Primeiro acesso"><div class="au-bg fb" style="backdrop-filter:blur(6px)"></div>'+
 '<form class="au-card rp" onsubmit="event.preventDefault();IASDAuth.saveRequired()" novalidate style="position:relative;overflow:hidden">'+
 '<div class="rp-art" aria-hidden="true"'+(bg?' style="background-image:url('+esc(bg)+')"':'')+'></div>'+
 '<div class="au-br" style="grid-template-columns:auto 1fr;justify-items:start;gap:12px;text-align:left;position:relative"><img src="/apple-touch-icon.png?v=4" alt="" style="width:62px;height:62px"><div><b style="font-size:26px">IASD <i>APP</i></b><br><small>IGREJA ADVENTISTA DO SÉTIMO DIA</small></div></div>'+
 '<div style="position:relative;margin-top:18px"><small style="letter-spacing:.22em;font-weight:800;color:#f5b73a;font-size:12px">PRIMEIRO ACESSO</small><h2 style="margin:6px 0 8px;font-size:32px;line-height:1.08;font-weight:900">Bem-vindo ao<br>IASD <i style="font-style:normal;color:#f5b73a">APP!</i></h2><p style="margin:0 0 16px;color:var(--am);font-size:16px;max-width:30ch">Só precisamos de algumas informações para identificar sua conta.</p></div>'+
 '<div class="rp-st"><span class="n on">1</span><b>Identificação</b><i></i><span class="n">2</span><span>Pronto</span></div>'+
 '<label style="display:block;font-weight:700;margin:2px 0 6px">Nome completo</label><label class="au-f">'+ic.user+'<input id="rp-name" type="text" placeholder="Seu nome completo" autocomplete="name" maxlength="80" value="'+esc(name)+'"></label>'+
 '<label style="display:block;font-weight:700;margin:2px 0 6px">WhatsApp</label><label class="au-f" style="margin-bottom:6px">'+ic.wa+'<select id="rp-ddi" aria-label="País" onchange="IASDAuth.rpPhone()">'+DDI.map(d=>'<option value="'+d[1]+'" '+(ddi===d[1]?'selected':'')+'>'+d[0]+' '+d[1]+'</option>').join('')+'</select><input id="rp-phone" type="tel" inputmode="tel" placeholder="(75) 99999-9999" autocomplete="tel-national" oninput="IASDAuth.rpPhone()" value="'+esc(ph)+'"></label>'+
 '<small style="color:var(--am);display:block;margin:0 2px 12px">Usaremos este número apenas para recursos e comunicações da igreja.</small><div id="rp-fb" class="au-fb" role="alert"></div>'+
 '<div class="au-ft" style="margin:0 0 14px">'+ic.lockS+' Suas informações ficam protegidas no IASD APP.</div>'+
 '<button class="au-go" id="rp-go" type="submit">Concluir e entrar '+ic.arrow+'</button></form></div>';
 rpPhone();($('rp-name').value?$('rp-phone'):$('rp-name')).focus();
}
async function saveRequired(){
 if(typeof cloudUser==='undefined'||!cloudUser)return;
 const name=val('rp-name').trim(),ddi=val('rp-ddi')||'+55',raw=val('rp-phone').replace(/\D/g,'');
 if(name.length<3)return rpFb('Informe seu nome completo.');
 const digits=ddi==='+55'?raw.length:raw.length+ddi.length-1;
 if(ddi==='+55'?raw.length<10:raw.length<7)return rpFb(ddi==='+55'?'Informe o WhatsApp com DDD, por exemplo (75) 99999-9999.':'Informe um WhatsApp válido.');
 const phone=ddi==='+55'?maskBR(raw):ddi+' '+raw;
 const b=$('rp-go');b.disabled=true;b.firstChild.textContent='Salvando… ';
 const payload={user_id:cloudUser.id,full_name:name,phone,updated_at:new Date().toISOString()};
 const r=await cloud.from('iasd_profiles').upsert(payload);
 if(r.error){b.disabled=false;b.firstChild.textContent='Concluir e entrar ';return rpFb('Não foi possível salvar: '+r.error.message)}
 myProfile={...(myProfile||{}),...payload};$('required-profile-root')?.remove();syncAccountUI();render();showWelcomePopup(name);
}

/* nova senha (link do e-mail) */
function newPass(){
 css();const root=$('auth-modal-root');if(!root)return;const dark=isDark();
 root.innerHTML='<div class="au '+(dark?'dark':'light')+'"><div class="au-bg fb"></div><form class="au-card" onsubmit="event.preventDefault();IASDAuth.savePass()"><div class="au-br"><img src="/apple-touch-icon.png?v=4" alt=""><b>IASD <i>APP</i></b></div><div class="au-h"><h2>Nova senha</h2><p>Escolha uma nova senha para sua conta.</p></div><div id="au-fb" class="au-fb"></div><label class="au-f">'+ic.lock+'<input id="au-np" type="password" placeholder="Nova senha (mínimo de 6 caracteres)" autocomplete="new-password"><button type="button" class="eye" onclick="IASDAuth.eye(\'au-np\')">'+ic.eye+'</button></label><button class="au-go" id="au-go" type="submit">Salvar senha '+ic.arrow+'</button></form></div>';
}
async function savePass(){
 const p=val('au-np');if(p.length<6)return fb('A senha precisa ter pelo menos 6 caracteres.');
 const r=await cloud.auth.updateUser({password:p});if(r.error)return fb(esc(r.error.message));
 closeAuthModal();alert('Senha alterada com sucesso!');try{history.replaceState(null,'',location.pathname)}catch(e){}
}
/* lembrar de mim: sem a marcação, encerra a sessão ao abrir o navegador de novo */
function watch(){
 if(!window.iasdCloud)return;
 window.iasdCloud.auth.onAuthStateChange((ev,ss)=>{
  if(ev==='PASSWORD_RECOVERY')setTimeout(newPass,0);
  if(ss&&(ev==='INITIAL_SESSION'||ev==='SIGNED_IN')){try{
   if(localStorage.getItem('iasd-noremember')==='1'&&!sessionStorage.getItem('iasd-alive')&&!/access_token=|[?&]code=/.test(location.hash+location.search)){localStorage.removeItem('iasd-noremember');localStorage.removeItem('iasd-auth-backup');setTimeout(()=>window.iasdCloud.auth.signOut(),0)}
   sessionStorage.setItem('iasd-alive','1')}catch(e){}}
 });
}
window.ensureRequiredProfile=ensureRequired;window.saveRequiredProfile=saveRequired;window.renderAuthModal=render;window.openAuthModal=openAuth;window.switchAuthMode=m=>show(m?'signup':'login');window.submitAuthModal=submit;
window.IASDAuth={rpPhone,saveRequired,show,submit,eye,theme,doc,forgot:forgotOpen,reset,savePass,open:openAuth};
watch();
})();
