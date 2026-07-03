# AGENTS.md

Single-file HTML5 Canvas game (no framework, no bundler, no dependencies, no tests). The entire game lives in `game.js`; `index.html` just loads it into a fixed 800x600 canvas.

## Running

Open `index.html` directly in a browser, or `npx serve .` then `http://localhost:3000`. There is no build step, no `npm install`, no package.json.

## Architecture

`game.js` is one `'use strict'` global-scope script containing all classes and the loop. Order matters top-to-bottom: `Bullet`, `Asteroid`, `Ship`, `Particle`, then free functions (`spawnAsteroids`, `initGame`, `nextLevel`, `explode`, `killShip`, `update`, `draw*`) and finally `requestAnimationFrame(loop)` at EOF boots the game.

- **Rendering**: 2D `ctx` from the canvas in `index.html`; canvas size `W=800`/`H=600` are hardcoded constants — changing them requires editing both `index.html` and `game.js`.
- **Movement**: toroidal space via `wrap(v, max)`; all entities wrap at screen edges.
- **Input**: tracked in `keys` (held) and `justPressed` (consumed once via `pressed(code)`). Arrow keys / Space call `e.preventDefault()`.
- **Loop**: fixed `dt`-based updates in `update(dt)`, draws in `draw()`; HUD/overlay drawn after entities.

## Conventions

- Canvas/world coordinates are hardcoded pixels; there is no resize, DPR scaling, or asset loading.
- No module system — do not add `import`/`export`; everything shares one global scope.
- No tests, linter, formatter, or typecheck configured. Verify changes by reloading `index.html` in a browser.
- README and comments are in Spanish; keep that style for user-facing text.