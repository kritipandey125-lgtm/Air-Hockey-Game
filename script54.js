const CV = document.getElementById("c");
const G = CV.getContext("2d");
CV.width = 760;
CV.height = 520;
const W = 760,
    H = 520;

// ── DOM refs ──
const readyEl = document.getElementById("ready-screen");
const gameoverEl = document.getElementById("gameover-screen");
const goWho = document.getElementById("go-who");
const goFinal = document.getElementById("go-final");
const goWinsEl = document.getElementById("go-wins");
document.getElementById("btn-again").onclick = startGame;

const DOM = {
    scoreP: document.getElementById("score-p"),
    scoreCPU: document.getElementById("score-cpu"),
    pStreak: document.getElementById("stat-p-streak"),
    pSpeed: document.getElementById("stat-p-speed"),
    pPower: document.getElementById("stat-p-power"),
    cpuStreak: document.getElementById("stat-cpu-streak"),
    cpuSpeed: document.getElementById("stat-cpu-speed"),
    cpuPower: document.getElementById("stat-cpu-power")
};

// ── Audio Engine ──
let audioCtx = null;
let muted = true;
function getAudio() {
    if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}
function mkNoise(ctx, dur) {
    const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource();
    s.buffer = b;
    return s;
}
function playSound(type, speed = 1) {
    if (muted) return;
    const ctx = getAudio();
    const t = ctx.currentTime;
    const out = ctx.destination;
    if (type === "hit") {
        const n = mkNoise(ctx, 0.07);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 900 + speed * 180 + Math.random() * 400;
        bp.Q.value = 2 + Math.random() * 3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.5 + Math.min(speed / 18, 0.35), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        n.connect(bp);
        bp.connect(g);
        g.connect(out);
        n.start(t);
        n.stop(t + 0.07);
    }
    if (type === "wall") {
        const n = mkNoise(ctx, 0.04);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 1400 + Math.random() * 600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        n.connect(hp);
        hp.connect(g);
        g.connect(out);
        n.start(t);
        n.stop(t + 0.04);
    }
    if (type === "goal") {
        const sub = ctx.createOscillator(),
            sg = ctx.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(60, t);
        sub.frequency.exponentialRampToValueAtTime(28, t + 0.25);
        sg.gain.setValueAtTime(0.6, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        sub.connect(sg);
        sg.connect(out);
        sub.start(t);
        sub.stop(t + 0.3);
        [
            [0, "sawtooth", 233],
            [0.01, "sawtooth", 220],
            [0.02, "sawtooth", 246]
        ].forEach(([dt, wv, f]) => {
            const o = ctx.createOscillator(),
                g = ctx.createGain();
            o.type = wv;
            o.frequency.value = f;
            g.gain.setValueAtTime(0.15, t + dt);
            g.gain.setValueAtTime(0.15, t + 0.5);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
            o.connect(g);
            g.connect(out);
            o.start(t + dt);
            o.stop(t + 0.71);
        });
    }
    if (type === "victory") {
        [
            [0, 392, 0.12],
            [0.13, 392, 0.12],
            [0.26, 392, 0.12],
            [0.39, 523, 0.45],
            [0.58, 494, 0.18],
            [0.77, 440, 0.18],
            [0.96, 523, 0.6]
        ].forEach(([dt, f, dur]) => {
            [-4, 0, 4].forEach((cents) => {
                const o = ctx.createOscillator(),
                    g = ctx.createGain();
                o.type = "sawtooth";
                o.frequency.value = f * Math.pow(2, cents / 1200);
                const lp = ctx.createBiquadFilter();
                lp.type = "lowpass";
                lp.frequency.value = 1800;
                g.gain.setValueAtTime(0, t + dt);
                g.gain.linearRampToValueAtTime(0.08, t + dt + 0.02);
                g.gain.setValueAtTime(0.08, t + dt + dur - 0.03);
                g.gain.exponentialRampToValueAtTime(0.001, t + dt + dur);
                o.connect(lp);
                lp.connect(g);
                g.connect(out);
                o.start(t + dt);
                o.stop(t + dt + dur + 0.01);
            });
        });
    }
    if (type === "speedup") {
        const n = mkNoise(ctx, 0.4);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 5;
        bp.frequency.setValueAtTime(300, t);
        bp.frequency.exponentialRampToValueAtTime(3000, t + 0.38);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        n.connect(bp);
        bp.connect(g);
        g.connect(out);
        n.start(t);
        n.stop(t + 0.4);
    }
    if (type === "slomo_in") {
        const o = ctx.createOscillator(),
            g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(100, t);
        o.frequency.exponentialRampToValueAtTime(36, t + 0.65);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        o.connect(g);
        g.connect(out);
        o.start(t);
        o.stop(t + 0.7);
    }
}
// ── Mute label ──
const muteBtn = document.getElementById("mute-btn");
function updateMuteLabel() {
    muteBtn.innerHTML = muted ? "PRESS S FOR SOUND" : "PRESS S TO MUTE";
}
updateMuteLabel();
function toggleMute() {
    muted = !muted;
    if (!muted) getAudio().resume();
    updateMuteLabel();
}

// ── Confetti ──
const confetti = [];
const CONF_COLORS = [
    "#00d4ff",
    "#ff2d55",
    "#ffc940",
    "#ffffff",
    "#a855f7",
    "#22c55e",
    "#fb923c"
];
function spawnConfetti() {
    for (let i = 0; i < 160; i++) {
        confetti.push({
            x: Math.random() * W,
            y: -10 - Math.random() * 120,
            vx: (Math.random() - 0.5) * 5,
            vy: 2 + Math.random() * 4,
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.22,
            w: 6 + Math.random() * 8,
            h: 3 + Math.random() * 4,
            col: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
            life: 1
        });
    }
}
function updateConfetti() {
    for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.08;
        c.vx *= 0.99;
        c.rot += c.rotV;
        if (c.y > H + 20) c.life -= 0.05;
        if (c.life <= 0) confetti.splice(i, 1);
    }
}
function drawConfetti() {
    confetti.forEach((c) => {
        G.save();
        G.globalAlpha = c.life;
        G.translate(c.x, c.y);
        G.rotate(c.rot);
        G.fillStyle = c.col;
        G.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        G.restore();
    });
}

