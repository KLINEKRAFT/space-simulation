# Space Simulation

A public, browser-based cinematic space explorer designed for one display or a seamless pair of matching monitors.

## Current capabilities

### Rendering
- Photoreal Earth in the EarthVR tradition: NASA 4K day/night imagery blended along a live terminator, city lights on the night side, ocean sun-glint, drifting cloud cover with ground shadows, and sun-aware atmospheric scattering (blue day limb, warm twilight ring)
- Sun with domain-warped granulation, limb darkening, chromosphere rim, and procedural corona streamers
- Saturn-class ring systems with radial ringlet profiles, the Cassini division, and an analytic planet shadow across the ring plane
- Sagittarius A* with a doppler-beamed accretion disk, view-facing gravitational-lensing arcs, and a photon ring
- Exoplanet host stars rendered with the granulation shader, tinted by stellar temperature
- Shader-based twinkling starfield with soft round sprites, plus a procedural Milky Way sky dome
- NASA texture streaming with deterministic fBM procedural fallbacks (banded gas giants, cratered rocky worlds, ice-crack moons)
- ACES tone mapping, threshold bloom, and FXAA

### Interaction
- Click any body in the scene to target it; eased cinematic fly-to on every selection
- Distance-faded floating body labels
- Time deck: pause/resume (`Space`), rate presets from real-time to a year per second, live simulated-epoch readout, and a `NOW` reset
- Cinematic camera and manual free flight
- Full solar catalog (Sun, planets, dwarf planets, candidates, named moons) plus confirmed NASA Exoplanet Archive host systems with fly-in schematic views

### Platform
- Synchronized left/right browser windows, fullscreen controls, and bezel correction
- Synchronized **Out of the office** display mode
- Installable PWA (network-first navigations so deploys land immediately) and Vercel configuration
- Scheduled NASA/JPL catalog refresh workflow

## Run locally

```bash
npm install
npm run dev
```

Open the displayed URL, select **Second Display**, move the follower window to the right monitor in Firefox, and enter fullscreen in each window.

## Validate

```bash
npm run check
```

The feature branch currently passes its GitHub Actions install, unit-test, TypeScript, and production-build checks.

## Controls

- Click a planet, moon, or star: set it as the active target
- Drag / scroll: orbit and zoom in free-flight mode
- `W A S D`: move
- `Q / E`: vertical movement
- `Shift`: boost
- `Space`: pause / resume simulation time
- `Control + Shift + O`: settings and away mode
- `Control + Shift + K`: object catalog

## Accuracy boundary

This application combines sourced astronomical parameters with visualization-oriented scale compression. NASA mission textures are used where available. Exoplanet surfaces and bodies without source maps are clearly treated as procedural reconstructions. The Sagittarius A* renderer is a cinematic approximation, not a general-relativistic scientific ray tracer.

The checked-in catalog is broad but is not yet the complete set of every provisional moon, asteroid, comet, spacecraft, and Gaia star. The included data workflow is the foundation for progressively generated and tiled catalogs at that scale.

The expanded renderer currently produces a large client bundle. Code splitting, optimized local WebP/KTX2 textures, and spatially tiled catalogs are planned before the full data-volume phase.

See [visual realism](docs/visual-realism.md) and [architecture](docs/architecture.md).
