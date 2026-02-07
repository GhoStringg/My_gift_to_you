// ----- Canvas Setup -----
const bgCanvas = document.getElementById("bg-stars");
const bgCtx = bgCanvas.getContext("2d");

const trailCanvas = document.getElementById("trail-stars");
const trailCtx = trailCanvas.getContext("2d");

let width = bgCanvas.width = trailCanvas.width = window.innerWidth;
let height = bgCanvas.height = trailCanvas.height = window.innerHeight;

// ----- Arrays -----
let starsArray = [];
let trailStars = [];

// ----- Sound FX (Web Audio) -----
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone({ freq = 440, duration = 0.08, type = "sine", gain = 0.03 }) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  osc.connect(amp);
  amp.connect(ctx.destination);
  const now = ctx.currentTime;
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

function playClickSound() {
  playTone({ freq: 520, duration: 0.06, type: "triangle", gain: 0.035 });
}

function playHoverTick() {
  playTone({ freq: 780, duration: 0.03, type: "square", gain: 0.02 });
}

function playShimmer() {
  playTone({ freq: 920 + Math.random() * 160, duration: 0.04, type: "sine", gain: 0.015 });
}

// ----- Background music (YouTube embed, starts on first user gesture) -----
const bgMusicHost = document.getElementById("bg-music");
const bgMusicVideoId = "m_7gzTRMOZ8";
function startBackgroundMusic() {
  if (!bgMusicHost || document.getElementById("bg-music-iframe")) return;
  const iframe = document.createElement("iframe");
  iframe.id = "bg-music-iframe";
  iframe.width = "1";
  iframe.height = "1";
  iframe.allow = "autoplay";
  iframe.src =
    `https://www.youtube.com/embed/${bgMusicVideoId}` +
    `?autoplay=1&loop=1&playlist=${bgMusicVideoId}&controls=0&mute=0&playsinline=1&enablejsapi=1`;
  bgMusicHost.appendChild(iframe);
}

window.addEventListener("click", startBackgroundMusic, { once: true });
window.addEventListener("touchstart", startBackgroundMusic, { once: true });

function sendYouTubeCommand(command) {
  const iframe = document.getElementById("bg-music-iframe");
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func: command, args: [] }),
    "*"
  );
}

let musicPaused = false;
const musicButton = document.querySelector(".music-button");
if (musicButton) {
  musicButton.addEventListener("click", () => {
    playClickSound();
    if (!document.getElementById("bg-music-iframe")) {
      startBackgroundMusic();
      musicPaused = false;
      musicButton.classList.remove("is-paused");
      return;
    }
    if (musicPaused) {
      sendYouTubeCommand("playVideo");
      musicPaused = false;
      musicButton.classList.remove("is-paused");
    } else {
      sendYouTubeCommand("pauseVideo");
      musicPaused = true;
      musicButton.classList.add("is-paused");
    }
  });
}

// ----- Background Star Class -----
class Star {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * 1.5 + 0.5;
    this.alpha = Math.random();
    this.delta = Math.random() * 0.02;
  }
  draw() {
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    bgCtx.fillStyle = `rgba(255,255,255,${this.alpha})`;
    bgCtx.fill();
  }
  update() {
    this.alpha += this.delta;
    if(this.alpha <= 0 || this.alpha >= 1) this.delta = -this.delta;
    this.draw();
  }
}

// ----- Trail Star Class -----
class TrailStar {
  constructor(x, y) {
    this.x = x + (Math.random()-0.5)*10;
    this.y = y + (Math.random()-0.5)*10;
    this.radius = Math.random() * 3 + 1.5;
    this.alpha = 1;
    this.fade = Math.random() * 0.03 + 0.01;
    this.dx = (Math.random() - 0.5) * 1;
    this.dy = (Math.random() - 0.5) * 1;
    this.color = `hsl(${Math.random()*50 + 200}, 100%, 80%)`;
  }
  draw() {
    trailCtx.beginPath();
    trailCtx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    trailCtx.fillStyle = `hsla(${this.color.split('(')[1].split(')')[0]}, ${this.alpha})`;
    trailCtx.fill();
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.alpha -= this.fade;
    this.radius *= 0.97;
    this.draw();
  }
}

// ----- Glowing Mouse Cursor -----
class MouseCursor {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.radius = 8;
    this.alpha = 0.9;
  }
  update(x, y) {
    this.x = x;
    this.y = y;
  }
  draw() {
    let gradient = trailCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, `rgba(255,255,255,${this.alpha})`);
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    trailCtx.beginPath();
    trailCtx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    trailCtx.fillStyle = gradient;
    trailCtx.fill();
  }
}

