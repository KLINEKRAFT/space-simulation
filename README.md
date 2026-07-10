# Space Simulation

A public, browser-based cinematic space explorer designed for one display or a seamless pair of matching monitors.

## Current capabilities

- Solar System scene with the Sun, eight planets, major dwarf planets and candidates, and a broad named-moon catalog
- NASA texture loading with deterministic procedural fallbacks
- atmospheric rims, cloud layers, planetary rings, ACES tone mapping, and bloom
- Milky Way scene populated from confirmed NASA Exoplanet Archive host systems
- visitable procedural reconstructions of loaded exoplanet systems
- Sagittarius A* approximation with an accretion disk and photon-ring treatment
- cinematic camera and manual free flight
- synchronized left/right browser windows, fullscreen controls, and bezel correction
- synchronized **Out of the office** display mode
- installable PWA and Vercel configuration
- scheduled NASA/JPL catalog refresh workflow

## Run locally

```bash
npm install
npm run dev
```

Open the displayed URL, select **Launch Second Display**, move the follower window to the right monitor in Firefox, and enter fullscreen in each window.

## Validate

```bash
npm run check
```

## Controls

- Drag / scroll: orbit and zoom in free-flight mode
- `W A S D`: move
- `Q / E`: vertical movement
- `Shift`: boost
- `Control + Shift + O`: settings and away mode
- `Control + Shift + K`: object catalog

## Accuracy boundary

This application combines sourced astronomical parameters with visualization-oriented scale compression. NASA mission textures are used where available. Exoplanet surfaces and bodies without source maps are clearly treated as procedural reconstructions. The Sagittarius A* renderer is a cinematic approximation, not a general-relativistic scientific ray tracer.

The checked-in catalog is broad but is not yet the complete set of every provisional moon, asteroid, comet, spacecraft, and Gaia star. The included data workflow is the foundation for progressively generated and tiled catalogs at that scale.

See [visual realism](docs/visual-realism.md) and [architecture](docs/architecture.md).
