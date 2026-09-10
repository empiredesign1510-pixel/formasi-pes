// ===== PES3 Coach v1.5 — Free Kick Arena =====
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('fkCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const ease=t=>1-Math.pow(1-t,3);
  const fmt=n=>Math.round(n).toLocaleString('id-ID');
  const BALL={x:470,y:1040};
  const GOAL={l:170,r:730,top:145,bottom:365};
  const crowd = Array.from({length:170},(_,i)=>({x:(i*137)%W,y:26+((i*83)%112),a:.2+((i*31)%60)/100}));
  const challenges=[
    {name:'Pemanasan',desc:'Cetak 2 gol dari 5 tendangan.',type:'goals',target:2},
    {name:'Bend It!',desc:'Cetak goal dengan Curve ≥ 35.',type:'curveGoal',target:1},
    {name:'Top Bins',desc:'Masukkan 1 bola ke sudut atas gawang.',type:'topCorner',target:1},
    {name:'Wall Breaker',desc:'Cetak 2 gol tanpa mengenai pagar.',type:'cleanGoals',target:2},
    {name:'Clutch Combo',desc:'Cetak 3 gol beruntun.',type:'comboGoals',target:3},
    {name:'Points Hunter',desc:'Kumpulkan 4.000 poin dalam 5 bola.',type:'score',target:4000}
  ];
  const tips={
    ready:'Mulai usapan dari bola. Untuk curl, buat gerakan seperti huruf “C” menuju sudut gawang.',
    wall:'Bola terlalu rendah atau terlalu lurus. Tambah kecepatan usapan atau lengkungkan melewati sisi pagar.',
    save:'Target terlalu dekat dengan kiper. Bidik sudut dan kombinasikan power + curve.',
    post:'Arah sudah tajam, tetapi terlalu ekstrem. Kurangi sedikit deviasi di akhir usapan.',
    out:'Jaga ujung usapan tetap menuju area gawang. Arah horizontal menentukan target kiri/kanan.',
    goal:'Bagus. Sudut jauh dari kiper + power terkontrol menghasilkan peluang goal lebih tinggi.'
  };
  let state={score:0,best:+(localStorage.getItem('pes3_fk_best')||0),balls:5,combo:0,goals:0,saves:0,posts:0,walls:0,shots:0,challengeIndex:+(localStorage.getItem('pes3_fk_challenge')||0)%challenges.length,challengeProgress:0,roundStartScore:0,sound:localStorage.getItem('pes3_fk_sound')!=='0'};
  let drawing=false, raw=[], drawStart=0, activeShot=null, animStart=0, raf=0, lastShot=null, wind=0, gkIdle=0, lastTs=0, soundCtx=null;

  function point(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,t:performance.now()};
  }
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function toast(s){ if(typeof window.toastMsg==='function') window.toastMsg(s); }
  function buzz(p=[25]){ try{navigator.vibrate?.(p)}catch{} }
  function tone(type){
    if(!state.sound) return;
    try{
      soundCtx ||= new (window.AudioContext||window.webkitAudioContext)();
      const o=soundCtx.createOscillator(),g=soundCtx.createGain();o.connect(g);g.connect(soundCtx.destination);
      const now=soundCtx.currentTime;
      if(type==='kick'){o.frequency.setValueAtTime(120,now);o.frequency.exponentialRampToValueAtTime(52,now+.09);g.gain.setValueAtTime(.12,now);g.gain.exponentialRampToValueAtTime(.001,now+.11);o.start();o.stop(now+.12)}
      else if(type==='goal'){o.frequency.setValueAtTime(520,now);o.frequency.setValueAtTime(660,now+.08);o.frequency.setValueAtTime(830,now+.16);g.gain.setValueAtTime(.08,now);g.gain.exponentialRampToValueAtTime(.001,now+.35);o.start();o.stop(now+.36)}
      else {o.frequency.setValueAtTime(type==='post'?900:180,now);g.gain.setValueAtTime(.08,now);g.gain.exponentialRampToValueAtTime(.001,now+.16);o.start();o.stop(now+.17)}
    }catch{}
  }
  function difficulty(){
    const d=$('fkDifficulty')?.value||'pro';
    return d==='legend'?{gk:.86,wall:5,noise:28}:d==='rookie'?{gk:.43,wall:3,noise:100}:{gk:.67,wall:4,noise:58};
  }
  function resetWind(){
    const dist=+($('fkDistance')?.value||22), amp=dist>=27?1.45:dist<=18?.75:1;
    wind=(Math.random()*2-1)*2.6*amp;
    const arrow=Math.abs(wind)<.25?'·':wind>0?'→':'←';
    if($('fkWind')) $('fkWind').textContent=`${arrow} ${Math.abs(wind).toFixed(1)}`;
  }
  function updateHud(){
    $('fkScore').textContent=fmt(state.score);$('fkBest').textContent=fmt(state.best);$('fkBalls').textContent=state.balls;
    $('fkCombo').textContent='x'+(1+Math.min(state.combo,4)*.25).toFixed(2).replace(/0$/,'');
    $('fkGoals').textContent=state.goals;$('fkSaves').textContent=state.saves;$('fkPosts').textContent=state.posts;$('fkWalls').textContent=state.walls;
    const c=challenges[state.challengeIndex];$('fkChallengeTitle').textContent=c.name;$('fkChallengeDesc').textContent=c.desc;
    const prog=c.type==='score'?Math.max(0,state.score-state.roundStartScore):state.challengeProgress;
    $('fkChallengeProgress').textContent=`${Math.min(prog,c.target)}/${c.target}`;
    $('fkDistanceBadge').textContent=($('fkDistance')?.value||22)+' m';
  }
  function meter(id,val){const b=$(id+'Bar'),v=$(id+'Val');if(b)b.style.width=clamp(val,0,100)+'%';if(v)v.textContent=Math.round(val)}
  function setTip(kind){const t=$('fkCoachTip');if(t)t.innerHTML=`<b>COACH TIP</b><span>${tips[kind]||tips.ready}</span>`}
  function setStatus(text){if($('fkStatus'))$('fkStatus').textContent=text}

  function drawField(){
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#07131d');grad.addColorStop(.16,'#0a4930');grad.addColorStop(1,'#116338');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    // stadium + crowd
    ctx.fillStyle='#090e16';ctx.fillRect(0,0,W,155);ctx.fillStyle='#18202c';ctx.fillRect(0,112,W,42);
    crowd.forEach((p,i)=>{ctx.globalAlpha=p.a;ctx.fillStyle=i%5===0?'#f3c849':i%3===0?'#dce5ef':'#8895a7';ctx.beginPath();ctx.arc(p.x,p.y,2.1,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
    // pitch stripes/perspective
    for(let i=0;i<7;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.018)':'rgba(0,0,0,.025)';const y=370+i*120;ctx.fillRect(0,y,W,120)}
    ctx.strokeStyle='rgba(239,255,239,.34)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(90,H);ctx.lineTo(260,365);ctx.moveTo(810,H);ctx.lineTo(640,365);ctx.stroke();
    // penalty box perspective
    ctx.strokeStyle='rgba(240,255,245,.28)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(245,365);ctx.lineTo(115,610);ctx.lineTo(785,610);ctx.lineTo(655,365);ctx.stroke();
    // goal net
    ctx.fillStyle='rgba(225,240,255,.06)';ctx.fillRect(GOAL.l,GOAL.top,GOAL.r-GOAL.l,GOAL.bottom-GOAL.top);
    ctx.strokeStyle='rgba(226,236,246,.18)';ctx.lineWidth=1;
    for(let x=GOAL.l;x<=GOAL.r;x+=35){ctx.beginPath();ctx.moveTo(x,GOAL.top);ctx.lineTo(x,GOAL.bottom);ctx.stroke()}
    for(let y=GOAL.top;y<=GOAL.bottom;y+=26){ctx.beginPath();ctx.moveTo(GOAL.l,y);ctx.lineTo(GOAL.r,y);ctx.stroke()}
    ctx.strokeStyle='#f4f8fc';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(GOAL.l,GOAL.bottom);ctx.lineTo(GOAL.l,GOAL.top);ctx.lineTo(GOAL.r,GOAL.top);ctx.lineTo(GOAL.r,GOAL.bottom);ctx.stroke();
    // free kick spot
    ctx.fillStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.arc(BALL.x,BALL.y+28,5,0,Math.PI*2);ctx.fill();
  }

  function wallPositions(){
    const d=difficulty(), n=d.wall, dist=+($('fkDistance')?.value||22);const spread=58, center=455+(dist===18?22:0);
    return Array.from({length:n},(_,i)=>({x:center+(i-(n-1)/2)*spread,y:610+(i%2)*4}));
  }
  function drawHuman(x,y,kind='wall',phase=0){
    ctx.save();ctx.translate(x,y);
    if(kind==='kicker'){
      const run=phase*14;ctx.translate(run,-phase*5);ctx.strokeStyle='#f1c84d';ctx.lineWidth=16;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,-50);ctx.lineTo(3,0);ctx.stroke();
      ctx.fillStyle='#deb78e';ctx.beginPath();ctx.arc(0,-78,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111827';ctx.fillRect(-23,-58,48,58);ctx.fillStyle='#f1c84d';ctx.fillRect(-23,-58,48,14);
      ctx.strokeStyle='#e8eef6';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(-22,48);ctx.stroke();
      ctx.save();ctx.rotate(-phase*1.15);ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(31,50);ctx.stroke();ctx.restore();
    }else if(kind==='gk'){
      ctx.fillStyle='#53c8ff';ctx.fillRect(-24,-38,48,58);ctx.fillStyle='#d8af88';ctx.beginPath();ctx.arc(0,-58,17,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#53c8ff';ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-18,-25);ctx.lineTo(-52,-8);ctx.moveTo(18,-25);ctx.lineTo(52,-8);ctx.moveTo(-10,18);ctx.lineTo(-24,55);ctx.moveTo(10,18);ctx.lineTo(24,55);ctx.stroke();
    }else{
      const jump=phase*24;ctx.translate(0,-jump);ctx.fillStyle='#dc4b55';ctx.fillRect(-18,-42,36,58);ctx.fillStyle='#d9ad86';ctx.beginPath();ctx.arc(0,-60,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e6edf5';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,14);ctx.lineTo(-13,48);ctx.moveTo(8,14);ctx.lineTo(13,48);ctx.stroke();ctx.fillStyle='#111827';ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillText('DEF',0,-10);
    }
    ctx.restore();
  }
  function drawBall(x,y,scale=1){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.strokeStyle='#17202b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#202733';for(let a=0;a<5;a++){const th=a*Math.PI*2/5-.5;ctx.beginPath();ctx.arc(Math.cos(th)*6,Math.sin(th)*6,2.2,0,Math.PI*2);ctx.fill()}ctx.restore();
  }
  function drawKeeper(t=0,targetX=450,save=false){
    let k=ease(clamp((t-.55)/.42,0,1));if(!activeShot)k=0;const x=lerp(450,targetX,k);const y=308-Math.sin(k*Math.PI)*20;ctx.save();ctx.translate(x,y);if(k>.15){ctx.rotate((targetX<450?-1:1)*k*.9)}drawHuman(0,0,'gk',0);ctx.restore();
  }
  function drawIdle(ts=0){
    drawField();
    const idle=Math.sin(ts/420)*2;wallPositions().forEach((p,i)=>drawHuman(p.x,p.y+idle+(i%2)*2,'wall',0));
    drawKeeper();
    drawHuman(BALL.x-92,BALL.y+6,'kicker',0);
    drawBall(BALL.x,BALL.y,1);
    if(drawing&&raw.length>1){
      ctx.strokeStyle='rgba(255,214,77,.95)';ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='#f7c948';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(raw[0].x,raw[0].y);raw.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.shadowBlur=0;
      for(let i=1;i<raw.length;i+=Math.max(1,Math.floor(raw.length/8))){ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(raw[i].x,raw[i].y,3,0,Math.PI*2);ctx.fill()}
    }else if(lastShot&&!activeShot){drawShotTrail(lastShot,.24,true)}
  }
  function rawXAt(t,pts){
    if(!pts.length)return 0;const idx=t*(pts.length-1),i=Math.floor(idx),f=idx-i;const a=pts[i],b=pts[Math.min(pts.length-1,i+1)];return lerp(a.x,b.x,f)-pts[0].x;
  }
  function shotPoint(shot,t){
    const dist=shot.distance, distScale=dist<=18?.9:dist>=30?1.18:dist>=27?1.1:1;
    const rawDx=rawXAt(t,shot.points)*distScale;
    const windDrift=shot.wind*20*t*t;
    const x=BALL.x+rawDx+windDrift;
    const groundY=lerp(BALL.y,GOAL.bottom,t);
    const peak=shot.lift*(4*t*(1-t));
    const endLift=shot.goalLift*t;
    const y=groundY-peak-endLift;
    return{x,y};
  }
  function drawShotTrail(shot,upto=1,ghost=false){
    ctx.save();ctx.strokeStyle=ghost?'rgba(255,215,83,.22)':'rgba(255,224,125,.55)';ctx.lineWidth=ghost?4:5;ctx.setLineDash(ghost?[10,12]:[5,9]);ctx.beginPath();for(let i=0;i<=70*upto;i++){const t=i/70,p=shotPoint(shot,t);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.stroke();ctx.restore();
  }
  function detectResult(shot){
    const end=shotPoint(shot,1), x=end.x,y=end.y;
    // collision at wall depth: look at ball screen position around the wall plane
    let wallHit=false, hitDef=null;
    for(let t=.37;t<=.66;t+=.015){const p=shotPoint(shot,t);for(const d of wallPositions()){if(Math.abs(p.x-d.x)<31 && p.y>d.y-95 && p.y<d.y+52){wallHit=true;hitDef={...d,t};break}}if(wallHit)break}
    if(wallHit)return{type:'wall',label:'BLOCKED BY WALL',at:hitDef.t,x:hitDef.x,y:hitDef.y-40};
    const postTol=18;
    const insideX=x>GOAL.l+postTol&&x<GOAL.r-postTol, insideY=y>GOAL.top+postTol&&y<GOAL.bottom-6;
    if((Math.abs(x-GOAL.l)<=postTol||Math.abs(x-GOAL.r)<=postTol)&&y>=GOAL.top-10&&y<=GOAL.bottom+10)return{type:'post',label:'HIT THE POST',at:.985,x,y};
    if(Math.abs(y-GOAL.top)<=postTol&&x>=GOAL.l&&x<=GOAL.r)return{type:'post',label:'CROSSBAR!',at:.985,x,y};
    if(!insideX||!insideY)return{type:'out',label:'WIDE / OVER',at:1,x,y};
    // keeper prediction with imperfect reaction. Corners, curve and power reduce save chance.
    const skill=difficulty().gk, corner=Math.abs(x-450)/280, high=clamp((GOAL.bottom-y)/(GOAL.bottom-GOAL.top),0,1);
    const noise=(Math.random()*2-1)*difficulty().noise;
    const gkTarget=clamp(x+noise,GOAL.l+35,GOAL.r-35);
    const reach=68+skill*48-shot.curve*.18-shot.power*.14+Math.max(0,.6-corner)*32;
    const verticalReach=.78+skill*.12;
    const save=Math.abs(gkTarget-x)<reach && high<verticalReach && Math.random()<(skill+.16-corner*.35-shot.power/420-shot.curve/600);
    if(save)return{type:'save',label:'GREAT SAVE!',at:.93,x,y,gkTarget};
    const topCorner=high>.68&&corner>.62;
    return{type:'goal',label:topCorner?'TOP BINS!':'GOOOAL!',at:1,x,y,gkTarget,topCorner};
  }
  function analyzeGesture(pts,duration){
    let len=0;for(let i=1;i<pts.length;i++)len+=distance(pts[i-1],pts[i]);
    const speed=len/Math.max(180,duration);
    const start=pts[0],end=pts[pts.length-1];
    let maxDev=0,turn=0,lastAngle=null;
    for(let i=1;i<pts.length;i++){
      const t=i/(pts.length-1),expected=lerp(start.x,end.x,t),dev=Math.abs(pts[i].x-expected);maxDev=Math.max(maxDev,dev);
      const a=Math.atan2(pts[i].y-pts[i-1].y,pts[i].x-pts[i-1].x);if(lastAngle!=null){let da=Math.abs(a-lastAngle);if(da>Math.PI)da=2*Math.PI-da;turn+=da}lastAngle=a;
    }
    const power=clamp(18+speed*20+len/30,18,100);
    const curve=clamp(maxDev*.42+turn*9,0,100);
    const up=clamp((start.y-end.y)/760,.15,1.12);
    const lift=90+power*.90+up*35;
    const goalLift=30+up*160+(power-50)*.40;
    const shot={points:pts.map(p=>({...p})),power,curve,lift,goalLift,wind,distance:+($('fkDistance')?.value||22),duration};
    shot.result=detectResult(shot);
    return shot;
  }
  function shotAccuracy(shot){
    const p=shotPoint(shot,1),cx=clamp(p.x,GOAL.l,GOAL.r),cy=clamp(p.y,GOAL.top,GOAL.bottom);const outside=Math.hypot(p.x-cx,p.y-cy);
    let acc=100-outside/3.5;if(shot.result.type==='post')acc=92;if(shot.result.type==='wall')acc=Math.min(acc,54);return clamp(acc,0,100);
  }
  function gradeFor(shot,points){
    if(shot.result.type==='goal'&&shot.result.topCorner)return'S';if(shot.result.type==='goal'&&points>=1500)return'A';if(shot.result.type==='goal')return'B';if(shot.result.type==='post'||shot.result.type==='save')return'C';return'D';
  }
  function pointsFor(shot){
    const r=shot.result,acc=shotAccuracy(shot);if(r.type!=='goal')return r.type==='post'?180:r.type==='save'?120:0;
    const end=shotPoint(shot,1),corner=Math.abs(end.x-450)/280,high=clamp((GOAL.bottom-end.y)/(GOAL.bottom-GOAL.top),0,1);
    let base=900+acc*3+corner*280+Math.min(shot.curve,65)*4+Math.min(shot.power,90)*2;if(r.topCorner)base+=450;
    return Math.round(base*(1+Math.min(state.combo,4)*.25));
  }
  function updateChallenge(shot,pts){
    const c=challenges[state.challengeIndex],r=shot.result;
    if(c.type==='goals'&&r.type==='goal')state.challengeProgress++;
    if(c.type==='curveGoal'&&r.type==='goal'&&shot.curve>=35)state.challengeProgress++;
    if(c.type==='topCorner'&&r.type==='goal'&&r.topCorner)state.challengeProgress++;
    if(c.type==='cleanGoals'&&r.type==='goal')state.challengeProgress++;
    if(c.type==='comboGoals')state.challengeProgress=Math.max(state.challengeProgress,state.combo);
    if(c.type==='score')state.challengeProgress=Math.max(0,state.score-state.roundStartScore);
  }
  function challengeDone(){const c=challenges[state.challengeIndex],p=c.type==='score'?state.score-state.roundStartScore:state.challengeProgress;return p>=c.target}

  function animateShot(shot,replay=false){
    cancelAnimationFrame(raf);activeShot=shot;animStart=performance.now();setStatus('BALL IN PLAY');$('fkInstruction')?.classList.add('hide');if($('fkShotResult'))$('fkShotResult').hidden=true;
    tone('kick');buzz(18);
    const duration=620+shot.distance*10;
    function frame(ts){
      const t=clamp((ts-animStart)/duration,0,1),playT=Math.min(t/shot.result.at,1);drawField();
      const wallPhase=Math.sin(clamp((t-.28)/.32,0,1)*Math.PI);wallPositions().forEach(p=>drawHuman(p.x,p.y,'wall',wallPhase));
      const kickerPhase=clamp(t/.22,0,1);drawHuman(BALL.x-92,BALL.y+6,'kicker',kickerPhase);
      const gkTarget=shot.result.gkTarget??shot.result.x??450;drawKeeper(t,gkTarget,shot.result.type==='save');
      drawShotTrail(shot,Math.min(t,1),false);
      const bp=shotPoint(shot,Math.min(t,shot.result.at));const perspective=.68+.42*(1-Math.min(t,1));drawBall(bp.x,bp.y,perspective);
      if(t<1){raf=requestAnimationFrame(frame)}else{activeShot=null;finishShot(shot,replay);drawIdle(performance.now())}
    }
    raf=requestAnimationFrame(frame);
  }
  function finishShot(shot,replay){
    const r=shot.result,pts=pointsFor(shot),acc=shotAccuracy(shot),grade=gradeFor(shot,pts);
    if(!replay){
      state.balls--;state.shots++;
      if(r.type==='goal'){state.goals++;state.combo++;tone('goal');buzz([40,35,75])}else{state.combo=0;if(r.type==='save')state.saves++;if(r.type==='post')state.posts++;if(r.type==='wall')state.walls++;tone(r.type==='post'?'post':'miss');buzz(30)}
      state.score+=pts;state.best=Math.max(state.best,state.score);localStorage.setItem('pes3_fk_best',state.best);
      updateChallenge(shot,pts);
      // feed long-term profile without dominating Academy progression
      const lifetime=+(localStorage.getItem('pes3_fk_xp')||0)+Math.max(10,Math.round(pts/18));localStorage.setItem('pes3_fk_xp',lifetime);
    }
    meter('fkPower',shot.power);meter('fkCurve',shot.curve);meter('fkAccuracy',acc);
    const res=$('fkShotResult');if(res){$('fkResultLabel').textContent=r.label;$('fkResultPoints').textContent=(pts?'+':'')+fmt(pts);$('fkResultGrade').textContent=grade;res.hidden=false;setTimeout(()=>{if(res)res.hidden=true},1700)}
    setStatus(r.label);setTip(r.type==='goal'?'goal':r.type);updateHud();
    if(!replay){resetWind();if(state.balls<=0)setTimeout(showRoundSummary,1050)}
  }
  function showRoundSummary(){
    const modal=$('fkRoundModal');if(!modal)return;const done=challengeDone(),roundScore=state.score-state.roundStartScore,goalRate=state.goals/Math.max(1,state.shots);
    let stars=roundScore>=6200||goalRate>=.8?3:roundScore>=3500||goalRate>=.5?2:1;const rating=stars===3?'S':stars===2?'A':'B';
    $('fkRoundTitle').textContent=done?'CHALLENGE COMPLETE!':'ROUND COMPLETE';$('fkStars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('fkRoundScore').textContent=fmt(roundScore);$('fkRoundGoals').textContent=`${state.goals}/${state.shots}`;$('fkRoundRating').textContent=rating;
    $('fkRoundMessage').textContent=done?'Challenge berhasil. Level challenge berikutnya sudah terbuka.':'Belum selesai. Coba lagi dan gunakan Coach Tip untuk memperbaiki swipe.';modal.hidden=false;
    if(done){state.challengeIndex=(state.challengeIndex+1)%challenges.length;localStorage.setItem('pes3_fk_challenge',state.challengeIndex)}
  }
  function newRound(){
    cancelAnimationFrame(raf);activeShot=null;drawing=false;raw=[];state.score=0;state.balls=5;state.combo=0;state.goals=0;state.saves=0;state.posts=0;state.walls=0;state.shots=0;state.challengeProgress=0;state.roundStartScore=0;
    resetWind();updateHud();meter('fkPower',0);meter('fkCurve',0);if($('fkAccuracyVal'))$('fkAccuracyVal').textContent='—';if($('fkAccuracyBar'))$('fkAccuracyBar').style.width='0%';setStatus('READY');setTip('ready');$('fkInstruction')?.classList.remove('hide');$('fkRoundModal').hidden=true;drawIdle(performance.now())
  }

  canvas.addEventListener('pointerdown',e=>{
    if(activeShot||state.balls<=0)return;const p=point(e);if(distance(p,BALL)>155){setStatus('START FROM BALL');toast('Mulai usapan dari bola putih di dekat pemain.');buzz(12);return}
    drawing=true;raw=[p];drawStart=performance.now();canvas.setPointerCapture?.(e.pointerId);$('fkInstruction')?.classList.add('hide');setStatus('DRAW YOUR SHOT');if($('fkShotResult'))$('fkShotResult').hidden=true;e.preventDefault();drawIdle(performance.now())
  },{passive:false});
  canvas.addEventListener('pointermove',e=>{
    if(!drawing)return;const p=point(e),last=raw[raw.length-1];if(!last||distance(p,last)>5)raw.push(p);e.preventDefault();drawIdle(performance.now())
  },{passive:false});
  function release(e){
    if(!drawing)return;drawing=false;const p=point(e);if(distance(p,raw[raw.length-1])>3)raw.push(p);const dur=performance.now()-drawStart;
    if(raw.length<4||distance(raw[0],raw[raw.length-1])<120){raw=[];setStatus('SWIPE LONGER');$('fkInstruction')?.classList.remove('hide');toast('Usap lebih panjang ke arah gawang.');drawIdle(performance.now());return}
    lastShot=analyzeGesture(raw,dur);raw=[];animateShot(lastShot,false);e.preventDefault()
  }
  canvas.addEventListener('pointerup',release,{passive:false});canvas.addEventListener('pointercancel',()=>{drawing=false;raw=[];drawIdle(performance.now())});

  $('fkReplay')?.addEventListener('click',()=>{if(!lastShot||activeShot){toast('Belum ada tendangan untuk diulang.');return}animateShot(lastShot,true)});
  $('fkNewRound')?.addEventListener('click',newRound);$('fkRoundAgain')?.addEventListener('click',newRound);$('fkRoundClose')?.addEventListener('click',()=>{$('fkRoundModal').hidden=true;});
  $('fkDifficulty')?.addEventListener('change',()=>{resetWind();drawIdle(performance.now());toast('Difficulty diubah. Kiper dan jumlah pagar ikut menyesuaikan.');});
  $('fkDistance')?.addEventListener('change',()=>{resetWind();updateHud();drawIdle(performance.now())});
  $('fkSound')?.addEventListener('click',()=>{state.sound=!state.sound;localStorage.setItem('pes3_fk_sound',state.sound?'1':'0');$('fkSound').textContent=state.sound?'🔊':'🔇';toast(state.sound?'Suara aktif.':'Suara dimatikan.');});
  if($('fkSound'))$('fkSound').textContent=state.sound?'🔊':'🔇';

  // Keep visual alive while idle only when arena is visible; very cheap canvas animation.
  function idleLoop(ts){
    if(!activeShot&&!drawing&&!document.getElementById('pageFreeKick')?.classList.contains('hidden')){if(ts-lastTs>45){drawIdle(ts);lastTs=ts}}
    requestAnimationFrame(idleLoop)
  }
  requestAnimationFrame(idleLoop);
  document.querySelectorAll('[data-open-page="pageFreeKick"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{drawIdle(performance.now());updateHud()},50)));
  resetWind();updateHud();setTip('ready');drawIdle(performance.now());
})();
