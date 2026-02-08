# Worms World Party - Browser Edition

A browser-based tribute to the classic **Worms World Party** built entirely with vanilla JavaScript and HTML5 Canvas. No frameworks, no build tools, no dependencies — just pure web tech.

![Gameplay](gameplay.png)

https://github.com/NirDiamant/worms-world-party/raw/main/demo_video/gameplay.mp4

## Play

```bash
git clone https://github.com/nicenemo/worms-world-party.git
cd worms-world-party
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Features

- **Full artillery gameplay** — Bazookas, grenades, shotguns, uzis, airstrikes, and more
- **4 terrain themes** — Grassland, Desert, Arctic, Hell — each with unique weather effects
- **Procedural terrain** — Hills, islands, bridges, valleys with destructible landscape
- **AI opponents** — Three difficulty levels (Easy, Medium, Hard)
- **Pixel art sprites** — All characters and entities drawn as pixel art
- **Synthesized audio** — All sound effects generated via Web Audio API
- **Physics engine** — Gravity, wind, knockback, projectile trajectories
- **Ninja Rope** — Swing across the map with pendulum physics
- **Explosive barrels** — Chain-reaction environmental hazards
- **Minimap** — Keep track of the battlefield
- **Post-game stats** — Kills, damage dealt, and team standings
- **Customizable setup** — Team names, worm names, turn time, game schemes

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move / Aim |
| Space | Jump / Fire / Confirm |
| Enter | Backflip / Fire |
| Tab | Cycle weapons |
| 1-9 | Quick-select weapon |
| Mouse | Camera pan (drag) / Zoom (scroll) |

## Tech Stack

- Vanilla JavaScript (ES Modules)
- HTML5 Canvas (5 stacked layers)
- Web Audio API (synthesized sounds)
- Zero dependencies

## Disclaimer

**Worms World Party** is a trademark of Team17. The original game concept, name, and intellectual property belong to their respective creators. This is an unofficial fan-made tribute project created for educational and entertainment purposes. It is not affiliated with or endorsed by Team17.

## Built With

This entire game was built with [Claude Code](https://claude.ai/claude-code) by Anthropic. From terrain generation to AI opponents to synthesized audio — every line of code was written in collaboration with Claude.

There is much to improve and many features still to add. Pull requests are welcome!

Enjoy playing!