// ── Slo-mo state ──
let sloMo = false;
let sloMoAlpha = 0;
let sloMoIntro = 0;
let confettiInterval = null;
let showSadFace = false; // counts down for big entrance flash
let sloMoLabelTimer = 0; // counts down before label fades
const TABLE_X = 30,
    TABLE_Y = 30,
    TABLE_W = W - 60,
    TABLE_H = H - 60;
const CX = W / 2,
    CY = H / 2;
const GOAL_W = 160,
    GOAL_DEPTH = 20;
const GOAL_Y1 = CY - GOAL_W / 2,
    GOAL_Y2 = CY + GOAL_W / 2;
const PUCK_R = 14;
const MALLET_R = 24;
const MAX_SCORE = 7;
const FRICTION = 0.995;
const WALL_BOUNCE = 0.82;

// CPU difficulty tuning
const CPU_SPEED = 4.6;
const CPU_REACT = 0.62;
const CPU_ERROR_Y = 26;
const CPU_MISTAKE_CHANCE = 0.018;
const CPU_MISTAKE_DUR = 42;

// ── State ──
let state = "title";
let tick = 0;
let shakeX = 0,
    shakeY = 0,
    shakeAmt = 0;
let goalFlash = 0,
    goalWho = "";
let goalMsgScale = 0;
let puckSpeedMult = 1.0; // escalates every 2 goals
let lastSpeedUpAt = 0; // total goals when last speed-up happened
let speedUpMsg = "";
let speedUpTimer = 0;

// ── Match stats ──
const stats = {
    p: { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 },
    cpu: { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 },
    rallyHits: 0,
    totalHits: 0
};
function resetStats() {
    stats.p = { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 };
    stats.cpu = { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 };
    stats.rallyHits = 0;
    stats.totalHits = 0;
}

// ── Score ──
const score = { p: 0, cpu: 0 };

// ── Puck ──
const puck = { x: CX, y: CY, vx: 0, vy: 0, r: PUCK_R };
const trail = [];

// ── Mallets ──
const player = {
    x: TABLE_X + 130,
    y: CY,
    tx: TABLE_X + 130,
    ty: CY,
    r: MALLET_R,
    pvx: 0,
    pvy: 0
};
const cpu = {
    x: W - TABLE_X - 130,
    y: CY,
    r: MALLET_R,
    vx: 0,
    vy: 0,
    mistakeTimer: 0,
    errorY: 0,
    hitCool: 0
};

// ── Particles ──
const particles = [];
function burst(x, y, col1, col2, n = 22) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2,
            s = 2 + Math.random() * 7;
        particles.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 1,
            col: Math.random() > 0.5 ? col1 : col2,
            size: 2 + Math.random() * 4,
            glow: Math.random() > 0.4,
            gravity: 0.08 + Math.random() * 0.12
        });
    }
}
function sparkLine(x1, y1, x2, y2, col, n = 8) {
    for (let i = 0; i < n; i++) {
        const t = Math.random();
        const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 10;
        const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 10;
        const a = Math.random() * Math.PI * 2,
            s = 1 + Math.random() * 3;
        particles.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 1,
            col,
            size: 1.5 + Math.random() * 2,
            glow: true,
            gravity: 0.1
        });
    }
}

// ── Input ──
// Track raw pointer; clamp inside updatePlayer so mallet stays on table regardless
let rawMouseX = TABLE_X + 120,
    rawMouseY = H / 2;
let prevRawX = TABLE_X + 120,
    prevRawY = H / 2;
let mouseVX = 0,
    mouseVY = 0;

function pointerToCanvas(clientX, clientY) {
    const r = CV.getBoundingClientRect();
    const scaleX = W / r.width,
        scaleY = H / r.height;
    const nx = (clientX - r.left) * scaleX;
    const ny = (clientY - r.top) * scaleY;
    // clamp to player's half of the table
    rawMouseX = clamp(nx, TABLE_X + MALLET_R + 2, CX - 10);
    rawMouseY = clamp(
        ny,
        TABLE_Y + MALLET_R + 2,
        TABLE_Y + TABLE_H - MALLET_R - 2
    );
}

CV.addEventListener("mousemove", (e) => pointerToCanvas(e.clientX, e.clientY));
document.addEventListener("mousemove", (e) =>
    pointerToCanvas(e.clientX, e.clientY)
);

