// ===== PWA install + service worker =====
let deferredInstallPrompt = null;
const installButton = document.getElementById('installApp');
const netState = document.getElementById('netState');
const netDot = document.getElementById('netDot');

function updateNetworkState(){
  if(!netState || !netDot) return;
  const online = navigator.onLine;
  netState.textContent = online ? 'ONLINE' : 'OFFLINE MODE';
  netDot.classList.toggle('off', !online);
}
window.addEventListener('online', updateNetworkState);
window.addEventListener('offline', updateNetworkState);
updateNetworkState();

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if(installButton){
    installButton.hidden = false;
    installButton.classList.add('ready');
    installButton.textContent = '⬇ INSTALL APP';
  }
});

if(installButton){
  installButton.addEventListener('click', async () => {
    if(!deferredInstallPrompt){
      if(typeof toastMsg === 'function') toastMsg('Buka menu browser lalu pilih Tambahkan ke layar utama / Install app.');
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if(installButton) installButton.hidden = true;
  if(typeof toastMsg === 'function') toastMsg('PES3 Coach berhasil dipasang.');
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
