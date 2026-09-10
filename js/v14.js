// ===== PES3 Coach v1.4 — Home, Match Engine 2.0, Solver, Set Piece, Backup =====
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const APP_PREFIXES=['pes3_'];
  const statsKey='pes3_v14_stats';
  const recentsKey='pes3_v14_recents';
  let matchScore={our:0,opp:0,minute:0};
  let matchRunId=0;
  let solverRecommended=null;
  let setPieceRAF=null;

  function getStats(){
    try{return Object.assign({passing:0,shooting:0,defending:0,tactical:0,matchGood:0,matchBad:0},JSON.parse(localStorage.getItem(statsKey)||'{}'))}catch{return{passing:0,shooting:0,defending:0,tactical:0,matchGood:0,matchBad:0}}
  }
  function saveStats(s){localStorage.setItem(statsKey,JSON.stringify(s))}
  function bumpStat(k,n=1){const s=getStats();s[k]=(s[k]||0)+n;saveStats(s);refreshProfile()}
  function xp(){return +(localStorage.getItem('pes3_academy_xp')||0)}
  function streak(){return +(localStorage.getItem('pes3_academy_streak')||0)}
  function favCount(){let n=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('pes3_v13_fav_')&&localStorage.getItem(k)==='1')n++}return n}
  function levelInfo(){const s=getStats();const activity=s.passing+s.shooting+s.defending+s.tactical+s.matchGood;const level=clamp(1+Math.floor((xp()+activity*22)/450),1,99);const rank=level>=25?'LEGEND':level>=18?'SUPERSTAR':level>=12?'PROFESSIONAL':level>=6?'AMATEUR':'BEGINNER';return{level,rank}}

  function recordRecent(){
    if(typeof currentTeam==='undefined'||!currentTeam||typeof current==='undefined'||!current)return;
    let list=[];try{list=JSON.parse(localStorage.getItem(recentsKey)||'[]')}catch{}
    const item={team:currentTeam.name,title:current.title,form:current.form,preset:preset.value,at:Date.now()};
    list=[item,...list.filter(x=>!(x.team===item.team&&x.title===item.title))].slice(0,5);
    localStorage.setItem(recentsKey,JSON.stringify(list));refreshHome();
  }
  function renderRecents(){
    const box=el('recentTactics');if(!box)return;let list=[];try{list=JSON.parse(localStorage.getItem(recentsKey)||'[]')}catch{}
    if(!list.length){box.innerHTML='<div class="recentEmpty">Belum ada riwayat. Buka Tactical Lab dan pilih sebuah taktik.</div>';return}
    box.innerHTML=list.map((x,i)=>`<div class="recentItem"><div><strong>${escapeHtml(x.team)} • ${escapeHtml(x.form)}</strong><small>${escapeHtml(x.title)}</small></div><button data-recent="${i}">›</button></div>`).join('');
    box.querySelectorAll('[data-recent]').forEach(btn=>btn.onclick=()=>{
      const x=list[+btn.dataset.recent];if(!x)return;
      if([...team.options].some(o=>o.value===x.team)){team.value=x.team;loadTeam();if([...preset.options].some(o=>o.value===String(x.preset))){preset.value=String(x.preset);load()}}
      openPage('pageTactics');setTimeout(refreshTacticMeta,20);
    });
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

  function refreshHome(){
    const li=levelInfo();
    if(el('homeXp'))el('homeXp').textContent=xp();if(el('homeStreak'))el('homeStreak').textContent=streak();if(el('homeFavs'))el('homeFavs').textContent=favCount();
    ['homeLevel','topLevel'].forEach(id=>{if(el(id))el(id).textContent=li.level});if(el('homeRank'))el('homeRank').textContent=li.rank;
    renderRecents();refreshProfile();
  }
  window.pesV14RefreshHome=refreshHome;
  window.pesV14PageOpened=(page)=>{if(page==='pageHome')refreshHome();if(page==='pageCoach')refreshProfile();if(page==='pageMatch')syncScoreboard()};

  // Home actions
  el('continueTraining')?.addEventListener('click',()=>{openPage('pageAcademy');setTimeout(()=>{if(el('academyCat')){const opt=[...el('academyCat').options].find(o=>/Umpan|Passing/i.test(o.text));if(opt){el('academyCat').value=opt.value;el('academyCat').dispatchEvent(new Event('change'))}}},30)});
  el('dailyChallengeBtn')?.addEventListener('click',()=>{openPage('pageMatch');toastMsg('Daily Challenge aktif: selesaikan peluang dengan maksimal 5 umpan.');});
  const daily=[['Cetak gol maksimal 5 umpan','Main vertikal, tetapi jangan paksa passing lane tertutup.'],['Rebut bola tanpa sliding','Gunakan jockey, cover lane, lalu standing tackle.'],['10 umpan tanpa kehilangan bola','Gunakan triangle support dan putar arah serangan.'],['Bongkar high press','Libatkan GK/CB lalu serang ruang di belakang presser.'],['Buat peluang dari sisi lapangan','Switch play lalu cari cut-back, bukan crossing buta.']];
  const di=Math.floor(Date.now()/86400000)%daily.length;if(el('dailyChallengeTitle'))el('dailyChallengeTitle').textContent=daily[di][0];if(el('dailyChallengeDesc'))el('dailyChallengeDesc').textContent=daily[di][1];

  // Tactical segmented UI
  document.querySelectorAll('[data-tactic-panel]').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('[data-tactic-panel]').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('.tacticPanel').forEach(p=>p.classList.toggle('hidden',p.id!==btn.dataset.tacticPanel));
    if(btn.dataset.tacticPanel==='panelPlan')setTimeout(drawRoute,20);
  });
  function refreshTacticMeta(){
    if(!currentTeam||!current)return;
    if(el('tacticStyleSub'))el('tacticStyleSub').textContent=currentTeam.style+' • '+current.arch;
    const s=current.s;const support=+(el('support')?.value||s.support),line=+(el('lineSlider')?.value||s.line),compact=+(el('compactSlider')?.value||s.compact);
    let risk=support>=7?'Passing distance tinggi: lebih cepat, tetapi lane lebih mudah dibaca.':support<=4?'Support dekat: cocok untuk one-two dan sirkulasi aman.':'Jarak support seimbang untuk kombinasi dan progresi.';
    risk+=' '+(line>=7?'High line memperkuat pressing tetapi ruang belakang besar.':line<=3?'Low line melindungi ruang belakang tetapi memberi lawan area di tengah.':'Garis pertahanan moderat menjaga keseimbangan.');
    risk+=' '+(compact>=8?'Compactness tinggi memadatkan tengah; lindungi switch ke flank.':'Compactness sedang memberi coverage lebih lebar.');
    if(el('tacticInsight'))el('tacticInsight').innerHTML=`<strong>TACTICAL READ</strong>${escapeHtml(risk)}`;
  }
  ['team','preset','support','lineSlider','compactSlider'].forEach(id=>el(id)?.addEventListener('change',()=>setTimeout(()=>{refreshTacticMeta();recordRecent()},25)));
  ['support','lineSlider','compactSlider'].forEach(id=>el(id)?.addEventListener('input',refreshTacticMeta));
  el('play')?.addEventListener('click',recordRecent);el('save')?.addEventListener('click',recordRecent);
  el('tacticHelp')?.addEventListener('click',()=>toastMsg('Tip: buka SETTING untuk ubah support/def line/compactness, lalu PLAY TACTIC untuk melihat pola.'));

  // Tactic search/filter
  const tacticSearch=el('tacticSearch');
  function filterTactics(){
    if(!tacticSearch||!currentTeam)return;const q=tacticSearch.value.trim().toLowerCase();const selected=preset.value;preset.innerHTML='';
    const dnaText=`${currentTeam.dnaTemplate} club dna ${currentTeam.style}`.toLowerCase();
    if(!q||dnaText.includes(q))preset.add(new Option('★ '+currentTeam.dnaTemplate+' • CLUB DNA','dna'));
    TEMPLATES.forEach((t,i)=>{const hay=`${t.form} ${t.name} ${t.arch} ${t.s.a} ${t.s.b} ${t.s.area} ${t.s.press}`.toLowerCase();if(!q||hay.includes(q))preset.add(new Option(t.form+' • '+t.name,i))});
    if(!preset.options.length){const o=new Option('Tidak ada taktik yang cocok','');o.disabled=true;preset.add(o);return}
    if([...preset.options].some(o=>o.value===selected))preset.value=selected;else{preset.selectedIndex=0;load();refreshTacticMeta()}
  }
  tacticSearch?.addEventListener('input',filterTactics);
  team?.addEventListener('change',()=>{if(tacticSearch)tacticSearch.value='';setTimeout(refreshTacticMeta,25)});

  // Share/copy tactic text
  el('shareTactic')?.addEventListener('click',async()=>{
    if(!currentTeam||!current)return;const s=current.s;const text=`${currentTeam.name} — ${current.form} ${current.title}\nAttacking Style: ${s.a}\nBuild Up: ${s.b}\nAttacking Area: ${s.area}\nPositioning: ${s.pos}\nSupport Range: ${el('support').value}/10\nDefensive Style: ${s.d}\nContainment Area: ${s.cont}\nPressuring: ${s.press}\nDefensive Line: ${el('lineSlider').value}/10\nCompactness: ${el('compactSlider').value}/10\nAdvanced: ${s.aa1}; ${s.aa2}; ${s.ad1}; ${s.ad2}`;
    try{await navigator.clipboard.writeText(text);toastMsg('Setting taktik disalin ke clipboard.')}catch{toastMsg('Clipboard tidak tersedia pada browser ini.')}recordRecent();
  });

  // ===== Match Engine 2.0 =====
  function shortTeam(name){return String(name||'TEAM').replace('Manchester ','Man ').replace('Paris Saint-Germain','PSG').slice(0,15)}
  function syncScoreboard(){
    if(el('scoreOur'))el('scoreOur').textContent=matchScore.our;if(el('scoreOpp'))el('scoreOpp').textContent=matchScore.opp;
    if(el('matchClock'))el('matchClock').textContent=String(matchScore.minute).padStart(2,'0')+':00';
    if(el('scoreOurTeam'))el('scoreOurTeam').textContent=shortTeam(currentTeam?.name);if(el('scoreOppTeam'))el('scoreOppTeam').textContent=shortTeam(matchOppTeam?.value);
    if(el('matchPhase'))el('matchPhase').textContent=matchScore.minute>=90?'FULL TIME':matchScore.minute?'IN MATCH':'PRE-MATCH';
    if(el('matchPlay'))el('matchPlay').textContent=matchScore.minute>=90?'↺ MATCH SELESAI':'▶ '+(matchScore.minute?'NEXT POSSESSION':'PLAY MATCH');
  }
  function resetMatchV14(){matchRunId++;matchScore={our:0,opp:0,minute:0};if(el('matchEventFeed'))el('matchEventFeed').innerHTML='';if(el('decisionOverlay'))el('decisionOverlay').hidden=true;try{matchRenderBoard()}catch{}syncScoreboard();toastMsg('Match di-reset.')}
  el('resetMatch')?.addEventListener('click',resetMatchV14);
  matchOppTeam?.addEventListener('change',()=>setTimeout(syncScoreboard,20));team?.addEventListener('change',()=>setTimeout(syncScoreboard,20));
  function feed(text,type=''){const box=el('matchEventFeed');if(!box)return;const c=document.createElement('span');c.className='eventChip '+type;c.textContent=`${String(matchScore.minute).padStart(2,'0')}′ ${text}`;box.prepend(c);while(box.children.length>10)box.removeChild(box.lastChild)}
  function ourP(i){const p=matchRec.pos[i];return{x:p[1],y:p[2]}}
  function oppP(i){const p=matchOpp.pos[i];return{x:1-p[1],y:1-p[2]}}
  function setPos(node,p){if(!node||!p)return;node.style.left=p.x*100+'%';node.style.top=p.y*100+'%'}
  function updateOpponentAI(ballPos,phase){
    if(!matchOppEls?.length)return;const press=matchOpp.s.press==='Aggressive'?.16:.085;const compact=(matchOpp.s.compact||7)/10;
    matchOppEls.forEach((node,i)=>{const base=oppP(i);if(matchOpp.pos[i][0]==='GK'){setPos(node,base);return}const d=Math.hypot(ballPos.x-base.x,ballPos.y-base.y);let p={...base};if(d<.46){p.x+=clamp(ballPos.x-base.x,-.12,.12)*press*(1.4+.4*phase);p.y+=clamp(ballPos.y-base.y,-.12,.12)*press*(1.4+.4*phase)}p.x=.5+(p.x-.5)*(1-(compact-.5)*.15);setPos(node,p)})
  }
  function animateBall(a,b,ms,label,arc=false,runId=matchRunId){
    return new Promise(resolve=>{const start=performance.now();matchBall.style.display='block';matchBadge.textContent=label;const tick=now=>{if(runId!==matchRunId){resolve(false);return}let t=clamp((now-start)/ms,0,1);const sm=t*t*(3-2*t);let p={x:a.x+(b.x-a.x)*sm,y:a.y+(b.y-a.y)*sm};if(arc)p.y-=Math.sin(Math.PI*sm)*.08;setPos(matchBall,p);updateOpponentAI(p,sm);if(t<1)requestAnimationFrame(tick);else resolve(true)};requestAnimationFrame(tick)})
  }
  function findNearestOpponent(a,b){
    let best={i:-1,d:99,p:null};matchOpp.pos.forEach((_,i)=>{if(matchOpp.pos[i][0]==='GK')return;const p=oppP(i);const vx=b.x-a.x,vy=b.y-a.y,l=vx*vx+vy*vy;let t=l?((p.x-a.x)*vx+(p.y-a.y)*vy)/l:0;t=clamp(t,0,1);const q={x:a.x+vx*t,y:a.y+vy*t},d=Math.hypot(p.x-q.x,p.y-q.y);if(t>.15&&t<.92&&d<best.d)best={i,d,p}});return best
  }
  function expectedDecision(){
    const s=matchOpp.s,txt=(matchOpp.name+' '+matchOpp.arch).toLowerCase();
    if(s.line>=7)return{action:'THROUGH',prompt:'GARIS LAWAN TINGGI • SERANG RUANG BELAKANG'};
    if(s.compact>=8&&s.cont==='Center')return{action:'CROSS',prompt:'TENGAH RAPAT • PINDAHKAN KE SISI'};
    if(s.press==='Aggressive'||txt.includes('gegen'))return{action:'PASS',prompt:'PRESSING DATANG • SATU SENTUHAN AMAN'};
    if(s.area==='Wide')return{action:'PASS',prompt:'JANGAN PAKSA CROSS • RESET & CARI HALF-SPACE'};
    return Math.random()<.45?{action:'THROUGH',prompt:'RUNNER LEPAS • TIMING THROUGH PASS'}:{action:'PASS',prompt:'JAGA BOLA • BUAT SATU UMPAN AMAN'};
  }
  function askDecision(runId){
    return new Promise(resolve=>{const overlay=el('decisionOverlay'),timer=el('decisionTimer'),prompt=el('decisionPrompt');const expected=expectedDecision();overlay.hidden=false;prompt.textContent=expected.prompt;let remaining=1.9,done=false;timer.textContent=remaining.toFixed(1)+'s';const buttons=[...overlay.querySelectorAll('[data-match-action]')];buttons.forEach(b=>{b.classList.remove('good','bad');b.onclick=()=>finish(b.dataset.matchAction,b)});
      const int=setInterval(()=>{if(runId!==matchRunId){clearInterval(int);if(!done){done=true;resolve({choice:'CANCEL',expected})}return}remaining-=.1;timer.textContent=Math.max(0,remaining).toFixed(1)+'s';if(remaining<=0)finish('TIMEOUT')},100);
      function finish(choice,btn){if(done)return;done=true;clearInterval(int);const ok=choice===expected.action;if(btn)btn.classList.add(ok?'good':'bad');buttons.forEach(b=>{if(b.dataset.matchAction===expected.action)b.classList.add('good')});setTimeout(()=>{overlay.hidden=true;buttons.forEach(b=>b.classList.remove('good','bad'))},520);resolve({choice,expected,ok})}
    })
  }
  async function opponentCounter(start,runId){
    matchBadge.textContent='TURNOVER • COUNTER LAWAN';const forwards=matchOpp.pos.map((p,i)=>({p,i})).filter(x=>['CF','SS','LWF','RWF','AMF','LSS','RSS'].includes(x.p[0]));const target=forwards.length?oppP(forwards.sort((a,b)=>b.p[2]-a.p[2])[0].i):{x:.5,y:.78};await animateBall(start,target,650,'OPP COUNTER',false,runId);const goal={x:target.x<.5?.58:.42,y:.965};await animateBall(target,goal,480,'OPP SHOT',false,runId);const danger=.24+(current.s.line>=7?.13:0)+(matchOpp.s.a==='Counter Attack'?.07:0);if(Math.random()<danger){matchScore.opp++;matchBadge.textContent='GOAL LAWAN';feed('Gol lawan setelah turnover','danger')}else{matchBadge.textContent='SAVE / BLOCK';feed('Counter lawan dihentikan')};syncScoreboard();
  }
  async function finishOurAttack(last,runId){
    const goal={x:last.x<.45?.59:last.x>.55?.41:.53,y:.025};await animateBall(last,goal,470,'SHOOT',false,runId);
    const attack=(currentTeam?.attackBias||1)+(matchRec.s.a==='Counter Attack'?.5:.2)+(matchRec.s.support<=5?.2:0);const defend=(matchOpp.s.compact||7)/10+(matchOpp.s.line<=4?.25:0);const pGoal=clamp(.32+attack*.055-defend*.09,.18,.64),r=Math.random();
    if(r<pGoal){matchScore.our++;matchBadge.textContent='GOAL!';feed('GOAL • pola berhasil','goal');bumpStat('tactical',1)}else if(r<pGoal+.25){matchBadge.textContent='SAVE KIPER';feed('Shot on target • ditepis kiper')}else if(r<pGoal+.42){matchBadge.textContent='BLOCKED';feed('Tembakan diblok')}else if(r<pGoal+.55){matchBadge.textContent='CORNER';feed('Deflection • corner')}else{matchBadge.textContent='WIDE';feed('Tembakan melebar')};syncScoreboard();
  }
  async function playMatchV14(){
    if(matchScore.minute>=90){resetMatchV14();return}
    if(typeof matchAnalyze==='function')matchAnalyze();if(!matchRec||!matchOpp)return;
    const runId=++matchRunId;try{matchRenderBoard()}catch{};syncScoreboard();el('matchPlay').disabled=true;matchScore.minute=clamp(matchScore.minute+6+Math.floor(Math.random()*8),1,90);syncScoreboard();feed('Possession dimulai');
    const seq=buildEvents(matchRec).filter(e=>e.type!=='SHOOT');const count=Math.min(seq.length,4);let last=ourP(seq[0]?.from??5);
    for(let i=0;i<count;i++){
      const e=seq[i],a=ourP(e.from),b=e.to>=0?ourP(e.to):last;last=b;await animateBall(a,b,520+(e.type==='LONG PASS'||e.type==='CROSS'?220:0),e.type,e.type==='LONG PASS'||e.type==='CROSS',runId);if(runId!==matchRunId)return;
      if(i===Math.min(1,count-1)){
        matchBadge.textContent='READ THE GAME';const result=await askDecision(runId);if(runId!==matchRunId)return;
        if(!result.ok){bumpStat('matchBad',1);feed(result.choice==='TIMEOUT'?'Terlambat mengambil keputusan':'Keputusan salah','danger');const near=findNearestOpponent(a,b);const ip=near.p||{x:(a.x+b.x)/2,y:(a.y+b.y)/2};await animateBall(b,ip,330,'INTERCEPTED',false,runId);await opponentCounter(ip,runId);el('matchPlay').disabled=false;return}
        bumpStat('matchGood',1);bumpStat('tactical',1);feed('Perfect read • '+result.choice,'goal');matchBadge.textContent='GOOD DECISION';await sleep(250);
      }
    }
    await finishOurAttack(last,runId);el('matchPlay').disabled=false;if(matchScore.minute>=90){matchBadge.textContent='FULL TIME';feed(`FT ${matchScore.our}-${matchScore.opp}`)}
  }
  if(el('matchPlay'))el('matchPlay').onclick=playMatchV14;

  // ===== Problem Solver =====
  const solverRules={
    intercept:{keys:['Tiki-Taka Classic','Possession Triangle','Slow Build 4-3-3'],title:'ANTI INTERCEPT • SUPPORT DEKAT',support:3,line:5,compact:8,attack:'Short Pass + triangle support. Dua umpan aman sebelum progresi.',defend:'Jangan kehilangan shape setelah salah umpan; DMF tetap menjadi rest-defence.',tip:'Buka badan sebelum X. Jika jalur lurus tertutup, reset ke CMF/CB lalu pindah sisi.'},
    through:{keys:['Mid Block','Low Block Counter','Balanced 4-2-3-1'],title:'ANTI THROUGH BALL • PROTECT DEPTH',support:5,line:3,compact:9,attack:'Serang setelah recovery, tetapi sisakan DMF di depan CB.',defend:'Turunkan defensive line dan jangan keluarkan CB mengejar AMF.',tip:'Kontrol DMF untuk memotong pengumpan. CB hanya duel saat striker sudah menerima bola.'},
    tiki:{keys:['Narrow Press','Gegenpress','Vertical Counter'],title:'ANTI TIKI-TAKA • CUT THE LANE',support:4,line:6,compact:9,attack:'Begitu merebut bola, progresi vertikal sebelum shape lawan pulih.',defend:'Tutup penerima di antara lini. Press saat penerima membelakangi gawang.',tip:'Jangan mengejar bola keliling lapangan. Paksa sirkulasi ke sisi lalu jebak.'},
    press:{keys:['Slow Build','Tiki-Taka Classic','Possession Triangle'],title:'PRESS RESISTANCE • THIRD MAN',support:2,line:5,compact:8,attack:'Tarik presser dengan CB/GK, lalu gunakan third-man pass atau switch.',defend:'Setelah kehilangan bola, compact dulu sebelum menekan balik.',tip:'Satu sentuhan bila ditekan. Jangan sprint saat menerima bola.'},
    cross:{keys:['Mid Block','Balanced','Control 3-5-2'],title:'ANTI CROSS • PROTECT CUT-BACK',support:5,line:4,compact:8,attack:'Counter ruang di belakang fullback lawan.',defend:'Winger ikut cover flank; CB menjaga kotak, FB menutup pengirim crossing.',tip:'Prioritas block cross, bukan sliding. Tutup jalur cut-back ke penalty spot.'},
    bus:{keys:['Wide Overload','Positional 3-2-4-1','Tiki-Taka Diamond'],title:'BREAK LOW BLOCK • WIDTH + CUTBACK',support:3,line:7,compact:7,attack:'Lebarkan blok dengan switch play, overload flank, lalu cut-back.',defend:'Rest-defence 2+1 untuk menghentikan counter setelah serangan gagal.',tip:'Jangan spam crossing tinggi. Pancing FB keluar lalu serang ruang di belakangnya.'},
    finish:{keys:['Double 10','Rapid Transition','Wide Overload'],title:'CREATE BETTER SHOTS • FINAL THIRD',support:4,line:6,compact:8,attack:'Cari cut-back, one-two, atau through saat CB bergerak keluar.',defend:'Counterpress singkat setelah shot diblok untuk second chance.',tip:'Jangan shoot sambil badan membelakangi gawang. Set touch lalu arahkan ke sudut.'}
  };
  function findTemplate(keys){for(const k of keys){const z=TEMPLATES.find(t=>(t.name+' '+t.form+' '+t.arch).toLowerCase().includes(k.toLowerCase()));if(z)return z}return TEMPLATES[0]}
  function solve(){
    const rule=solverRules[el('solverProblem').value]||solverRules.intercept;let t=findTemplate(rule.keys),state=el('solverState').value,opp=el('solverOpponentStyle').value;solverRecommended={template:t,rule:{...rule}};
    if(state==='leading'){solverRecommended.rule.line=Math.min(4,rule.line);solverRecommended.rule.compact=Math.max(9,rule.compact)}
    if(state==='trailing'){solverRecommended.rule.line=Math.max(7,rule.line);solverRecommended.rule.support=Math.min(5,rule.support)}
    const oppAdj=opp==='pressing'?'Lawan high press: libatkan GK/CB dan hindari umpan horizontal lambat.':opp==='counter'?'Lawan counter: jangan naikkan dua fullback bersamaan.':opp==='wing'?'Lawan main sayap: winger wajib bantu cover dan lindungi cut-back.':opp==='possession'?'Lawan possession: tutup penerima di antara lini, bukan mengejar bola.':opp==='direct'?'Lawan direct: menangkan second ball di depan CB.':'Mulai dengan shape seimbang lalu adaptasi setelah 10–15 menit.';
    el('solverResult').innerHTML=`<strong>${escapeHtml(solverRecommended.rule.title)}</strong>\n\nFORMASI • ${escapeHtml(t.form)}\nPRESET • ${escapeHtml(t.name)}\nSupport Range ${solverRecommended.rule.support}/10 • Defensive Line ${solverRecommended.rule.line}/10 • Compactness ${solverRecommended.rule.compact}/10\n\n⚔ MENYERANG\n${escapeHtml(rule.attack)}\n\n🛡 BERTAHAN\n${escapeHtml(rule.defend)}\n\n🎯 ADAPTASI\n${escapeHtml(oppAdj)}\n\n⚡ COACH TIP\n${escapeHtml(rule.tip)}`;
    bumpStat('tactical',1);return solverRecommended;
  }
  el('solveBtn')?.addEventListener('click',solve);
  el('applySolver')?.addEventListener('click',()=>{
    const r=solverRecommended||solve();const idx=TEMPLATES.findIndex(t=>t.name===r.template.name);if(idx<0)return;preset.value=String(idx);load();el('support').value=r.rule.support;el('lineSlider').value=r.rule.line;el('compactSlider').value=r.rule.compact;updateSliders();liveMetrics?.();openPage('pageTactics');setTimeout(()=>{refreshTacticMeta();document.querySelector('[data-tactic-panel="panelSettings"]')?.click()},30);toastMsg('Rekomendasi diterapkan. Coba PLAY TACTIC lalu evaluasi.');recordRecent();
  });
  solve();

  // Coach sub-tabs
  document.querySelectorAll('[data-coach-panel]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-coach-panel]').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.coachPanel').forEach(p=>p.classList.toggle('hidden',p.id!==btn.dataset.coachPanel));if(btn.dataset.coachPanel==='profilePanel')refreshProfile();if(btn.dataset.coachPanel==='setPiecePanel')renderSetPiece(0)});
  el('coachHelp')?.addEventListener('click',()=>toastMsg('Solver memberi titik awal taktik. Setelah diterapkan, sesuaikan lagi berdasarkan kebiasaan lawan.'));

  // ===== Set Piece Lab =====
  const spData={
    cornerNear:{name:'CORNER • NEAR POST',button:'O + arah dekat • power 45–65%',guide:'Runner pertama menyerang near post. Targetkan area depan GK, lalu gunakan header/first-time finish.',actors:[['TAKER',.08,.12,'our'],['CF',.39,.23,'our'],['AMF',.55,.29,'our'],['CB',.45,.17,'opp'],['GK',.5,.07,'gk']],path:[[.08,.12,.39,.14,true],[.39,.14,.5,.055,false]]},
    cornerFar:{name:'CORNER • FAR POST',button:'O + arah jauh • power 60–78%',guide:'Arahkan delivery melewati kerumunan pertama. CB/CF kedua menyerang far post dari blind side.',actors:[['TAKER',.08,.12,'our'],['CB',.69,.22,'our'],['CF',.53,.25,'our'],['CB',.57,.17,'opp'],['GK',.5,.07,'gk']],path:[[.08,.12,.67,.14,true],[.67,.14,.54,.055,false]]},
    cornerShort:{name:'SHORT CORNER + CUTBACK',button:'X short → overlap → X/△ cut-back',guide:'Gunakan saat lawan menumpuk kotak. Tarik satu defender keluar, overlap, lalu kirim cut-back ke edge of box.',actors:[['TAKER',.08,.12,'our'],['W',.18,.23,'our'],['AMF',.49,.37,'our'],['FB',.29,.2,'opp'],['GK',.5,.07,'gk']],path:[[.08,.12,.18,.23,false],[.18,.23,.19,.14,false],[.19,.14,.49,.34,false]]},
    freeCurve:{name:'FREE KICK • CURVE',button:'□ + arah curl • power 45–70%',guide:'Mulai aim sedikit di luar pagar dan gunakan power moderat. Atribut FK/curve pemain sangat memengaruhi hasil.',actors:[['FK',.48,.55,'our'],['WALL',.42,.3,'opp'],['WALL',.5,.29,'opp'],['WALL',.58,.3,'opp'],['GK',.56,.07,'gk']],path:[[.48,.55,.36,.055,true]]},
    freePower:{name:'FREE KICK • POWER',button:'□ • power 70–90%',guide:'Gunakan jarak menengah-jauh. Aim lebih aman ke sisi kiper yang sulit dijangkau dan hindari over-power.',actors:[['FK',.49,.57,'our'],['WALL',.42,.3,'opp'],['WALL',.5,.29,'opp'],['WALL',.58,.3,'opp'],['GK',.5,.07,'gk']],path:[[.49,.57,.62,.055,true]]},
    freeLayoff:{name:'FREE KICK • LAYOFF',button:'X layoff → △/□',guide:'Variasi untuk memindahkan sudut tembak. Cocok saat pagar terlalu rapat atau lawan menebak direct free kick.',actors:[['FK',.44,.55,'our'],['AMF',.62,.48,'our'],['CF',.56,.22,'our'],['WALL',.48,.3,'opp'],['GK',.5,.07,'gk']],path:[[.44,.55,.62,.48,false],[.62,.48,.55,.18,false],[.55,.18,.48,.055,false]]},
    penalty:{name:'PENALTY • PLACEMENT',button:'□ power rendah–sedang + arah',guide:'Jangan selalu memilih sudut yang sama. Prioritaskan placement; terlalu banyak power meningkatkan risiko melenceng.',actors:[['PK',.5,.4,'our'],['GK',.5,.07,'gk']],path:[[.5,.4,.35,.055,false]]},
    panenka:{name:'PENALTY • PANENKA',button:'L1 + □ • power ringan',guide:'Gunakan sangat jarang dan hanya jika yakin kiper akan dive. Risiko tinggi bila dibaca.',actors:[['PK',.5,.4,'our'],['GK',.5,.07,'gk']],path:[[.5,.4,.5,.055,true]]}
  };
  function renderSetPiece(t=0){
    const data=spData[el('setPieceType').value]||spData.cornerNear,box=el('setPieceActors'),route=el('setPieceRoute'),pitch=el('setPiecePitch');if(!box||!route||!pitch)return;box.innerHTML='';route.innerHTML='';const w=pitch.clientWidth,h=pitch.clientHeight;route.setAttribute('viewBox',`0 0 ${w} ${h}`);
    data.actors.forEach((a,i)=>{const d=document.createElement('div');d.className='spActor '+(a[3]==='opp'?'opp':a[3]==='gk'?'gk':'');d.style.left=a[1]*100+'%';d.style.top=a[2]*100+'%';d.innerHTML=`<span>${a[0]}</span><small>${a[0]}</small>`;box.appendChild(d)});
    data.path.forEach(p=>{const path=document.createElementNS('http://www.w3.org/2000/svg','path');const d=p[4]?`M ${p[0]*w} ${p[1]*h} Q ${(p[0]+p[2])*w/2} ${Math.min(p[1],p[3])*h-34} ${p[2]*w} ${p[3]*h}`:`M ${p[0]*w} ${p[1]*h} L ${p[2]*w} ${p[3]*h}`;path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke','#ffffff66');path.setAttribute('stroke-width','2');path.setAttribute('stroke-dasharray','6 6');route.appendChild(path)});
    const first=data.path[0];el('setPieceBall').style.left=first[0]*100+'%';el('setPieceBall').style.top=first[1]*100+'%';el('setPieceBadge').textContent=t?data.name:'READY';el('setPieceGuide').innerHTML=`<b>${escapeHtml(data.name)}</b><br/><span style="color:var(--gold);font-weight:900">🎮 ${escapeHtml(data.button)}</span><br/><br/>${escapeHtml(data.guide)}<br/><br/><b>Power dipilih: ${el('setPiecePower').value}%</b>`;
  }
  async function playSetPiece(){
    if(setPieceRAF)cancelAnimationFrame(setPieceRAF);const data=spData[el('setPieceType').value]||spData.cornerNear,pitch=el('setPiecePitch'),ball=el('setPieceBall');renderSetPiece(1);const segments=data.path,total=segments.length,dur=3600,start=performance.now();return new Promise(resolve=>{const f=now=>{const tt=clamp((now-start)/dur,0,1)*total,idx=Math.min(total-1,Math.floor(tt)),u=tt-idx,p=segments[idx];let sm=u*u*(3-2*u),x=p[0]+(p[2]-p[0])*sm,y=p[1]+(p[3]-p[1])*sm;if(p[4])y-=Math.sin(Math.PI*sm)*.075;ball.style.left=x*100+'%';ball.style.top=y*100+'%';el('setPieceBadge').textContent=idx===total-1&&u>.75?'CONTACT / FINISH':data.name;if(tt<total)setPieceRAF=requestAnimationFrame(f);else{setPieceRAF=null;const roll=Math.random(),power=+el('setPiecePower').value;let result=roll<(power>92?.22:.48)?'GOAL / TARGET HIT':roll<.76?'SAVE / CLEARED':'WIDE / OVER';el('setPieceBadge').textContent=result;resolve()}};setPieceRAF=requestAnimationFrame(f)})
  }
  el('setPieceType')?.addEventListener('change',()=>renderSetPiece(0));el('setPiecePower')?.addEventListener('input',()=>renderSetPiece(0));el('playSetPiece')?.addEventListener('click',()=>{bumpStat('shooting',1);playSetPiece()});window.addEventListener('resize',()=>{if(!el('setPiecePanel')?.classList.contains('hidden'))renderSetPiece(0)});renderSetPiece(0);

  // ===== Academy controller / skill profile hooks =====
  function academyCategoryStat(){const c=String(academyScenario?.cat||'').toLowerCase();if(c.includes('umpan'))return'passing';if(c.includes('shoot')||c.includes('pojok')||c.includes('bebas')||c.includes('penal'))return'shooting';if(c.includes('bertahan'))return'defending';return'tactical'}
  function updateController(){if(!academyScenario)return;if(el('controllerText'))el('controllerText').textContent=`${academyScenario.title}: ${academyScenario.buttons}`;if(el('academyXpMini'))el('academyXpMini').textContent=xp()}
  el('academyCat')?.addEventListener('change',()=>setTimeout(updateController,20));el('academyDrill')?.addEventListener('change',()=>setTimeout(updateController,20));
  if(typeof submitAcademyChoice==='function'){
    const oldSubmit=submitAcademyChoice;
    submitAcademyChoice=function(key){const before=xp(),stat=academyCategoryStat();oldSubmit(key);const gained=xp()-before;if(gained>0)bumpStat(stat,1);updateController();refreshHome()}
  }
  if(typeof startAcademyChallenge==='function'){
    const oldStart=startAcademyChallenge;startAcademyChallenge=function(){oldStart();updateController()}
  }

  // ===== Profile / Backup =====
  function skillValue(base,count,xpShare){return clamp(Math.round(base+count*4+xp()*xpShare),1,99)}
  function refreshProfile(){
    const s=getStats(),li=levelInfo();const vals={Passing:skillValue(38,s.passing,.012),Shooting:skillValue(38,s.shooting,.010),Defending:skillValue(38,s.defending,.010),Tactical:skillValue(40,s.tactical+s.matchGood,.014)};
    if(el('profileRank'))el('profileRank').textContent=li.rank;if(el('profileLevelText'))el('profileLevelText').textContent=`Level ${li.level} • ${xp()} XP`;
    Object.entries(vals).forEach(([k,v])=>{const id=k==='Tactical'?'Tactical':k;if(el('skill'+id))el('skill'+id).textContent=v;if(el('bar'+id))el('bar'+id).style.width=v+'%'});
    if(el('academyXpMini'))el('academyXpMini').textContent=xp();
  }
  function exportBackup(){
    const data={app:'PES3 Coach 2026',version:'1.5.0',exportedAt:new Date().toISOString(),storage:{}};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(APP_PREFIXES.some(p=>k.startsWith(p)))data.storage[k]=localStorage.getItem(k)}
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PES3Coach2026-backup-v1.5.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toastMsg('Backup diekspor.')
  }
  el('exportData')?.addEventListener('click',exportBackup);
  el('importData')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!data.storage||typeof data.storage!=='object')throw new Error('Format backup tidak valid');Object.entries(data.storage).forEach(([k,v])=>{if(APP_PREFIXES.some(p=>k.startsWith(p)))localStorage.setItem(k,String(v))});toastMsg('Backup berhasil diimpor. Memuat ulang...');setTimeout(()=>location.reload(),600)}catch(err){toastMsg('Import gagal: '+err.message)}finally{e.target.value=''}});
  el('resetProgress')?.addEventListener('click',()=>{if(!confirm('Reset semua progress, favorit, dan setting custom PES3 Coach di perangkat ini?'))return;const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(APP_PREFIXES.some(p=>k.startsWith(p)))keys.push(k)}keys.forEach(k=>localStorage.removeItem(k));location.reload()});

  // Help & initial sync
  el('quickProfile')?.addEventListener('click',()=>setTimeout(()=>document.querySelector('[data-coach-panel="profilePanel"]')?.click(),20));
  syncScoreboard();refreshTacticMeta();recordRecent();updateController();refreshHome();
  const route=new URLSearchParams(location.search).get('open');
  if(route){const map={home:'pageHome',tactics:'pageTactics',match:'pageMatch',academy:'pageAcademy',freekick:'pageFreeKick',coach:'pageCoach'};if(map[route])setTimeout(()=>openPage(map[route]),40)}
})();
