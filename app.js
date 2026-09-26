/* Number Challenge Pro — Telegram Mini App */
const TG = window.Telegram?.WebApp;
if (TG) { TG.ready(); TG.expand(); TG.setHeaderColor("#070a13"); TG.setBackgroundColor("#070a13"); }

const SUPABASE_URL = "https://kxegyhoxpnnvrxpkfsow.supabase.co";
const SUPABASE_KEY = "sb_publishable_2thw3aQHDbdwCm6MCViLPA_HtlnlEfU";
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const screens = ["home","game","result","leaderboard","profile","rewards"];
const $ = id => document.getElementById(id);
let score=0, round=1, correct=0, timeLeft=30, timer=null, target=0;
const TOTAL_ROUNDS=10, ROUND_TIME=30;
let local = JSON.parse(localStorage.getItem("nc_profile") || '{"points":0,"games":0,"best":0,"streak":0,"lastCheckin":""}');

function telegramUser(){
  const u=TG?.initDataUnsafe?.user;
  return u || {id:"demo-"+Math.random().toString(36).slice(2),first_name:"Player",username:"player"};
}
const user=telegramUser();
const name=user.first_name || "Player";
const initial=(name[0]||"P").toUpperCase();

function saveLocal(){ localStorage.setItem("nc_profile",JSON.stringify(local)); }
function showToast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(showToast.t); showToast.t=setTimeout(()=>t.classList.remove("show"),2200); }

function showScreen(name){
  screens.forEach(s=>$(`${s}Screen`).classList.toggle("active",s===name));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===name));
  if(name==="leaderboard") loadLeaderboard();
  if(name==="rewards") refreshRewards();
  if(name==="profile") refreshProfile();
  window.scrollTo({top:0,behavior:"smooth"});
}

function setUser(){
  $("username").textContent=name+" 👋";
  $("profileName").textContent=name;
  $("profileUsername").textContent=user.username ? "@"+user.username : "Telegram Player";
  $("avatar").textContent=initial; $("profileAvatar").textContent=initial;
  updateHeader();
}
function updateHeader(){
  $("score").textContent=local.points.toLocaleString();
  $("homePoints").textContent=local.points.toLocaleString();
  $("streak").textContent=local.streak||0;
}
function refreshProfile(){
  $("profileScore").textContent=local.points.toLocaleString();
  $("gamesPlayed").textContent=local.games;
  $("profileBest").textContent=local.best;
  updateHeader();
}
function refreshRewards(){
  $("rewardPoints").textContent=local.points.toLocaleString();
  $("rewardStreak").textContent=(local.streak||0)+" day streak";
  const today=new Date().toISOString().slice(0,10);
  $("checkinBtn").disabled=local.lastCheckin===today;
  $("checkinBtn").textContent=local.lastCheckin===today ? "✓ BONUS CLAIMED" : "CLAIM DAILY BONUS";
}

async function upsertPlayer(){
  if(!db || user.id==="demo") return;
  try{
    await db.from("players").upsert({
      telegram_id:String(user.id), username:user.username||null, display_name:name,
      total_points:local.points, games_played:local.games, best_score:local.best,
      streak:local.streak, updated_at:new Date().toISOString()
    },{onConflict:"telegram_id"});
  }catch(e){ console.warn("Player sync:",e.message); }
}
async function saveGame(){
  await upsertPlayer();
  if(!db || user.id==="demo") return;
  try{ await db.from("game_results").insert({
    telegram_id:String(user.id), score, correct_answers:correct,
    accuracy:Math.round(correct/TOTAL_ROUNDS*100), played_at:new Date().toISOString()
  }); }catch(e){ console.warn("Game sync:",e.message); }
}

