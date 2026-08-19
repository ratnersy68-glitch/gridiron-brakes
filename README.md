# Gridiron Brakes: Shootout

A fast-paced 3D hockey shootout game — one-on-one battles between a shooter and an AI goalie. Built with Three.js, vanilla JavaScript, and no build step.

## Running it

The game is a static site that uses ES module imports, so it must be served over HTTP (not opened directly as a `file://` URL). From the project root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser.

## Controls

- **Mouse / touch**: aim at the net
- **Click and hold (or touch and hold)**: charge your shot power, release to fire
- **Drag while charging**: deke left/right
- **1 / 2 / 3 / 4** or the on-screen buttons: wrist / slap / snap / backhand shot
- **Space** (or the on-screen SPIN/MICHIGAN button): trigger a spin move or Michigan attempt depending on how hard you're deking
- **Gamepad**: left stick to aim, right trigger to charge/release, face buttons for shot type, left bumper for special moves

## Project layout

- `index.html`, `style.css` — app shell and all UI screens
- `src/data/` — tuning tables (difficulty, goalie personalities, arenas, cosmetics, shot types, modes, challenges)
- `src/core/` — save data, procedural WebAudio SFX, unified input handling
- `src/render/` — Three.js rink/player construction and visual effects
- `src/game/` — shot physics, goalie AI, and the attempt/mode state machines
- `src/ui/` — DOM-driven menu, HUD, locker room, leaderboard, and settings screens
- `vendor/three.module.js` — vendored Three.js build (no CDN dependency)

Progress (XP, coins, unlocks, and stats) is saved to `localStorage` on the device.
