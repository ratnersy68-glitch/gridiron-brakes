# Gridiron Breaks

A polished, wholly-original football trading card collecting sim. Buy boxes, crack packs with
satisfying animations, build a binder, chase legendary parallels and autos, sell on a fluctuating
marketplace, work your way up from shop employee to owning the biggest card business in the game.

Every player, team, brand, and product name is fictional and legally distinct from any real
league, card company, or athlete.

## Running it

No build step — it's a static ES-module app.

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

## Structure

```
index.html            entry point
styles/                dark theme + animation keyframes
src/
  data/                players (420+), teams (32), rarities, card types/parallels, boxes (17 products), achievements (330+)
  systems/             state, cards, economy/market, pack-opening odds, binder, selling, marketplace,
                       shop job, player store upgrades, achievements engine, save/load, sound (WebAudio SFX)
  ui/                  screens (home, box shop, opening animation, binder, marketplace, shop job, store,
                       achievements, settings) + shared components (card tiles, modal, toasts, confetti)
  game.js              controller wiring systems together behind a small action API
  main.js              bootstrap: title/save-slot screen -> app shell
```

Save data lives in `localStorage`, with multiple named slots and autosave.