$("startBtn").onclick=startGame;
$("playAgainBtn").onclick=startGame;
$("homeBtn").onclick=()=>showScreen("home");
$("brandHome").onclick=()=>showScreen("home");
$("leaderboardBtn").onclick=()=>showScreen("leaderboard");
$("profileBtn").onclick=()=>showScreen("profile");
$("rewardsBtn").onclick=()=>showScreen("rewards");
$("quitGame").onclick=()=>{clearInterval(timer);showScreen("home");};
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>showScreen(b.dataset.back));
document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{
  const n=b.dataset.nav; if(n==="game"){startGame();return;} showScreen(n);
});
$("checkinBtn").onclick=()=>{
  const today=new Date().toISOString().slice(0,10);
  if(local.lastCheckin===today){showToast("Daily bonus already claimed ✓");return;}
  const y=new Date(Date.now()-86400000).toISOString().slice(0,10);
  local.streak = local.lastCheckin===y ? (local.streak||0)+1 : 1;
  local.lastCheckin=today; local.points+=25; saveLocal(); updateHeader(); refreshRewards(); upsertPlayer();
  showToast("+25 reward points 🎁");
};

function startGame(){
  clearInterval(timer); score=0;round=1;correct=0;
  showScreen("game"); startRound();
}
function startRound(){
  clearInterval(timer);
  $("round").textContent=`${round} / ${TOTAL_ROUNDS}`;
  $("gameProgress").style.width=(round/TOTAL_ROUNDS*100)+"%";
  target=Math.floor(100+Math.random()*900);
  $("targetNumber").textContent=target;
  const nums=[target];
  while(nums.length<6){const n=Math.floor(100+Math.random()*900);if(!nums.includes(n))nums.push(n);}
  nums.sort(()=>Math.random()-.5);
  $("numberGrid").innerHTML="";
  nums.forEach(n=>{
    const b=document.createElement("button"); b.className="number-btn"; b.textContent=n;
    b.onclick=()=>answer(n); $("numberGrid").appendChild(b);
  });
  timeLeft=ROUND_TIME; updateTimer();
  timer=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0){clearInterval(timer);nextRound();}},1000);
}
function updateTimer(){
  $("timer").textContent=timeLeft;
  const deg=Math.max(0,timeLeft/ROUND_TIME*360);
  $("timerRing").style.background=`conic-gradient(#8b5cf6 ${deg}deg,#1b2434 ${deg}deg)`;
}
function answer(n){
  document.querySelectorAll(".number-btn").forEach(b=>b.disabled=true);
  if(n===target){correct++;score+=Math.max(10,timeLeft*2);}
  else score=Math.max(0,score-2);
  clearInterval(timer); setTimeout(nextRound,120);
}
function nextRound(){round++; if(round>TOTAL_ROUNDS) finishGame(); else startRound();}
function finishGame(){
  clearInterval(timer);
  local.games++; local.points+=score; local.best=Math.max(local.best,score);
  if(!local.lastCheckin){local.streak=1;local.lastCheckin=new Date().toISOString().slice(0,10);}
  saveLocal(); updateHeader();
  $("finalScore").textContent=score;
  $("correctAnswers").textContent=`${correct}/${TOTAL_ROUNDS}`;
  $("accuracy").textContent=Math.round(correct/TOTAL_ROUNDS*100)+"%";
  $("bestScore").textContent=local.best;
  $("rewardEarned").textContent=score;
  showScreen("result"); saveGame();
}

async function loadLeaderboard(){
  const box=$("leaderboard"); box.innerHTML='<div class="loading">Loading rankings…</div>';
  let rows=[];
  if(db){
    try{
      const {data,error}=await db.from("players").select("display_name,username,total_points,best_score").order("total_points",{ascending:false}).limit(20);
      if(!error && data) rows=data;
    }catch(e){}
  }
  if(!rows.length){
    rows=[{display_name:name,username:user.username,total_points:local.points,best_score:local.best}];
    if(local.points===0) rows.push({display_name:"Complete your first challenge",username:"",total_points:0,best_score:0});
  }
  box.innerHTML=rows.map((p,i)=>{
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":String(i+1);
    const letter=(p.display_name||"P")[0].toUpperCase();
    return `<div class="player-row"><div class="rank ${i<3?'gold':''}">${medal}</div><div class="player-mini">${letter}</div><div class="player-info"><b>${escapeHtml(p.display_name||"Player")}</b><small>${p.username?"@"+escapeHtml(p.username):"Number Challenger"}</small></div><div class="player-points">${Number(p.total_points||0).toLocaleString()}</div></div>`;
  }).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

setUser(); refreshProfile(); refreshRewards();