const mouseCursor = new MouseCursor();

// ----- Initialize Background Stars -----
function initStars(num = 200) {
  starsArray = [];
  for(let i=0; i<num; i++){
    starsArray.push(new Star());
  }
}

// ----- Animate Everything -----
function animate() {
  bgCtx.clearRect(0, 0, width, height);
  trailCtx.clearRect(0, 0, width, height);

  // Background stars
  starsArray.forEach(s => s.update());

  // Trail stars
  for(let i=trailStars.length-1; i>=0; i--){
    trailStars[i].update();
    if(trailStars[i].alpha <= 0 || trailStars[i].radius < 0.2) trailStars.splice(i,1);
  }

  // Cursor
  mouseCursor.draw();

  requestAnimationFrame(animate);
}

// ----- Mouse Move -----
window.addEventListener('mousemove', e => {
  mouseCursor.update(e.clientX, e.clientY);

  const count = Math.floor(Math.random() * 5) + 3;
  for(let i=0;i<count;i++){
    trailStars.push(new TrailStar(e.clientX, e.clientY));
  }

});

// ----- Resize -----
window.addEventListener('resize', () => {
  width = bgCanvas.width = trailCanvas.width = window.innerWidth;
  height = bgCanvas.height = trailCanvas.height = window.innerHeight;
  initStars();
});

// ----- Initialize -----
initStars();
animate();
// Make interactive stars twinkle randomly
const interactiveStars = document.querySelectorAll('.interactive-stars .star');

interactiveStars.forEach(star => {
  const duration = Math.random() * 2 + 1; // 1s to 3s
  star.style.animationDuration = `${duration}s`;
  star.style.animationDelay = `${Math.random()*2}s`;
});

function positionStarMessage(star) {
  const message = star.querySelector(".message");
  if (!message) return;

  message.classList.remove("is-bottom", "is-left", "is-right");
  const rect = message.getBoundingClientRect();
  const padding = 12;

  if (rect.top < padding) {
    message.classList.add("is-bottom");
  }

  if (rect.right > window.innerWidth - padding) {
    message.classList.add("is-right");
  } else if (rect.left < padding) {
    message.classList.add("is-left");
  }
}

function closeAllStarMessages() {
  interactiveStars.forEach(s => s.classList.remove("is-open"));
}

interactiveStars.forEach(star => {
  star.addEventListener("click", (e) => {
    e.preventDefault();
    playClickSound();
    const willOpen = !star.classList.contains("is-open");
    closeAllStarMessages();
    if (willOpen) star.classList.add("is-open");
  });

  star.addEventListener("touchstart", (e) => {
    e.preventDefault();
    playClickSound();
    const willOpen = !star.classList.contains("is-open");
    closeAllStarMessages();
    if (willOpen) star.classList.add("is-open");
  }, { passive: false });

  star.addEventListener("mouseenter", () => {
    positionStarMessage(star);
  });
  star.addEventListener("focus", () => {
    positionStarMessage(star);
  });
  star.addEventListener("click", () => positionStarMessage(star));
  star.addEventListener("touchstart", () => positionStarMessage(star), { passive: true });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".interactive-stars .star")) {
    closeAllStarMessages();
  }
});

window.addEventListener("resize", () => {
  interactiveStars.forEach(star => positionStarMessage(star));
});

// ----- Floating "I love you" texts -----
const loveStream = document.querySelector(".love-stream");
const lovePhrases = [
  "사랑해",
  "사랑합니다",
  "사랑해요",
  "愛してる",
  "大好き",
  "我爱你",
  "愛你",
  "รักเธอ",
  "ฉันรักคุณ",
  "Te amo",
  "Kaluguran daka",
  "Anh yêu em",
  "Em yêu anh",
  "Mahal kita"
];

