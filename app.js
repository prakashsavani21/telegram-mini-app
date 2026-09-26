const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor("#070b14");
  tg.setBackgroundColor("#070b14");
}

const screens = {
  home: document.getElementById("homeScreen"),
  game: document.getElementById("gameScreen"),
  result: document.getElementById("resultScreen"),
  leaderboard: document.getElementById("leaderboardScreen"),
  profile: document.getElementById("profileScreen")
};

let score = 0;
let round = 1;
let correct = 0;
let gamesPlayed = Number(localStorage.getItem("gamesPlayed") || 0);

let timeLeft = 30;
let timerInterval = null;

const totalRounds = 10;

function showScreen(screen) {
  Object.values(screens).forEach(s => {
    s.classList.remove("active");
  });

  screens[screen].classList.add("active");
}

function getTelegramUser() {
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }

  return {
    id: "demo",
    first_name: "Player",
    username: "player"
  };
}

const user = getTelegramUser();

const displayName = user.first_name || "Player";

document.getElementById("username").textContent =
  displayName + " 👋";

document.getElementById("profileName").textContent =
  displayName;

document.getElementById("profileUsername").textContent =
  user.username
    ? "@" + user.username
    : "Telegram Player";


function randomNumber() {
  return Math.floor(100 + Math.random() * 900);
}


function startGame() {

  score = 0;
  round = 1;
  correct = 0;

  updateScore();

  showScreen("game");

  startRound();
}


function startRound() {

  clearInterval(timerInterval);

  document.getElementById("round").textContent =
    `${round} / ${totalRounds}`;

  const target = randomNumber();

  document.getElementById("targetNumber").textContent =
    target;

  createNumberButtons(target);

  timeLeft = 30;

  updateTimer();

  timerInterval = setInterval(() => {

    timeLeft--;

    updateTimer();

    if (timeLeft <= 0) {

      clearInterval(timerInterval);

      nextRound();
    }

  }, 1000);
}


function createNumberButtons(target) {

  const grid = document.getElementById("numberGrid");

  grid.innerHTML = "";

  const numbers = [target];

  while (numbers.length < 6) {

    const fake = randomNumber();

    if (!numbers.includes(fake)) {
      numbers.push(fake);
    }
  }

  numbers.sort(() => Math.random() - 0.5);

  numbers.forEach(number => {

    const button = document.createElement("button");

    button.className = "number-btn";

    button.textContent = number;

    button.addEventListener("click", () => {

      if (number === target) {

        correct++;

        score += Math.max(10, timeLeft * 2);

      }

      clearInterval(timerInterval);

      nextRound();

    });

    grid.appendChild(button);

  });
}


function nextRound() {

  round++;

  if (round > totalRounds) {

    finishGame();

  } else {

    startRound();

  }
}


function finishGame() {

  clearInterval(timerInterval);

  gamesPlayed++;

  localStorage.setItem(
    "gamesPlayed",
    gamesPlayed
  );

  document.getElementById("finalScore").textContent =
    score;

  document.getElementById("correctAnswers").textContent =
    `${correct} / ${totalRounds}`;

  const accuracy =
    Math.round((correct / totalRounds) * 100);

  document.getElementById("accuracy").textContent =
    accuracy + "%";

  updateScore();

  showScreen("result");
}


function updateScore() {

  document.getElementById("score").textContent =
    score;

  document.getElementById("profileScore").textContent =
    score;

  document.getElementById("gamesPlayed").textContent =
    gamesPlayed;
}


function updateTimer() {

  document.getElementById("timer").textContent =
    timeLeft;

  const percentage =
    (timeLeft / 30) * 100;

  document.getElementById("progressBar").style.width =
    percentage + "%";
}


/* BUTTONS */

document.getElementById("startBtn")
  .addEventListener("click", startGame);


document.getElementById("playAgainBtn")
  .addEventListener("click", startGame);


document.getElementById("homeBtn")
  .addEventListener("click", () => {
    showScreen("home");
  });


document.getElementById("leaderboardBtn")
  .addEventListener("click", () => {
    showScreen("leaderboard");
  });


document.getElementById("profileBtn")
  .addEventListener("click", () => {

    updateScore();

    showScreen("profile");

  });


document.getElementById("backFromLeaderboard")
  .addEventListener("click", () => {
    showScreen("home");
  });


document.getElementById("backFromProfile")
  .addEventListener("click", () => {
    showScreen("home");
  });