CV.addEventListener(
    "touchmove",
    (e) => {
        e.preventDefault();
        pointerToCanvas(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
);

CV.addEventListener(
    "touchstart",
    (e) => {
        e.preventDefault();
        pointerToCanvas(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false }
);

document.addEventListener("keydown", (e) => {
    if (e.code === "KeyS") toggleMute();
    if (e.code === "Space" && state === "over") startGame();
});

// ── Game flow ──
function startGame() {
    score.p = 0;
    score.cpu = 0;
    resetStats();
    puckSpeedMult = 1.0;
    lastSpeedUpAt = 0;
    speedUpMsg = "";
    speedUpTimer = 0;
    sloMo = false;
    sloMoAlpha = 0;
    sloMoIntro = 0;
    sloMoLabelTimer = 0;
    confetti.length = 0;
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
    showSadFace = false;
    resetRound("p");
    state = "play";
    if (readyEl) readyEl.classList.remove("on");
    gameoverEl.classList.remove("on", "lose-state");
    particles.length = 0;
    updateStatDOM();
}

function resetRound(server) {
    trail.length = 0;
    puck.x = CX;
    puck.y = CY;
    puck.vx = 0;
    puck.vy = 0;
    player.x = TABLE_X + 120;
    player.y = CY;
    player.pvx = 0;
    player.pvy = 0;
    cpu.x = W - TABLE_X - 120;
    cpu.y = CY;
    cpu.vx = 0;
    cpu.vy = 0;
    cpu.mistakeTimer = 0;
    stats.rallyHits = 0;
    if (server === "p") {
        puck.vx = -(3.5 + Math.random() * 1.5) * puckSpeedMult;
        puck.vy = (Math.random() - 0.5) * 3.5 * puckSpeedMult;
    } else {
        puck.vx = (3.5 + Math.random() * 1.5) * puckSpeedMult;
        puck.vy = (Math.random() - 0.5) * 3.5 * puckSpeedMult;
    }
}

function goalScored(who) {
    if (state !== "play") return;
    state = "goal";
    goalWho = who;
    goalFlash = 160;
    goalMsgScale = 0;

    const ws = stats[who],
        ls = stats[who === "p" ? "cpu" : "p"];
    ws.goals++;
    ws.streak++;
    ws.bestStreak = Math.max(ws.bestStreak, ws.streak);
    ls.streak = 0;

    score[who]++;
    const totalGoals = score.p + score.cpu;
    if (totalGoals % 2 === 0 && totalGoals > lastSpeedUpAt) {
        lastSpeedUpAt = totalGoals;
        puckSpeedMult = Math.min(puckSpeedMult + 0.14, 2.0);
        const msgs = [
            "SPEEDING UP!",
            "FASTER!!",
            "KICK IT UP!",
            "NO MERCY!",
            "LIGHT SPEED!",
            "HOLD ON!!"
        ];
        speedUpMsg = msgs[Math.min(Math.floor(totalGoals / 2 - 1), msgs.length - 1)];
        speedUpTimer = 130;
    }
    if (who === "p") burst(TABLE_X, CY, "#00d4ff", "#ffffff", 40);
    else burst(W - TABLE_X, CY, "#ff2d55", "#ffffff", 40);
    burst(puck.x, puck.y, "#ffc940", "#ffffff", 30);
    shake(8);

    updateStatDOM();

    // Slo-mo triggers when either player is now at game point (MAX_SCORE - 1)
    const newP = score.p,
        newCPU = score.cpu;
    if ((newP === MAX_SCORE - 1 || newCPU === MAX_SCORE - 1) && !sloMo) {
        sloMo = true;
        sloMoIntro = 80;
        sloMoLabelTimer = 80 + 90; // intro (80) + hold (90) then fade
    }
    // Cancel slo-mo only when a new game starts, not on game over
    // if newP >= MAX_SCORE keep sloMo running for dramatic effect

    setTimeout(() => {
        if (score.p >= MAX_SCORE || score.cpu >= MAX_SCORE) {
            state = "over";
            const playerWon = score.p >= MAX_SCORE;
            goWho.textContent = playerWon ? "YOU WIN" : "CPU WINS";
            goWho.style.color = playerWon ? "#00d4ff" : "#ff2d55";
            goWho.style.textShadow = playerWon
                ? "0 0 30px #00d4ff, 0 0 60px rgba(0,212,255,0.4)"
                : "0 0 30px #ff2d55, 0 0 60px rgba(255,45,85,0.4)";
            goWinsEl.textContent = playerWon
                ? "GAME · SET · MATCH"
                : "BETTER LUCK NEXT TIME";
            document.getElementById("go-face").textContent = playerWon ? "😄" : "😢";
            goFinal.textContent = `${score.p} – ${score.cpu}`;
            gameoverEl.classList.remove("lose-state");
            if (!playerWon) gameoverEl.classList.add("lose-state");
            burst(CX, CY, "#ffc940", "#ffffff", 80);
            if (playerWon) {
                playSound("victory");
                spawnConfetti();
                setTimeout(spawnConfetti, 400);
                setTimeout(spawnConfetti, 800);
                setTimeout(spawnConfetti, 1400);
                confettiInterval = setInterval(spawnConfetti, 1400);
            }
            gameoverEl.classList.add("on");
        } else {
            resetRound(who === "p" ? "cpu" : "p");
            state = "play";
        }
    }, 1500);
}

function shake(amt) {
    shakeAmt = Math.max(shakeAmt, amt);
}

// ── Update stat DOM ──
function updateStatDOM() {
    DOM.scoreP.textContent = score.p;
    DOM.scoreCPU.textContent = score.cpu;
    DOM.pStreak.textContent = stats.p.bestStreak;
    DOM.pSpeed.textContent = stats.p.topSpeed;
    DOM.pPower.textContent = stats.p.powerHits;
    DOM.cpuStreak.textContent = stats.cpu.bestStreak;
    DOM.cpuSpeed.textContent = stats.cpu.topSpeed;
    DOM.cpuPower.textContent = stats.cpu.powerHits;
}

// ── CPU AI ──
function updateCPU(ts = 1) {
    const halfW = W / 2;
    const homeX = W - TABLE_X - 110;
    const minX = halfW + 10,
        maxX = W - TABLE_X - cpu.r - 2;
    const minY = TABLE_Y + cpu.r + 2,
        maxY = TABLE_Y + TABLE_H - cpu.r - 2;

    if (
        Math.random() < CPU_MISTAKE_CHANCE &&
        cpu.mistakeTimer === 0 &&
        puck.vx > 0
    ) {
        cpu.mistakeTimer = CPU_MISTAKE_DUR;
        cpu.errorY = (Math.random() - 0.5) * CPU_ERROR_Y * 2;
    }
    if (cpu.mistakeTimer > 0) cpu.mistakeTimer--;
    if (cpu.hitCool > 0) cpu.hitCool--;

    const err = cpu.mistakeTimer > 0 ? cpu.errorY : 0;
    const puckOnMySide = puck.x > halfW;
    const puckHeadingToMe = puck.vx > 0;

    // Corner escape: if CPU is near a corner and puck isn't coming, go home immediately
    const nearTopWall = cpu.y < minY + 20;
    const nearBottomWall = cpu.y > maxY - 20;
    const nearSideWall = cpu.x > maxX - 20;
    const cornered = (nearTopWall || nearBottomWall) && nearSideWall;
    const farFromHome = Math.hypot(cpu.x - homeX, cpu.y - CY) > 150;

    let tx, ty;

    if (cornered || (farFromHome && !puckHeadingToMe)) {
        // Escape directly to home — ignore puck
        tx = homeX;
        ty = CY;
    } else if (puckOnMySide && puckHeadingToMe) {
        const frames = Math.max(
            1,
            Math.min((cpu.x - puck.x) / Math.max(0.5, puck.vx), 60)
        );
        tx = clamp(puck.x + puck.vx * frames * CPU_REACT, minX, maxX);
        ty = clamp(puck.y + puck.vy * frames * CPU_REACT + err, minY, maxY);
    } else if (puckOnMySide) {
        // Puck on my side drifting away — chase but don't go past the side wall corner
        tx = clamp(puck.x - 8, minX, maxX - 30);
        ty = clamp(puck.y + err, minY, maxY);
    } else {
        // Puck on player side — hold home, track Y loosely
        tx = homeX;
        ty = clamp(puck.y * 0.5 + CY * 0.5 + err * 0.3, minY, maxY);
    }

    const prevX = cpu.x,
        prevY = cpu.y;
    const dx = tx - cpu.x,
        dy = ty - cpu.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.1) {
        const step = Math.min(dist, CPU_SPEED * ts);
        cpu.x += (dx / dist) * step;
        cpu.y += (dy / dist) * step;
    }
    cpu.x = clamp(cpu.x, minX, maxX);
    cpu.y = clamp(cpu.y, minY, maxY);
    cpu.vx = cpu.x - prevX;
    cpu.vy = cpu.y - prevY;
}

// ── Physics ──
function updatePuck() {
    if (state !== "play") return;

    const spd = Math.hypot(puck.vx, puck.vy);
    trail.push({ x: puck.x, y: puck.y, spd });
    if (trail.length > 18) trail.shift();

    if (spd < 0.8) {
        puck.vx += (Math.random() - 0.5) * 0.18;
        puck.vy += (Math.random() - 0.5) * 0.18;
    } else if (spd < 2.5) {
        puck.vx += (Math.random() - 0.5) * 0.06;
        puck.vy += (Math.random() - 0.5) * 0.06;
    }

    puck.x += puck.vx;
    puck.y += puck.vy;
    puck.vx *= FRICTION;
    puck.vy *= FRICTION;

    const tx = TABLE_X,
        ty = TABLE_Y,
        tw = TABLE_W,
        th = TABLE_H;

    if (puck.y - puck.r < ty) {
        puck.y = ty + puck.r;
        puck.vy = Math.abs(puck.vy) * WALL_BOUNCE;
        sparkLine(puck.x - 20, ty, puck.x + 20, ty, "#00d4ff");
    }
    if (puck.y + puck.r > ty + th) {
        puck.y = ty + th - puck.r;
        puck.vy = -Math.abs(puck.vy) * WALL_BOUNCE;
        sparkLine(puck.x - 20, ty + th, puck.x + 20, ty + th, "#00d4ff");
    }
    if (puck.x - puck.r < tx) {
        if (puck.y > GOAL_Y1 && puck.y < GOAL_Y2) {
            goalScored("cpu");
            return;
        }
        puck.x = tx + puck.r;
        puck.vx = Math.abs(puck.vx) * WALL_BOUNCE;
        sparkLine(tx, puck.y - 20, tx, puck.y + 20, "#ff2d55");
    }
    if (puck.x + puck.r > tx + tw) {
        if (puck.y > GOAL_Y1 && puck.y < GOAL_Y2) {
            goalScored("p");
            return;
        }
        puck.x = tx + tw - puck.r;
        puck.vx = -Math.abs(puck.vx) * WALL_BOUNCE;
        sparkLine(tx + tw, puck.y - 20, tx + tw, puck.y + 20, "#ff2d55");
    }

    circleMalletCollide(puck, player, true);
    circleMalletCollide(puck, cpu, false);
}

function circleMalletCollide(pk, mallet, isPlayer) {
    const dx = pk.x - mallet.x,
        dy = pk.y - mallet.y;
    const dist = Math.hypot(dx, dy);
    const minDist = pk.r + mallet.r;
    if (dist >= minDist || dist < 0.01) return;

    // CPU hit cooldown — prevents corner spam loop
    if (!isPlayer && cpu.hitCool > 0) {
        const nx2 = dx / dist,
            ny2 = dy / dist;
        pk.x += nx2 * (minDist - dist);
        pk.y += ny2 * (minDist - dist);
        return;
    }

    const nx = dx / dist,
        ny = dy / dist;
    pk.x += nx * (minDist - dist);
    pk.y += ny * (minDist - dist);

    const mvx = isPlayer ? player.pvx * 1.8 : mallet.vx;
    const mvy = isPlayer ? player.pvy * 1.8 : mallet.vy;

    const relVX = pk.vx - mvx;
    const relVY = pk.vy - mvy;
    const dot = relVX * nx + relVY * ny;
    if (dot >= 0) return;

    const restitution = isPlayer ? 1.3 : 1.1;
    const impulse = -(1 + restitution) * dot;
    pk.vx += impulse * nx;
    pk.vy += impulse * ny;

    const spd = Math.hypot(pk.vx, pk.vy);
    const cap = (isPlayer ? 20 : 16) * puckSpeedMult;
    if (spd > cap) {
        pk.vx = (pk.vx / spd) * cap;
        pk.vy = (pk.vy / spd) * cap;
    }

    if (!isPlayer) cpu.hitCool = 20;

    const who = isPlayer ? "p" : "cpu";
    stats.rallyHits++;
    const mphSpd = Math.round(spd * 4);
    if (mphSpd > stats[who].topSpeed) stats[who].topSpeed = mphSpd;
    if (spd > 14) stats[who].powerHits++;
    updateStatDOM();

    if (spd > 3) {
        const col = isPlayer ? "#00d4ff" : "#ff2d55";
        burst(pk.x, pk.y, col, "#ffffff", Math.floor(spd * 1.5));
        if (spd > 19) shake(Math.min((spd - 19) * 0.4, 3));
    }
}

function updatePlayer(ts = 1) {
    const dx = rawMouseX - prevRawX;
    const dy = rawMouseY - prevRawY;
    mouseVX = mouseVX * 0.4 + dx * 0.6;
    mouseVY = mouseVY * 0.4 + dy * 0.6;
    prevRawX = rawMouseX;
    prevRawY = rawMouseY;

    if (ts === 1) {
        // Normal: snap directly to mouse
        player.x = rawMouseX;
        player.y = rawMouseY;
    } else {
        // Slo-mo: lerp toward mouse so mallet also moves in slow motion
        player.x += (rawMouseX - player.x) * ts * 3;
        player.y += (rawMouseY - player.y) * ts * 3;
        player.x = clamp(player.x, TABLE_X + MALLET_R + 2, CX - 10);
        player.y = clamp(
            player.y,
            TABLE_Y + MALLET_R + 2,
            TABLE_Y + TABLE_H - MALLET_R - 2
        );
    }

    // Scale velocity by timeScale so hits feel right in slo-mo
    player.pvx = mouseVX * ts;
    player.pvy = mouseVY * ts;
}

// ══════════════════════════════════════
//  RENDERING
// ══════════════════════════════════════

function grd(x, y, r0, r1, c0, c1) {
    const g = G.createRadialGradient(x, y, r0, x, y, r1);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    return g;
}
function lgrad(x0, y0, x1, y1, stops) {
    const g = G.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([t, c]) => g.addColorStop(t, c));
    return g;
}

function drawTable() {
    const tx = TABLE_X,
        ty = TABLE_Y,
        tw = TABLE_W,
        th = TABLE_H;

    // outer glow
    G.save();
    G.shadowColor = "rgba(0,180,255,0.2)";
    G.shadowBlur = 28;
    G.strokeStyle = "rgba(0,180,255,0.25)";
    G.lineWidth = 3;
    G.beginPath();
    G.roundRect(tx - 4, ty - 4, tw + 8, th + 8, 14);
    G.stroke();
    G.restore();

    // table surface
    G.fillStyle = lgrad(tx, ty, tx, ty + th, [
        [0, "#0a1a2e"],
        [0.5, "#071422"],
        [1, "#0a1a2e"]
    ]);
    G.beginPath();
    G.roundRect(tx, ty, tw, th, 10);
    G.fill();

    // air holes
    G.save();
    G.globalAlpha = 0.055;
    G.fillStyle = "#4af";
    for (let gx = tx + 18; gx < tx + tw - 10; gx += 18)
        for (let gy = ty + 18; gy < ty + th - 10; gy += 18) {
            G.beginPath();
            G.arc(gx, gy, 1.8, 0, Math.PI * 2);
            G.fill();
        }
    G.restore();

    // center circle
    G.save();
    G.strokeStyle = "rgba(0,212,255,0.16)";
    G.lineWidth = 2;
    G.setLineDash([6, 6]);
    G.beginPath();
    G.arc(CX, CY, 60, 0, Math.PI * 2);
    G.stroke();
    G.setLineDash([]);
    G.restore();

    // center line
    G.save();
    G.strokeStyle = "rgba(0,212,255,0.12)";
    G.lineWidth = 2;
    G.setLineDash([8, 8]);
    G.beginPath();
    G.moveTo(CX, ty + 2);
    G.lineTo(CX, ty + th - 2);
    G.stroke();
    G.setLineDash([]);
    G.restore();

    // center dot
    G.save();
    G.shadowColor = "rgba(0,212,255,0.5)";
    G.shadowBlur = 8;
    G.fillStyle = "rgba(0,212,255,0.4)";
    G.beginPath();
    G.arc(CX, CY, 5, 0, Math.PI * 2);
    G.fill();
    G.restore();

    // rails
    const rt = lgrad(0, ty, 0, ty + 12, [
        [0, "#1a4a6e"],
        [0.6, "#0e2a40"],
        [1, "#0a1a2e"]
    ]);
    G.fillStyle = rt;
    G.fillRect(tx, ty, tw, 8);
    const rb = lgrad(0, ty + th - 8, 0, ty + th, [
        [0, "#0a1a2e"],
        [0.4, "#0e2a40"],
        [1, "#1a4a6e"]
    ]);
    G.fillStyle = rb;
    G.fillRect(tx, ty + th - 8, tw, 8);

    // rail glow lines
    G.save();
    G.shadowColor = "#00d4ff";
    G.shadowBlur = 10;
    G.strokeStyle = "rgba(0,212,255,0.7)";
    G.lineWidth = 2;
    G.beginPath();
    G.moveTo(tx + 2, ty + 2);
    G.lineTo(tx + tw - 2, ty + 2);
    G.stroke();
    G.beginPath();
    G.moveTo(tx + 2, ty + th - 2);
    G.lineTo(tx + tw - 2, ty + th - 2);
    G.stroke();
    G.restore();

    // left goal
    G.save();
    G.shadowColor = "#00d4ff";
    G.shadowBlur = 14;
    G.strokeStyle = "rgba(0,212,255,0.7)";
    G.lineWidth = 2.5;
    G.beginPath();
    G.moveTo(tx, GOAL_Y1);
    G.lineTo(tx - GOAL_DEPTH, GOAL_Y1);
    G.stroke();
    G.beginPath();
    G.moveTo(tx, GOAL_Y2);
    G.lineTo(tx - GOAL_DEPTH, GOAL_Y2);
    G.stroke();
    G.strokeStyle = "rgba(0,212,255,0.3)";
    G.lineWidth = 1.5;
    G.beginPath();
    G.moveTo(tx - GOAL_DEPTH, GOAL_Y1);
    G.lineTo(tx - GOAL_DEPTH, GOAL_Y2);
    G.stroke();
    G.restore();

    // right goal
    G.save();
    G.shadowColor = "#ff2d55";
    G.shadowBlur = 14;
    G.strokeStyle = "rgba(255,45,85,0.7)";
    G.lineWidth = 2.5;
    G.beginPath();
    G.moveTo(tx + tw, GOAL_Y1);
    G.lineTo(tx + tw + GOAL_DEPTH, GOAL_Y1);
    G.stroke();
    G.beginPath();
    G.moveTo(tx + tw, GOAL_Y2);
    G.lineTo(tx + tw + GOAL_DEPTH, GOAL_Y2);
    G.stroke();
    G.strokeStyle = "rgba(255,45,85,0.3)";
    G.lineWidth = 1.5;
    G.beginPath();
    G.moveTo(tx + tw + GOAL_DEPTH, GOAL_Y1);
    G.lineTo(tx + tw + GOAL_DEPTH, GOAL_Y2);
    G.stroke();
    G.restore();

    // goal posts
    [GOAL_Y1, GOAL_Y2].forEach((gy) => {
        G.save();
        G.shadowColor = "#00d4ff";
        G.shadowBlur = 12;
        G.fillStyle = "#00d4ff";
        G.beginPath();
        G.arc(tx, gy, 5, 0, Math.PI * 2);
        G.fill();
        G.restore();
        G.save();
        G.shadowColor = "#ff2d55";
        G.shadowBlur = 12;
        G.fillStyle = "#ff2d55";
        G.beginPath();
        G.arc(tx + tw, gy, 5, 0, Math.PI * 2);
        G.fill();
        G.restore();
    });
}

function drawPuck() {
    trail.forEach((t, i) => {
        const prog = i / trail.length;
        const r = prog * 9 * Math.min(t.spd / 6, 1);
        if (r < 0.5) return;
        G.save();
        G.globalAlpha = prog * 0.55 * Math.min(t.spd / 5, 1);
        G.fillStyle = grd(t.x, t.y, 0, r * 2, "rgba(0,212,255,0.9)", "transparent");
        G.beginPath();
        G.arc(t.x, t.y, r * 2.2, 0, Math.PI * 2);
        G.fill();
        G.restore();
    });

    const bx = puck.x,
        by = puck.y,
        br = puck.r;
    const spd = Math.hypot(puck.vx, puck.vy);

    G.save();
    G.shadowColor = "#00d4ff";
    G.shadowBlur = 24 + spd * 1.5;
    G.fillStyle = grd(bx, by, 0, br + 8, "rgba(0,212,255,0.18)", "transparent");
    G.beginPath();
    G.arc(bx, by, br + 14, 0, Math.PI * 2);
    G.fill();
    G.restore();

    G.fillStyle = grd(
        bx - br * 0.3,
        by - br * 0.3,
        br * 0.1,
        br,
        "#ffffff",
        "#cccccc"
    );

    G.beginPath();
    G.arc(bx, by, br, 0, Math.PI * 2);
    G.fill();

    G.save();
    G.shadowColor = "#00d4ff";
    G.shadowBlur = 8;
    G.strokeStyle = "#00d4ff";
    G.lineWidth = 2.5;
    G.beginPath();
    G.arc(bx, by, br - 1, 0, Math.PI * 2);
    G.stroke();
    G.restore();

    G.strokeStyle = "rgba(0,212,255,0.32)";
    G.lineWidth = 1;
    G.beginPath();
    G.arc(bx, by, br * 0.55, 0, Math.PI * 2);
    G.stroke();

    G.fillStyle = "rgba(255,255,255,0.17)";
    G.beginPath();
    G.ellipse(
        bx - br * 0.28,
        by - br * 0.3,
        br * 0.38,
        br * 0.22,
        -0.4,
        0,
        Math.PI * 2
    );
    G.fill();
}

function drawMallet(m, col, glowCol) {
    const mx = m.x,
        my = m.y,
        mr = m.r;

    // outer neon glow halo
    G.save();
    G.shadowColor = glowCol;
    G.shadowBlur = 32;
    const halo = G.createRadialGradient(mx, my, mr * 0.6, mx, my, mr + 18);
    halo.addColorStop(0, "transparent");
    halo.addColorStop(0.6, `${glowCol}22`);
    halo.addColorStop(1, "transparent");
    G.fillStyle = halo;
    G.beginPath();
    G.arc(mx, my, mr + 18, 0, Math.PI * 2);
    G.fill();
    G.restore();

    // base shadow — makes it look raised off the table
    G.save();
    G.globalAlpha = 0.45;
    G.fillStyle = "rgba(0,0,0,0.7)";
    G.beginPath();
    G.ellipse(mx + 3, my + 4, mr, mr * 0.85, 0, 0, Math.PI * 2);
    G.fill();
    G.restore();

    // outer plastic skirt — slightly darker, full radius
    const skirtG = G.createRadialGradient(
        mx - mr * 0.2,
        my - mr * 0.2,
        mr * 0.1,
        mx,
        my,
        mr
    );
    skirtG.addColorStop(0, lighten(col, 0.12));
    skirtG.addColorStop(0.65, col);
    skirtG.addColorStop(1, darken(col, 0.45));
    G.fillStyle = skirtG;
    G.beginPath();
    G.arc(mx, my, mr, 0, Math.PI * 2);
    G.fill();

    // neon glowing outer rim ring
    G.save();
    G.shadowColor = glowCol;
    G.shadowBlur = 12;
    G.strokeStyle = glowCol;
    G.lineWidth = 2.5;
    G.beginPath();
    G.arc(mx, my, mr - 1.5, 0, Math.PI * 2);
    G.stroke();
    G.restore();

    // recessed groove ring — the "dip" you see on real strikers
    const grooveR = mr * 0.72;
    G.strokeStyle = `rgba(0,0,0,0.55)`;
    G.lineWidth = 3;
    G.beginPath();
    G.arc(mx, my, grooveR, 0, Math.PI * 2);
    G.stroke();
    G.strokeStyle = `rgba(255,255,255,0.08)`;
    G.lineWidth = 1;
    G.beginPath();
    G.arc(mx, my, grooveR + 1.5, 0, Math.PI * 2);
    G.stroke();

    // raised dome center — lighter in middle, darker at edge of dome
    const domeR = mr * 0.62;
    const domeG = G.createRadialGradient(
        mx - domeR * 0.3,
        my - domeR * 0.35,
        0,
        mx,
        my,
        domeR
    );
    domeG.addColorStop(0, lighten(col, 0.35));
    domeG.addColorStop(0.5, lighten(col, 0.1));
    domeG.addColorStop(1, darken(col, 0.2));
    G.fillStyle = domeG;
    G.beginPath();
    G.arc(mx, my, domeR, 0, Math.PI * 2);
    G.fill();

    // glowing center dot
    G.save();
    G.shadowColor = glowCol;
    G.shadowBlur = 14;
    G.fillStyle = glowCol;
    G.beginPath();
    G.arc(mx, my, 4.5, 0, Math.PI * 2);
    G.fill();
    G.restore();

    // top-left specular highlight — sells the dome shape
    G.fillStyle = "rgba(255,255,255,0.28)";
    G.beginPath();
    G.ellipse(
        mx - domeR * 0.3,
        my - domeR * 0.32,
        domeR * 0.32,
        domeR * 0.18,
        -0.5,
        0,
        Math.PI * 2
    );
    G.fill();

    // secondary smaller highlight
    G.fillStyle = "rgba(255,255,255,0.12)";
    G.beginPath();
    G.ellipse(
        mx - domeR * 0.15,
        my - domeR * 0.5,
        domeR * 0.14,
        domeR * 0.08,
        -0.3,
        0,
        Math.PI * 2
    );
    G.fill();
}

function darken(hex, amt) {
    const r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, (r - amt * 255) | 0)},${Math.max(
        0,
        (g - amt * 255) | 0
    )},${Math.max(0, (b - amt * 255) | 0)})`;
}

function drawParticles() {
    particles.forEach((p) => {
        G.save();
        G.globalAlpha = Math.pow(p.life, 1.4) * 0.9;
        if (p.glow) {
            G.shadowColor = p.col;
            G.shadowBlur = 10;
        }
        G.fillStyle = p.col;
        G.beginPath();
        G.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        G.fill();
        G.restore();
    });
}
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.96;
        p.life -= 0.028;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawGoalFlash() {
    if (goalFlash <= 0 || state !== "goal") return;
    const prog = goalFlash / 160,
        isP = goalWho === "p";
    G.save();
    G.globalAlpha = Math.min(prog * 3, 0.16);
    G.fillStyle = isP ? "#00d4ff" : "#ff2d55";
    G.fillRect(0, 0, W, H);
    G.restore();

    goalMsgScale = Math.min(goalMsgScale + 0.12, 1);
    const ease = 1 - Math.pow(1 - goalMsgScale, 3);
    G.save();
    G.globalAlpha = Math.min(1, prog * 3) * Math.min(1, goalFlash / 40);
    G.translate(W / 2, H / 2);
    G.scale(ease, ease);
    G.textAlign = "center";
    G.font = '900 64px "Orbitron"';
    G.fillStyle = isP ? "#00d4ff" : "#ff2d55";
    G.shadowColor = isP ? "#00d4ff" : "#ff2d55";
    G.shadowBlur = 40;
    G.fillText("GOAL!", 0, -10);
    G.shadowBlur = 0;
    G.font = '500 13px "Rajdhani"';
    G.letterSpacing = "6px";
    G.fillStyle = isP ? "rgba(0,212,255,0.75)" : "rgba(255,45,85,0.75)";
    G.fillText(isP ? "YOU SCORE" : "CPU SCORES", 0, 22);
    G.restore();
    goalFlash--;
}

function updatePuckScaled(ts) {
    if (ts !== 1) {
        puck.vx *= ts;
        puck.vy *= ts;
    }
    updatePuck();
    if (ts !== 1 && state === "play") {
        puck.vx /= ts;
        puck.vy /= ts;
    }
}

// ── Utils ──
function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}
function lighten(hex, amt) {
    const r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${clamp((r + amt * 255) | 0, 0, 255)},${clamp(
        (g + amt * 255) | 0,
        0,
        255
    )},${clamp((b + amt * 255) | 0, 0, 255)})`;
}

