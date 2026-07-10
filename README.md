# Space Simulation

A public, browser-based cinematic space explorer designed for one display or a seamless pair of matching monitors.

## Current capabilities

- cinematic Solar System with the Sun, eight planets, major dwarf planets and candidates, and a broad named-moon catalog
- layered Earth rendering: diffuse color, specular oceans, relief, night lights, independently moving clouds, atmosphere scattering, and sunset limb color
- NASA planetary maps with deterministic procedural fallbacks
- HDR render target, ACES filmic tone mapping, restrained bloom, soft stellar particles, lens flare, atmospheric shells, and shader-generated rings
- physically period-based planet and moon motion with real time as the default clock rate
- Milky Way scene populated from confirmed NASA Exoplanet Archive host systems
- visitable procedural reconstructions of loaded exoplanet systems
- Sagittarius A* approximation with an accretion disk and photon-ring treatment
- cinematic camera and manual free flight
- fully collapsible catalog and target drawers plus a zero-HUD full-screen mode
- synchronized left/right browser windows, fullscreen controls, and bezel correction
- synchronized “Out of the office” display mode
- installable PWA, Vercel configuration, and scheduled NASA/JPL catalog refresh workflow

## Run locally

```bash
npm install
npm run dev
```

Open the displayed URL, select **Second Display**, move the follower window to the right monitor in Firefox, and enter fullscreen in each window.

## Controls

- Drag / scroll: orbit and zoom in free-flight mode
- `W A S D`: move
- `Q / E`: vertical movement
- `Shift`: boost
- `H`: hide or reveal the complete HUD
- `Control + Shift + O`: settings and away mode
- `Control + Shift + K`: object catalog
- `Control + Shift + I`: active-target information

## Time behavior

Real time is the default. Every real second advances one simulation second, so the Moon takes approximately 27.3 real days to complete a simulated orbit unless a faster preset is selected in Settings. Rotation and orbital position share the same simulation clock.

## Accuracy boundary

This application combines sourced astronomical parameters with visualization-oriented scale compression. NASA mission textures are used where available. Exoplanet surfaces and bodies without source maps are clearly treated as procedural reconstructions. The Sagittarius A* renderer is a cinematic approximation, not a general-relativistic scientific ray tracer.

See [visual realism](docs/visual-realism.md), [architecture](docs/architecture.md), and [third-party notices](THIRD_PARTY_NOTICES.md).