function spawnLoveText() {
  if (!loveStream) return;

  const text = document.createElement("span");
  text.className = "love-text";
  text.textContent = lovePhrases[Math.floor(Math.random() * lovePhrases.length)];

  if (Math.random() < 0.35) {
    text.classList.add("vertical");
  }

  const padding = 24;
  const width = loveStream.clientWidth;
  const height = loveStream.clientHeight;
  const cornerW = Math.max(120, width * 0.28);
  const cornerH = Math.max(120, height * 0.28);
  const maxTexts = Math.max(6, Math.floor((width * height) / 120000));

  if (loveStream.querySelectorAll(".love-text").length >= maxTexts) {
    return;
  }

  text.style.opacity = "0";
  loveStream.appendChild(text);

  const existing = Array.from(loveStream.querySelectorAll(".love-text"))
    .filter(el => el !== text)
    .map(el => el.getBoundingClientRect());

  let placed = false;
  for (let attempt = 0; attempt < 12 && !placed; attempt++) {
    const corner = Math.floor(Math.random() * 4);
    let x = padding;
    let y = padding;
    if (corner === 0) {
      x = Math.random() * cornerW + padding;
      y = Math.random() * cornerH + padding;
    } else if (corner === 1) {
      x = width - cornerW + Math.random() * cornerW - padding;
      y = Math.random() * cornerH + padding;
    } else if (corner === 2) {
      x = Math.random() * cornerW + padding;
      y = height - cornerH + Math.random() * cornerH - padding;
    } else {
      x = width - cornerW + Math.random() * cornerW - padding;
      y = height - cornerH + Math.random() * cornerH - padding;
    }

    text.style.left = `${x}px`;
    text.style.top = `${y}px`;

    const rect = text.getBoundingClientRect();
    const safe = existing.every(other => (
      rect.right + 16 < other.left ||
      rect.left - 16 > other.right ||
      rect.bottom + 16 < other.top ||
      rect.top - 16 > other.bottom
    ));

    if (safe) placed = true;
  }

  if (!placed) {
    text.style.left = `${padding}px`;
    text.style.top = `${padding}px`;
  }

  text.style.opacity = "";
  text.style.animationDuration = `${Math.random() * 2 + 5.5}s`;

  text.addEventListener("animationend", () => {
    text.remove();
  });
}

if (loveStream) {
  setInterval(spawnLoveText, 900);
  for (let i = 0; i < 6; i++) {
    setTimeout(spawnLoveText, i * 300);
  }
}

// ----- Daily message modal -----
const moonButton = document.querySelector(".moon-button");
const dailyOverlay = document.getElementById("daily-overlay");
const dailyOpen = document.getElementById("daily-open");
const dailyCancel = document.getElementById("daily-cancel");
const dailyDesc = document.getElementById("daily-desc");
const moonTimer = document.getElementById("moon-timer");
const moonToast = document.getElementById("moon-toast");
const debugButton = document.querySelector(".debug-button");
const debugPanel = document.getElementById("debug-panel");
const resetButton = document.querySelector(".reset-button");
const mailButton = document.querySelector(".mail-button");
const mailPanel = document.getElementById("mail-panel");
const mailList = document.getElementById("mail-list");
const essayOverlay = document.getElementById("essay-overlay");
const essayTitle = document.getElementById("essay-title");
const essayBody = document.getElementById("essay-body");
const essayClose = document.getElementById("essay-close");
const essayImage = document.getElementById("essay-image");

const DAILY_KEY = "dailyMessageOpened";
const TOTAL_MESSAGES = 8;
const START_DATE_PH = "2026-02-07";
const PH_OFFSET_MS = 8 * 60 * 60 * 1000;
const MESSAGES_KEY = "dailyMessageList";

function getPHDateParts(date = new Date()) {
  const phNow = new Date(date.getTime() + PH_OFFSET_MS);
  return {
    y: phNow.getUTCFullYear(),
    m: phNow.getUTCMonth(),
    d: phNow.getUTCDate()
  };
}

function getPHNextMidnightMs() {
  const parts = getPHDateParts();
  const nextMidnightUTC = Date.UTC(parts.y, parts.m, parts.d + 1, 0, 0, 0);
  return nextMidnightUTC - PH_OFFSET_MS;
}

