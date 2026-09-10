// ===== v1.4 Navigation / Favorites / Live Metrics =====
function openPage(pageId){
  document.querySelectorAll('.appPage').forEach(page=>page.classList.toggle('hidden',page.id!==pageId));
  document.querySelectorAll('.navBtn').forEach(btn=>btn.classList.toggle('active',btn.dataset.page===pageId));
  window.scrollTo({top:0,behavior:'smooth'});
  try{
    if(pageId==='pageMatch' && typeof matchAnalyze==='function') setTimeout(matchAnalyze,30);
    if(pageId==='pageAcademy' && typeof academyRender==='function') setTimeout(()=>academyRender(-1),30);
    if(pageId==='pageTactics' && typeof drawRoute==='function') setTimeout(drawRoute,30);
    if(typeof window.pesV14PageOpened==='function') window.pesV14PageOpened(pageId);
  }catch(err){console.warn('page refresh',err)}
}
window.openPage=openPage;
document.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>openPage(btn.dataset.page)));
document.querySelectorAll('[data-open-page]').forEach(btn=>btn.addEventListener('click',()=>openPage(btn.dataset.openPage)));

function liveMetrics(){
  const a=$('support'),b=$('lineSlider'),c=$('compactSlider');
  if(!a||!b||!c)return;
  $('metricSupport').textContent=a.value+'/10';$('metricLine').textContent=b.value+'/10';$('metricCompact').textContent=c.value+'/10';
}
['support','lineSlider','compactSlider'].forEach(id=>$(id)?.addEventListener('input',liveMetrics));
liveMetrics();

function favKey(){return currentTeam&&current?'pes3_v13_fav_'+currentTeam.name+'_'+current.title:''}
function updateFavorite(){
  if(!currentTeam||!current||!$('favorite'))return;
  const fav=localStorage.getItem(favKey())==='1';
  $('favorite').textContent=fav?'★ TERSIMPAN DI FAVORIT':'☆ TAMBAH KE FAVORIT';
  $('favorite').classList.toggle('isFav',fav);
  if(typeof window.pesV14RefreshHome==='function') window.pesV14RefreshHome();
}
$('favorite')?.addEventListener('click',()=>{
  const next=localStorage.getItem(favKey())!=='1';localStorage.setItem(favKey(),next?'1':'0');updateFavorite();toastMsg(next?'Ditambahkan ke favorit.':'Dihapus dari favorit.');
});
team?.addEventListener('change',()=>setTimeout(()=>{liveMetrics();updateFavorite();if(typeof matchSyncOur==='function')matchSyncOur();if(typeof matchAnalyze==='function')matchAnalyze()},30));
preset?.addEventListener('change',()=>setTimeout(()=>{liveMetrics();updateFavorite();if(typeof matchSyncOur==='function')matchSyncOur();if(typeof matchAnalyze==='function')matchAnalyze()},30));
updateFavorite();