// ── Main Loop ──
function drawSadFace() {
    const cx = W / 2,
        cy = H / 2 - 30;
    const r = 52;
    const pulse = 0.85 + Math.sin(tick * 0.05) * 0.15;
    G.save();
    G.globalAlpha = 0.82 * pulse;

    // Face circle
    G.fillStyle = "#1a0a0a";
    G.beginPath();
    G.arc(cx, cy, r, 0, Math.PI * 2);
    G.fill();
    G.strokeStyle = "#ff2d55";
    G.lineWidth = 3;
    G.shadowColor = "#ff2d55";
    G.shadowBlur = 18;
    G.beginPath();
    G.arc(cx, cy, r, 0, Math.PI * 2);
    G.stroke();
    G.shadowBlur = 0;

    // Eyes (X marks)
    G.strokeStyle = "#ff2d55";
    G.lineWidth = 3.5;
    G.lineCap = "round";
    [
        [-18, -12],
        [18, -12]
    ].forEach(([ex, ey]) => {
        G.beginPath();
        G.moveTo(cx + ex - 7, cy + ey - 7);
        G.lineTo(cx + ex + 7, cy + ey + 7);
        G.stroke();
        G.beginPath();
        G.moveTo(cx + ex + 7, cy + ey - 7);
        G.lineTo(cx + ex - 7, cy + ey + 7);
        G.stroke();
    });

    // Sad mouth
    G.strokeStyle = "#ff2d55";
    G.lineWidth = 3.5;
    G.beginPath();
    G.arc(cx, cy + 28, 20, Math.PI * 0.15, Math.PI * 0.85, false);
    G.stroke();

    G.restore();
}

