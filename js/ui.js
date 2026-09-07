// ===== v1.3 Navigation / Favorites / Live Metrics =====
document.querySelectorAll('.tabBtn').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tabBtn').forEach(x=>x.classList.toggle('active',x===btn));
  document.querySelectorAll('.tabPage').forEach(x=>x.classList.toggle('hidden',x.id!==btn.dataset.tab));
  if(btn.dataset.tab==='tabMatch') setTimeout(matchAnalyze,20);
  if(btn.dataset.tab==='tabAcademy') setTimeout(()=>academyScenario&&academyRender(-1),20);
}));
function liveMetrics(){
  $('metricSupport').textContent=$('support').value+'/10';$('metricLine').textContent=$('lineSlider').value+'/10';$('metricCompact').textContent=$('compactSlider').value+'/10';
}
['support','lineSlider','compactSlider'].forEach(id=>$(id).addEventListener('input',liveMetrics));liveMetrics();
function favKey(){return currentTeam&&current?'pes3_v13_fav_'+currentTeam.name+'_'+current.title:''}
function updateFavorite(){if(!currentTeam||!current)return;const fav=localStorage.getItem(favKey())==='1';$('favorite').textContent=fav?'★ TERSIMPAN DI FAVORIT':'☆ TAMBAH KE FAVORIT';$('favorite').style.background=fav?'var(--gold)':'#111722';$('favorite').style.color=fav?'#181c22':'var(--gold)'}
$('favorite').onclick=()=>{const next=localStorage.getItem(favKey())!=='1';localStorage.setItem(favKey(),next?'1':'0');updateFavorite();toastMsg(next?'Ditambahkan ke favorit.':'Dihapus dari favorit.')};
team.addEventListener('change',()=>setTimeout(()=>{liveMetrics();updateFavorite();matchSyncOur();matchAnalyze()},20));preset.addEventListener('change',()=>setTimeout(()=>{liveMetrics();updateFavorite();matchSyncOur();matchAnalyze()},20));updateFavorite();
