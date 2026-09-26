/* Number Challenge Pro v3 — Telegram Mini App */
const TG = window.Telegram?.WebApp;
if (TG) { TG.ready(); TG.expand(); TG.setHeaderColor("#070a13"); TG.setBackgroundColor("#070a13"); }

const SUPABASE_URL = "https://kxegyhoxpnnvrxpkfsow.supabase.co";
const SUPABASE_KEY = "sb_publishable_2thw3aQHDbdwCm6MCViLPA_HtlnlEfU";
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const screens=["home","game","result","leaderboard","profile","rewards"];
const $=id=>document.getElementById(id);
let score=0,round=1,correct=0,timeLeft=30,timer=null,target=0,lastGameAt=null;
const TOTAL_ROUNDS=10,ROUND_TIME=30;
let local=JSON.parse(localStorage.getItem("nc_profile")||'{"points":0,"games":0,"best":0,"streak":0,"lastCheckin":"","lastPlayed":"","totalCorrect":0,"bestAccuracy":0,"history":[]}');

function telegramUser(){const u=TG?.initDataUnsafe?.user;return u||{id:"demo-"+Math.random().toString(36).slice(2),first_name:"Player",username:"player"};}
const user=telegramUser(),name=user.first_name||"Player",initial=(name[0]||"P").toUpperCase();
function saveLocal(){localStorage.setItem("nc_profile",JSON.stringify(local));}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove("show"),2400);}
function today(){return new Date().toISOString().slice(0,10)}
function yesterday(){return new Date(Date.now()-86400000).toISOString().slice(0,10)}
function showScreen(n){screens.forEach(s=>$(`${s}Screen`).classList.toggle("active",s===n));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===n));if(n==="leaderboard")loadLeaderboard("all");if(n==="rewards")refreshRewards();if(n==="profile")refreshProfile();window.scrollTo({top:0,behavior:"smooth"});}
function setUser(){$("username").textContent=name+" 👋";$('profileName').textContent=name;$('profileUsername').textContent=user.username?"@"+user.username:"Telegram Player";$('avatar').textContent=initial;$('profileAvatar').textContent=initial;updateHeader();}
function updateHeader(){$("score").textContent=local.points.toLocaleString();$("homePoints").textContent=local.points.toLocaleString();$("streak").textContent=local.streak||0;}
function refreshProfile(){
  $("profileScore").textContent=local.points.toLocaleString();$("gamesPlayed").textContent=local.games;$("profileBest").textContent=local.best;updateHeader();
  const a=document.querySelectorAll(".achievement"); if(a[0])a[0].classList.toggle("unlocked",local.games>0);if(a[1])a[1].classList.toggle("unlocked",local.streak>=7);if(a[2])a[2].classList.toggle("unlocked",local.best>=250);
}
function refreshRewards(){
  $("rewardPoints").textContent=local.points.toLocaleString();$("rewardStreak").textContent=(local.streak||0)+" day streak";
  const claimed=local.lastCheckin===today();const b=$("checkinBtn");b.disabled=claimed;b.textContent=claimed?"✓ BONUS CLAIMED":"CLAIM DAILY BONUS";
  const p=local.points;$("m250").textContent=Math.min(100,Math.round(p/250*100))+"%";$("m500").textContent=Math.min(100,Math.round(p/500*100))+"%";$("m1000").textContent=Math.min(100,Math.round(p/1000*100))+"%";
  document.querySelector('[data-reward="milestone"]').disabled=p<1000;document.querySelector('[data-reward="milestone"]').textContent=p>=1000?"UNLOCKED":"LOCKED";
  document.querySelector('[data-reward="speed"]').disabled=local.best<250;document.querySelector('[data-reward="speed"]').textContent=local.best>=250?"UNLOCKED":"LOCKED";
}
async function upsertPlayer(){if(!db||String(user.id).startsWith("demo-"))return;try{await db.from("players").upsert({telegram_id:String(user.id),username:user.username||null,display_name:name,total_points:local.points,games_played:local.games,best_score:local.best,streak:local.streak,updated_at:new Date().toISOString()},{onConflict:"telegram_id"});}catch(e){console.warn(e.message)}}
async function saveGame(){await upsertPlayer();if(!db||String(user.id).startsWith("demo-"))return;try{await db.from("game_results").insert({telegram_id:String(user.id),score,correct_answers:correct,accuracy:Math.round(correct/TOTAL_ROUNDS*100),played_at:new Date().toISOString()});}catch(e){console.warn(e.message)}}

$("startBtn").onclick=startGame;$("playAgainBtn").onclick=startGame;$("homeBtn").onclick=()=>showScreen("home");$("brandHome").onclick=()=>showScreen("home");$("leaderboardBtn").onclick=()=>showScreen("leaderboard");$("profileBtn").onclick=()=>showScreen("profile");$("rewardsBtn").onclick=()=>showScreen("rewards");$("quitGame").onclick=()=>{clearInterval(timer);showScreen("home")};document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>showScreen(b.dataset.back));document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{const n=b.dataset.nav;if(n==="game"){startGame();return}showScreen(n)});