function loop() {
    tick++;
    G.clearRect(0, 0, W, H);
    G.fillStyle = "#04060a";
    G.fillRect(0, 0, W, H);

    // Slo-mo: fade vignette in/out
    if (sloMo) sloMoAlpha = Math.min(sloMoAlpha + 0.055, 1);
    else sloMoAlpha = Math.max(sloMoAlpha - 0.07, 0);
    if (sloMoIntro > 0) sloMoIntro--;
    if (sloMoLabelTimer > 0) sloMoLabelTimer--;

    const timeScale = sloMo ? 0.55 : 1;

    if (shakeAmt > 0.3) {
        shakeX = (Math.random() - 0.5) * shakeAmt * 2;
        shakeY = (Math.random() - 0.5) * shakeAmt * 2;
        shakeAmt *= 0.72;
    } else {
        shakeX = 0;
        shakeY = 0;
        shakeAmt = 0;
    }

    G.save();
    G.translate(shakeX, shakeY);

    drawTable();

    if (state === "play" || state === "goal") {
        // Run physics sub-steps scaled by timeScale
        const steps = sloMo ? 1 : 1;
        for (let s = 0; s < steps; s++) {
            updatePlayer(timeScale);
            updateCPU(timeScale);
            updatePuckScaled(timeScale);
            updateParticles();
        }
    }
    updateConfetti();

    drawParticles();
    drawPuck();
    drawMallet(cpu, "#2a0a0a", "#ff2d55");
    drawMallet(player, "#0a1a2a", "#00d4ff");
    drawGoalFlash();
    drawSpeedUpMsg();
    drawConfetti();
    if (showSadFace) drawSadFace();

    // ── Slo-mo cinematic overlay ──
    if (sloMoAlpha > 0) {
        // Vignette
        const vig = G.createRadialGradient(
            W / 2,
            H / 2,
            H * 0.15,
            W / 2,
            H / 2,
            H * 0.75
        );
        vig.addColorStop(0, "transparent");
        vig.addColorStop(1, `rgba(0,0,0,${0.65 * sloMoAlpha})`);
        G.fillStyle = vig;
        G.fillRect(0, 0, W, H);

        // Letterbox bars
        const barH = 32 * sloMoAlpha;
        G.fillStyle = `rgba(0,0,0,${0.88 * sloMoAlpha})`;
        G.fillRect(0, 0, W, barH);
        G.fillRect(0, H - barH, W, barH);

        // Chromatic edges
        G.save();
        G.globalAlpha = 0.15 * sloMoAlpha;
        G.fillStyle = "#ff0040";
        G.fillRect(0, 0, 5, H);
        G.fillRect(W - 5, 0, 5, H);
        G.fillStyle = "#0080ff";
        G.fillRect(5, 0, 5, H);
        G.fillRect(W - 10, 0, 5, H);
        G.restore();

        // GAME POINT — only show while label timer is active, pinned to top bar
        if (sloMoLabelTimer > 0) {
            const fadeIn = Math.min(sloMoLabelTimer / 20, 1);
            const fadeOut = sloMoLabelTimer < 30 ? sloMoLabelTimer / 30 : 1;
            const alpha = fadeIn * fadeOut * sloMoAlpha;
            const pulse = 0.88 + Math.sin(tick * 0.12) * 0.12;

            G.save();
            G.globalAlpha = alpha * pulse;
            G.textAlign = "center";
            G.font = '900 16px "Orbitron"';
            G.fillStyle = "rgba(0,0,0,0.5)";
            G.fillText("⚡  GAME POINT  ⚡", W / 2 + 1, barH * 0.72 + 1);
            G.fillStyle = "#ffc940";
            G.shadowColor = "#ffc940";
            G.shadowBlur = 14;
            G.fillText("⚡  GAME POINT  ⚡", W / 2, barH * 0.72);
            G.shadowBlur = 0;
            G.restore();
        }
    }

    G.restore();
    requestAnimationFrame(loop);
}

function drawSpeedUpMsg() {
    if (speedUpTimer <= 0) return;
    const t = speedUpTimer / 130;
    // Slam in fast, hold, then fade
    const scale = t > 0.85 ? 0.5 + (1 - (t - 0.85) / 0.15) * 0.5 : 1;
    const alpha = t < 0.2 ? t / 0.2 : 1;
    G.save();
    G.globalAlpha = alpha;
    G.translate(W / 2, H / 2 - 60);
    G.scale(scale, scale);
    G.textAlign = "center";
    // Chunky outline
    G.font = '900 34px "Orbitron"';
    G.fillStyle = "#000";
    G.fillText(speedUpMsg, 2, 2);
    // Gradient fill — gold to orange
    const grd = G.createLinearGradient(-100, -30, 100, 10);
    grd.addColorStop(0, "#ffc940");
    grd.addColorStop(1, "#ff6820");
    G.fillStyle = grd;
    G.shadowColor = "#ffc940";
    G.shadowBlur = 24;
    G.fillText(speedUpMsg, 0, 0);
    G.restore();
    speedUpTimer--;
}

loop();
startGame();