function daysSinceStartPH() {
  const start = new Date(`${START_DATE_PH}T00:00:00+08:00`).getTime();
  const now = Date.now();
  const diffMs = now - start;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function getOpenedCount() {
  return parseInt(localStorage.getItem(DAILY_KEY) || "0", 10);
}

function setOpenedCount(count) {
  localStorage.setItem(DAILY_KEY, String(count));
}

function getAvailableCredits() {
  const days = daysSinceStartPH();
  if (days < 0) return 0;
  const unlocked = Math.min(days + 1, TOTAL_MESSAGES);
  return Math.max(0, unlocked - getOpenedCount());
}

function canOpenDailyMessage() {
  return getAvailableCredits() > 0;
}

function openDailyModal() {
  if (!dailyOverlay) return;
  const credits = getAvailableCredits();
  const canOpen = credits > 0;
  if (dailyDesc) {
    dailyDesc.textContent = canOpen
      ? `You have ${credits} message${credits === 1 ? "" : "s"} available.`
      : "No messages available right now. Come back tomorrow.";
  }
  if (dailyOpen) {
    dailyOpen.disabled = !canOpen;
    dailyOpen.textContent = canOpen ? "Yes, show me" : "Come back tomorrow";
  }
  dailyOverlay.classList.add("is-open");
  document.body.classList.add("modal-blur");
  dailyOverlay.setAttribute("aria-hidden", "false");
}

function closeDailyModal() {
  if (!dailyOverlay) return;
  dailyOverlay.classList.remove("is-open");
  document.body.classList.remove("modal-blur");
  dailyOverlay.setAttribute("aria-hidden", "true");
}

if (moonButton) {
  moonButton.addEventListener("click", () => {
    playClickSound();
    if (!canOpenDailyMessage()) {
      showMoonToast("No messages available yet.");
      return;
    }
    openDailyModal();
  });
}

if (dailyCancel) {
  dailyCancel.addEventListener("click", () => {
    playClickSound();
    closeDailyModal();
  });
}

if (dailyOverlay) {
  dailyOverlay.addEventListener("click", (e) => {
    if (e.target === dailyOverlay) closeDailyModal();
  });
}

if (dailyOpen) {
  dailyOpen.addEventListener("click", () => {
    playClickSound();
    if (!canOpenDailyMessage()) return;
    const opened = Math.min(getOpenedCount() + 1, TOTAL_MESSAGES);
    setOpenedCount(opened);
    revealUnlockedStars();
    updateMoonTimer();
    showEssayMessage(opened);
    closeDailyModal();
  });
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateMoonTimer() {
  if (!moonTimer) return;
  const remaining = getPHNextMidnightMs() - Date.now();
  moonTimer.textContent = formatTime(remaining);
}

updateMoonTimer();
setInterval(updateMoonTimer, 1000);

let moonToastTimer = null;
function showMoonToast(message) {
  if (!moonToast) return;
  moonToast.textContent = message;
  moonToast.classList.add("is-visible");
  if (moonToastTimer) clearTimeout(moonToastTimer);
  moonToastTimer = setTimeout(() => {
    moonToast.classList.remove("is-visible");
  }, 2000);
}

function revealUnlockedStars() {
  const stars = document.querySelectorAll(".interactive-stars .star");
  const opened = Math.min(getOpenedCount(), TOTAL_MESSAGES);
  stars.forEach((star) => {
    const idx = parseInt(star.getAttribute("data-star-index") || "0", 10);
    if (idx > 0 && idx <= opened) {
      star.classList.remove("star-hidden");
      star.classList.add("star-revealed");
    } else {
      star.classList.add("star-hidden");
      star.classList.remove("star-revealed");
    }
  });
}

revealUnlockedStars();

// ----- Essay messages and mail -----
let essayMessages = [
  "Tonight, I’m learning the language of your quiet. It’s the way your name softens every hard edge of the day and how even the smallest light feels warmer when I think of you.",
  "If I could fold time like paper, I’d tuck every good moment into your hands. You have a way of turning ordinary hours into something I want to keep forever.",
  "The stars are busy being bright, but you are the reason I believe in constellations. You connect the scattered parts of me into something whole.",
  "I love you in the small spaces — in the pauses, in the sighs, in the gentle afterglow of laughter. You make the quiet feel like home.",
  "Some nights I count the skies, but I always end up counting the ways you change my world. You are my favorite kind of miracle.",
  "If love is a map, you are the north star. I find my way back to you, again and again, with a heart that knows where it belongs.",
  "There is a calm in me that only you can reach. You are the softening of all my storms and the light that follows after.",
  "I don’t need grand gestures to know this truth — you are the place my heart rests, the warmth I carry, the wish I keep."
];
const essayImages = [
  "Image.jpg",
  "Image1.jpg",
  "Image2.jpg",
  "Image3.jpg",
  "Image4.jpg",
  "Image5.gif",
  "Image6.jpg",
  "Image7.jpg"
];

function loadMessageList() {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessageList(list) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
}

function renderMailList() {
  if (!mailList) return;
  const list = loadMessageList();
  if (list.length === 0) {
    mailList.innerHTML = "<li>No messages yet.</li>";
    return;
  }
  mailList.innerHTML = list
    .map((item) => `<li><strong>${item.title}</strong><br><small>${item.date}</small><br>${item.text}</li>`)
    .join("");
}

function getStarTitle(index) {
  const star = document.querySelector(`.interactive-stars .star[data-star-index="${index}"]`);
  const msg = star ? star.querySelector(".message") : null;
  if (!msg) return `Message ${index}`;
  const img = msg.querySelector("img");
  if (img) img.remove();
  const text = msg.textContent.trim();
  if (img) msg.appendChild(img);
  return text || `Message ${index}`;
}

function getPHDateLabel() {
  const parts = getPHDateParts();
  const mm = String(parts.m + 1).padStart(2, "0");
  const dd = String(parts.d).padStart(2, "0");
  return `${parts.y}-${mm}-${dd}`;
}

function showEssayMessage(index) {
  const text = essayMessages[index - 1] || essayMessages[essayMessages.length - 1];
  const image = essayImages[index - 1];
  const title = getStarTitle(index);
  if (essayTitle) essayTitle.textContent = title;
  if (essayBody) essayBody.textContent = text;
  if (essayImage) {
    if (image) {
      essayImage.src = image;
      essayImage.classList.add("is-visible");
    } else {
      essayImage.removeAttribute("src");
      essayImage.classList.remove("is-visible");
    }
  }
  if (essayOverlay) {
    essayOverlay.classList.add("is-open");
    essayOverlay.setAttribute("aria-hidden", "false");
  }

  const list = loadMessageList();
  if (!list.find((m) => m.index === index)) {
    list.push({ index, title, date: getPHDateLabel(), text });
    saveMessageList(list);
    renderMailList();
  }
}

async function loadEssayMessages() {
  try {
    const res = await fetch("essays.txt");
    if (!res.ok) return;
    const raw = await res.text();
    const parts = raw
      .split(/\r?\n\s*---\s*\r?\n/g)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length) {
      essayMessages = parts;
    }
  } catch {
    // keep fallback
  }
}

loadEssayMessages();

if (essayClose) {
  essayClose.addEventListener("click", () => {
    playClickSound();
    if (!essayOverlay) return;
    essayOverlay.classList.remove("is-open");
    essayOverlay.setAttribute("aria-hidden", "true");
  });
}

if (essayOverlay) {
  essayOverlay.addEventListener("click", (e) => {
    if (e.target === essayOverlay) {
      essayOverlay.classList.remove("is-open");
      essayOverlay.setAttribute("aria-hidden", "true");
    }
  });
}

if (mailButton && mailPanel) {
  mailButton.addEventListener("click", () => {
    playClickSound();
    mailPanel.classList.toggle("is-visible");
    mailPanel.setAttribute("aria-hidden", mailPanel.classList.contains("is-visible") ? "false" : "true");
    mailButton.classList.toggle("is-open", mailPanel.classList.contains("is-visible"));
    renderMailList();
  });
}

renderMailList();

// ----- Debug panel -----
function updateDebugPanel() {
  if (!debugPanel) return;
  const credits = getAvailableCredits();
  const opened = getOpenedCount();
  const days = daysSinceStartPH();
  const phKey = (function () {
    const parts = getPHDateParts();
    const mm = String(parts.m + 1).padStart(2, "0");
    const dd = String(parts.d).padStart(2, "0");
    return `${parts.y}-${mm}-${dd}`;
  })();
  debugPanel.textContent =
    `PH date: ${phKey}\n` +
    `Days since start: ${days}\n` +
    `Opened: ${opened}/${TOTAL_MESSAGES}\n` +
    `Available: ${credits}\n` +
    `Next reset in: ${moonTimer ? moonTimer.textContent : "n/a"}`;
}

if (debugButton && debugPanel) {
  debugButton.addEventListener("click", () => {
    debugPanel.classList.toggle("is-visible");
    debugPanel.setAttribute("aria-hidden", debugPanel.classList.contains("is-visible") ? "false" : "true");
    updateDebugPanel();
  });
}

setInterval(updateDebugPanel, 1000);

// Reset handler intentionally disabled for publish.
// If you want it back, uncomment this block.
// if (resetButton) {
//   resetButton.addEventListener("click", () => {
//     setOpenedCount(0);
//     localStorage.removeItem(MESSAGES_KEY);
//     revealUnlockedStars();
//     updateMoonTimer();
//     showMoonToast("Timer reset. Messages available.");
//     updateDebugPanel();
//     renderMailList();
//   });
// }