document.querySelectorAll("[data-leader-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-leader-tab]").forEach(x=>x.classList.remove("active"));b.classList.add("active");loadLeaderboard(b.dataset.leaderTab)});
$("checkinBtn").onclick=()=>{const d=today();if(local.lastCheckin===d){showToast("Daily bonus already claimed ✓");return;}local.streak=local.lastCheckin===yesterday()?(local.streak||0)+1:1;const bonus=25+Math.min(25,(local.streak-1)*5);local.lastCheckin=d;local.points+=bonus;saveLocal();updateHeader();refreshRewards();upsertPlayer();showToast(`+${bonus} reward points 🎁`);};

document.querySelectorAll(".mini-redeem").forEach(b=>b.onclick=()=>{if(b.disabled)return;showToast("Milestone unlocked — redemption is operator-configured.")});

function startGame(){clearInterval(timer);score=0;round=1;correct=0;lastGameAt=Date.now();showScreen("game");startRound();}
function startRound(){clearInterval(timer);$("round").textContent=`${round} / ${TOTAL_ROUNDS}`;$("gameProgress").style.width=(round/TOTAL_ROUNDS*100)+"%";target=Math.floor(100+Math.random()*900);$("targetNumber").textContent=target;const nums=[target];while(nums.length<6){const n=Math.floor(100+Math.random()*900);if(!nums.includes(n))nums.push(n)}nums.sort(()=>Math.random()-.5);$("numberGrid").innerHTML="";nums.forEach(n=>{const b=document.createElement("button");b.className="number-btn";b.textContent=n;b.onclick=()=>answer(n);$("numberGrid").appendChild(b)});timeLeft=ROUND_TIME;updateTimer();timer=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0){clearInterval(timer);nextRound()}},1000)}
function updateTimer(){$("timer").textContent=timeLeft;const deg=Math.max(0,timeLeft/ROUND_TIME*360);$("timerRing").style.background=`conic-gradient(#8b5cf6 ${deg}deg,#1b2434 ${deg}deg)`}
function answer(n){document.querySelectorAll(".number-btn").forEach(b=>b.disabled=true);if(n===target){correct++;score+=Math.max(10,timeLeft*2)}else score=Math.max(0,score-2);clearInterval(timer);setTimeout(nextRound,120)}
function nextRound(){round++;if(round>TOTAL_ROUNDS)finishGame();else startRound()}
function finishGame(){clearInterval(timer);const acc=Math.round(correct/TOTAL_ROUNDS*100);local.games++;local.points+=score;local.best=Math.max(local.best,score);local.totalCorrect=(local.totalCorrect||0)+correct;local.bestAccuracy=Math.max(local.bestAccuracy||0,acc);local.lastPlayed=today();local.history=Array.isArray(local.history)?local.history:[];local.history.unshift({date:new Date().toISOString(),score,correct,accuracy:acc});local.history=local.history.slice(0,30);if(local.games===1&&local.streak===0){local.streak=1;local.lastCheckin=today()}saveLocal();updateHeader();$("finalScore").textContent=score;$("correctAnswers").textContent=`${correct}/${TOTAL_ROUNDS}`;$("accuracy").textContent=acc+"%";$("bestScore").textContent=local.best;$("rewardEarned").textContent=score;showScreen("result");saveGame();}

async function loadLeaderboard(mode="all"){
  const box=$("leaderboard");box.innerHTML='<div class="loading">Loading rankings…</div>';let rows=[];
  if(db){try{
    if(mode==="all") {const {data,error}=await db.from("players").select("display_name,username,total_points,best_score").order("total_points",{ascending:false}).limit(20);if(!error&&data)rows=data;}
    else {const cutoff=mode==="today"?new Date(today()+"T00:00:00").toISOString():new Date(Date.now()-7*86400000).toISOString();const {data,error}=await db.from("game_results").select("telegram_id,score,played_at").gte("played_at",cutoff).order("score",{ascending:false}).limit(50);if(!error&&data){const best=new Map();data.forEach(r=>{if(!best.has(r.telegram_id)||r.score>best.get(r.telegram_id).score)best.set(r.telegram_id,r)});const ids=[...best.keys()].slice(0,20);if(ids.length){const {data:ps}=await db.from("players").select("telegram_id,display_name,username,total_points,best_score").in("telegram_id",ids);rows=(ps||[]).map(p=>({...p,total_points:best.get(p.telegram_id)?.score||0})).sort((a,b)=>b.total_points-a.total_points)}}}
  }catch(e){console.warn(e.message)}}
  if(!rows.length)rows=[{display_name:name,username:user.username,total_points:local.points,best_score:local.best}];
  box.innerHTML=rows.map((p,i)=>{const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":String(i+1);const letter=(p.display_name||"P")[0].toUpperCase();return `<div class="player-row"><div class="rank ${i<3?'gold':''}">${medal}</div><div class="player-mini">${escapeHtml(letter)}</div><div class="player-info"><b>${escapeHtml(p.display_name||"Player")}</b><small>${p.username?"@"+escapeHtml(p.username):"Number Challenger"}</small></div><div class="player-points">${Number(p.total_points||0).toLocaleString()}</div></div>`}).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]))}
setUser();refreshProfile();refreshRewards();
