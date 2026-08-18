# PRISM RUSH

An original 2D rhythm platformer — auto-runner reflex gameplay, neon arcade
visuals, procedurally-scored original chiptune music, 50 hand-designed +
procedurally-composed levels, a progression/cosmetics economy, achievements,
statistics, a practice mode, and a level editor. No external assets: every
sprite is drawn on `<canvas>` and every sound is synthesized live with the
WebAudio API, so nothing here is copied from any existing game.

## Run it

```
npm start
```

Then open `http://localhost:8080`. No build step, no dependencies —
plain ES modules served statically.

## Controls

- **Space / Click / Tap** — jump, fly, or flip depending on your current form
- **Esc** — pause

## Architecture

```
src/
  core/        Game.js (state machine + main loop), SaveSystem, InputManager, Utils (RNG/EventBus)
  audio/       AudioEngine — procedural WebAudio music + SFX, beat events
  render/      Renderer (parallax/glow/shake), LevelRenderer, ParticleSystem
  player/      Player.js — 5 movement forms (Runner/Glider/Orb/Pulse/Booster) + gravity flip
  level/       Objects.js (obstacle factories), CollisionSystem, LevelRuntime (per-attempt sim)
  levels/      patterns.js (15 gameplay-style pattern chunks), generator.js, levelList.js (50 levels),
               authored.js (hand-built tutorial levels 1-5), daily.js (Daily Challenge)
  progression/ Progression (XP/currency), Cosmetics (shop catalog)
  achievements/Achievements.js — 32 achievements
  stats/       Statistics.js
  ui/          UIManager + screens/ (MainMenu, LevelSelect, Shop, Settings, Achievements,
               Statistics, DailyChallenge, PracticePanel, HUD)
  editor/      Editor.js — modular level editor (add new tools by extending the TOOLS array)
```

Gameplay systems communicate through a shared `EventBus` (in `core/Utils.js`)
rather than importing each other directly — e.g. `LevelRuntime` never touches
audio or UI code, it just emits `level:coin`, `level:death`, `level:complete`,
etc., and `Progression`/`Achievements`/`Statistics`/`Game` all listen
independently.

## Levels

50 levels across 5 difficulty tiers (Easy 1-10, Normal 11-20, Hard 21-30,
Insane 31-40, Demon 41-50). Levels 1-5 are hand-authored to teach jump
timing, gaps, jump rings, gravity portals and flight purely through level
design. Levels 6-50 are deterministically composed from a 15-pattern
gameplay-style library (reaction, precision, gravity, reverse gravity,
flight, zigzag, moving platforms, disappearing platforms, fake obstacles,
timed jumps, speed changes, portals, boss sections, chase sections, rhythm
patterns), so re-loading a level always regenerates the exact same layout.
Every level has a unique name, color theme, procedural music track and 3
collectible coins. A fresh Daily Challenge level is composed each day from
the same library, seeded by date.

See `DEVELOPMENT_REPORT.md` for what's implemented, what's simplified, and
what should be built next.
