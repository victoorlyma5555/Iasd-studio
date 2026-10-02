/* IASD APP — service worker só para notificações push (sem cache: não interfere no carregamento do site). */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{
 let d={};try{d=e.data?e.data.json():{}}catch{try{d={body:e.data.text()}}catch{}}
 const title=String(d.title||'IASD APP').slice(0,80);
 const opt={body:String(d.body||'').slice(0,300),icon:'/icon-192.png?v=4',badge:'/icon-192.png?v=4',tag:String(d.tag||'iasd-push'),renotify:true,requireInteraction:!!d.sticky,vibrate:[160,80,160],data:{url:String(d.url||'/')}};
 e.waitUntil(self.registration.showNotification(title,opt));
});
self.addEventListener('notificationclick',e=>{
 e.notification.close();
 const url=new URL(e.notification.data&&e.notification.data.url||'/',self.location.origin).href;
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
  for(const c of list){if(c.url.startsWith(self.location.origin)&&'focus' in c){return c.focus()}}
  return self.clients.openWindow(url)}));
});
