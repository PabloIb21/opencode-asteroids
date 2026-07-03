'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3, special = false) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.special = special;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const baseSpeed = SPEEDS[size] + rand(-15, 15);
    const speed = special ? baseSpeed * 3.2 + rand(-20, 20) : baseSpeed;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    if (special) {
      this.ttl   = rand(4, 7);
      this.life  = this.ttl;
      this.points = POINTS[size] * 3;
    } else {
      this.ttl   = Infinity;
      this.life  = 0;
      this.points = POINTS[size];
    }

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    if (this.special) {
      this.ttl -= dt;
      if (this.ttl <= 0) this.dead = true;
    }
  }

  split() {
    if (this.special) return [];          // la estrella fugaz no se divide
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    // Estela de la estrella fugaz
    if (this.special) {
      const trail = 3;
      for (let i = trail; i > 0; i--) {
        ctx.save();
        ctx.translate(
          wrap(this.x - this.vx * 0.012 * i, W),
          wrap(this.y - this.vy * 0.012 * i, H)
        );
        ctx.rotate(this.rot);
        ctx.globalAlpha = 0.12 * i;
        ctx.strokeStyle = '#ffae42';
        ctx.lineWidth   = 1;
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(this.verts[0][0], this.verts[0][1]);
        for (let k = 1; k < this.verts.length; k++)
          ctx.lineTo(this.verts[k][0], this.verts[k][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    // Pulso de opacidad al final de la vida de la estrella fugaz
    let alpha = 1;
    if (this.special && this.ttl < 1.5)
      alpha = 0.5 + 0.5 * Math.abs(Math.sin(this.ttl * 14));

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.special ? '#ffd34d' : '#fff';
    ctx.lineWidth   = this.special ? 2.5 : 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
// Cada skin: { id, name, shipColor, flameColor, verts (nariz hacia +X), nose }
const SKINS = [
  {
    id: 'classic',
    name: 'CLÁSICA',
    shipColor: '#fff',
    flameColor: 'rgba(255, 130, 0, 0.85)',
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    nose: 21,
  },
  {
    id: 'crimson',
    name: 'CARMESÍ',
    shipColor: '#ff3b30',
    flameColor: 'rgba(255, 200, 0, 0.9)',
    // más afilada
    verts: [[22, 0], [-13, -7], [-8, 0], [-13, 7]],
    nose: 23,
  },
  {
    id: 'gold',
    name: 'DORADA',
    shipColor: '#ffd34d',
    flameColor: 'rgba(255, 220, 100, 0.9)',
    // robusta
    verts: [[18, 0], [-11, -11], [-6, 0], [-11, 11]],
    nose: 19,
  },
  {
    id: 'neon',
    name: 'NEÓN',
    shipColor: '#00dcff',
    flameColor: 'rgba(255, 0, 200, 0.9)',
    // angular futurista
    verts: [[22, 0], [-6, -10], [-12, -5], [-10, 0], [-12, 5], [-6, 10]],
    nose: 23,
  },
  {
    id: 'alien',
    name: 'ALIEN',
    shipColor: '#7CFC00',
    flameColor: 'rgba(150, 255, 100, 0.9)',
    // orgánica, curva simulada con más vértices
    verts: [[20, 0], [8, -6], [-4, -11], [-12, -6], [-8, 0], [-12, 6], [-4, 11], [8, 6]],
    nose: 21,
  },
];

const SKIN_KEY = 'asteroids.skin';
let currentSkin = 0;
let skinToast = 0;   // tiempo de vida del toast al cambiar de skin

function loadSkin() {
  const stored = localStorage.getItem(SKIN_KEY);
  if (stored === null) return 0;
  const idx = SKINS.findIndex(s => s.id === stored);
  return idx >= 0 ? idx : 0;
}
function saveSkin() {
  try { localStorage.setItem(SKIN_KEY, SKINS[currentSkin].id); } catch (e) {}
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  boost  = 0;
  triple = 0;
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
    this.shield        = 0;
    this.shieldFlash   = 0;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.boost         > 0) this.boost         -= dt;
if (this.triple        > 0) this.triple        -= dt;
    if (this.shield        > 0) this.shield        -= dt;
    if (this.shieldFlash   > 0) this.shieldFlash   -= dt;

    const ROT   = 3.5;   // rad/s
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const THRUST_BOOST = this.boost > 0 ? 520 : 260;
      this.vx += Math.cos(this.angle) * THRUST_BOOST * dt;
      this.vy += Math.sin(this.angle) * THRUST_BOOST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = SKINS[currentSkin].nose;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.triple > 0) {
      const px = Math.cos(this.angle + Math.PI / 2) * 6;
      const py = Math.sin(this.angle + Math.PI / 2) * 6;
      return [
        new Bullet(ox,        oy,        this.angle),
        new Bullet(ox + px,   oy + py,   this.angle),
        new Bullet(ox - px,   oy - py,   this.angle),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[currentSkin];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.shipColor;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta: polígono de la skin actual (nariz hacia +X)
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flameColor;
      ctx.stroke();
    }

    ctx.restore();

    // Escudo: anillo envolvente alrededor de la nave
    if (this.shield > 0) {
      const r = this.radius + 8 + Math.sin(performance.now() / 120) * 1.5;
      const flash = this.shieldFlash > 0 ? 1 : 0;
      ctx.save();
      ctx.globalAlpha = 0.5 + (this.shieldFlash > 0 ? 0.5 : 0);
      ctx.strokeStyle = flash > 0 ? '#fff' : '#9d7bff';
      ctx.lineWidth   = 2 + flash * 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp (Velocidad) ───────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'boost') {
    this.type = type;
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(25, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius    = 11;
    this.rot       = 0;
    this.rotSpeed  = rand(-1.5, 1.5);
    this.dead      = false;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  draw() {
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

switch (this.type) {
      case 'boost': {
        // Diamante cyan pulsante con rayo
        ctx.strokeStyle = '#00dcff';
        ctx.lineWidth   = 2;
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * pulse);
        ctx.lineTo(this.radius * pulse, 0);
        ctx.lineTo(0, this.radius * pulse);
        ctx.lineTo(-this.radius * pulse, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(0, 0);
        ctx.lineTo(-2, 0);
        ctx.lineTo(4, 8);
        ctx.stroke();
        break;
      }
      case 'triple': {
        // Diamante magenta pulsante con tres líneas paralelas
        ctx.strokeStyle = '#ff5ed4';
        ctx.lineWidth   = 2;
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * pulse);
        ctx.lineTo(this.radius * pulse, 0);
        ctx.lineTo(0, this.radius * pulse);
        ctx.lineTo(-this.radius * pulse, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 1.5;
        for (const off of [-4, 0, 4]) {
          ctx.beginPath();
          ctx.moveTo(-5, off);
          ctx.lineTo( 5, off);
          ctx.stroke();
        }
        break;
      }
      case 'shield': {
        // Anillo violeta con símbolo de escudo interior
        ctx.strokeStyle = '#9d7bff';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 1.5;
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(6, -3);
        ctx.lineTo(6,  3);
        ctx.lineTo(0,  7);
        ctx.lineTo(-6, 3);
        ctx.lineTo(-6, -3);
        ctx.closePath();
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let meteorTimer;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  meteorTimer = rand(8, 14);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  meteorTimer = rand(8, 14);
  spawnAsteroids(3 + level);
}

function spawnMeteor() {
  const edge = randInt(0, 3);
  let x, y;
  switch (edge) {
    case 0: x = rand(0, W); y = -20; break;
    case 1: x = W + 20;      y = rand(0, H); break;
    case 2: x = rand(0, W); y = H + 20; break;
    default: x = -20;        y = rand(0, H);
  }
  const targetX = rand(W * 0.25, W * 0.75);
  const targetY = rand(H * 0.25, H * 0.75);
  const a = Math.atan2(targetY - y, targetX - x);
  const m = new Asteroid(x, y, 3, true);
  const sp = Math.hypot(m.vx, m.vy);
  m.vx = Math.cos(a) * sp;
  m.vy = Math.sin(a) * sp;
  asteroids.push(m);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

// Cambiar de skin (tecla C)
  if (pressed('KeyC')) {
    currentSkin = (currentSkin + 1) % SKINS.length;
    saveSkin();
    skinToast = 1.6;
  }
  if (skinToast > 0) skinToast -= dt;

  const prevBoost  = ship.boost;
  const prevTriple = ship.triple;
  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Spawn de estrella fugaz
  meteorTimer -= dt;
  if (meteorTimer <= 0) {
    spawnMeteor();
    meteorTimer = rand(10, 18);
  }

  if (prevBoost  > 0 && ship.boost  <= 0)
    explode(ship.x, ship.y, 8);
  if (prevTriple > 0 && ship.triple <= 0)
    explode(ship.x, ship.y, 8);

// Nave vs power-up (boost, triple y shield apilables e independientes)
  for (const p of powerups) {
    if (p.dead || dist(ship, p) >= ship.radius + p.radius) continue;
    if (p.type === 'triple') {
      if (ship.triple > 0) continue;       // no re-apilar el mismo
      ship.triple = 5;
    } else if (p.type === 'shield') {
      if (ship.shield > 0) continue;
      ship.shield = 5;
    } else {
      if (ship.boost > 0) continue;
      ship.boost = 5;
    }
    p.dead = true;
    explode(ship.x, ship.y, 12);
    break;
  }
  powerups = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points ?? POINTS[a.size];
        explode(a.x, a.y, a.special ? 18 : a.size * 5);
        newAsteroids.push(...a.split());
if (powerups.length === 0 && Math.random() < 0.12) {
          const kind = ['boost', 'triple', 'shield'][Math.floor(Math.random() * 3)];
          powerups.push(new PowerUp(a.x, a.y, kind));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shield > 0) {
          a.dead = true;
          explode(a.x, a.y, a.size * 5);
          ship.shieldFlash = 0.15;
        } else {
          killShip();
        }
        break;
      }
    }
    asteroids = asteroids.filter(a => !a.dead);
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkin];
  // Factor de escala: ajusta el polígono al tamaño del icono (basado en el vértice más ancho)
  let maxR = 0;
  for (const v of skin.verts) {
    const r = Math.hypot(v[0], v[1]);
    if (r > maxR) maxR = r;
  }
  const scale = maxR > 0 ? 8 / maxR : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.shipColor;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * scale, skin.verts[0][1] * scale);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * scale, skin.verts[i][1] * scale);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  // Barra de Velocidad
  if (ship.boost > 0) {
    const BAR_W = 100, BAR_H = 6;
    const bx = W / 2 - BAR_W / 2, by = 38;
    const fill = (ship.boost / 5) * BAR_W;
    ctx.fillStyle   = '#00dcff';
    ctx.fillRect(bx, by, fill, BAR_H);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(bx - 0.5, by - 0.5, BAR_W + 1, BAR_H + 1);
  }

// Barra de Triple Shot
  if (ship.triple > 0) {
    const BAR_W = 100, BAR_H = 6;
    const bx = W / 2 - BAR_W / 2, by = 48;
    const fill = (ship.triple / 5) * BAR_W;
    ctx.fillStyle   = '#ff5ed4';
    ctx.fillRect(bx, by, fill, BAR_H);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(bx - 0.5, by - 0.5, BAR_W + 1, BAR_H + 1);
  }

  // Barra de Escudo
  if (ship.shield > 0) {
    const BAR_W = 100, BAR_H = 6;
    const bx = W / 2 - BAR_W / 2, by = 60;
    const fill = (ship.shield / 5) * BAR_W;
    ctx.fillStyle   = '#9d7bff';
    ctx.fillRect(bx, by, fill, BAR_H);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(bx - 0.5, by - 0.5, BAR_W + 1, BAR_H + 1);
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicador de skin actual (abajo-izquierda)
  ctx.textAlign = 'left';
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`SKIN: ${SKINS[currentSkin].name}  (C para cambiar)`, 14, H - 14);

  // Toast al cambiar de skin
  if (skinToast > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px monospace';
    ctx.globalAlpha = Math.min(1, skinToast / 0.4);
    ctx.fillStyle = SKINS[currentSkin].shipColor;
    ctx.fillText(SKINS[currentSkin].name, W / 2, H / 2 - 40);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

currentSkin = loadSkin();
initGame();
requestAnimationFrame(loop);
