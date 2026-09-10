// ===== PWA install + safe update flow v1.4 =====
let deferredInstallPrompt=null;
const installButton=document.getElementById('installApp');
const netState=document.getElementById('netState');
const netDot=document.getElementById('netDot');
const updateBanner=document.getElementById('updateBanner');
const applyUpdate=document.getElementById('applyUpdate');
let pendingWorker=null;

function updateNetworkState(){
  if(!netState||!netDot)return;const online=navigator.onLine;
  netState.textContent=online?'ONLINE':'OFFLINE MODE';netDot.classList.toggle('off',!online);
}
window.addEventListener('online',updateNetworkState);window.addEventListener('offline',updateNetworkState);updateNetworkState();

window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;if(installButton){installButton.hidden=false;installButton.textContent='⬇'}});
if(installButton)installButton.addEventListener('click',async()=>{
  if(!deferredInstallPrompt){if(typeof toastMsg==='function')toastMsg('Gunakan menu browser → Install app / Tambahkan ke layar utama.');return}
  deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installButton.hidden=true;
});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;if(installButton)installButton.hidden=true;if(typeof toastMsg==='function')toastMsg('PES3 Coach berhasil dipasang.')});

function showUpdate(worker){pendingWorker=worker;if(updateBanner)updateBanner.hidden=false}
if(applyUpdate)applyUpdate.addEventListener('click',()=>{if(pendingWorker)pendingWorker.postMessage({type:'SKIP_WAITING'})});

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./service-worker.js');
      if(reg.waiting)showUpdate(reg.waiting);
      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;if(!worker)return;
        worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(worker)});
      });
      // Check for an update when the PWA is opened, without blocking startup.
      setTimeout(()=>reg.update().catch(()=>{}),2500);
    }catch(err){console.warn('Service worker registration failed',err)}
  });
  let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
}
