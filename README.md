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
- Click any body, **orbit line, or asteroid** in the scene to target it; eased cinematic fly-to on every selection, with a crosshair marker on selected minor bodies
- ~1,100-object minor-body belt: named main-belt asteroids, a distributed belt honouring the Kirkwood gaps, Jupiter Trojans at the L4/L5 points, trans-Neptunian objects, near-Earth asteroids, and well-known comets — all Keplerian and individually selectable
- **Comet tails** stream anti-sunward from a selected comet, brightening as it nears the Sun
- **Notable spacecraft** as illustrative markers: ISS, Hubble and Tiangong in low Earth orbit, JWST at L2, Parker Solar Probe, and the Voyagers / Pioneer 10 / New Horizons along their true escape directions
- **Fit system** eases to a wide overview of the current scene; **Guided tour** flies a narrated highlight sequence
- Rich target panel: size-vs-Earth, surface gravity, day length, orbital period, and a clickable moon list for planets
- Distance-faded floating body labels
- Time deck: pause/resume (`Space`), rate presets from real-time to a year per second, live simulated-epoch readout, and a `NOW` reset
- Cinematic camera, manual free flight, and — where a headset is present — an **Enter VR** (WebXR) button
- Full solar catalog (Sun, planets, dwarf planets, candidates, named moons, minor bodies, spacecraft) with class filters, plus confirmed NASA Exoplanet Archive host systems with fly-in schematic views

### The night sky
- The Milky Way view is set against a **real constellation sky**: a curated catalog of the brightest named stars (approximate J2000 positions and magnitudes) with line figures for Orion, the Big Dipper, Cassiopeia, Cygnus, Scorpius, Crux, Leo, and more — toggleable from the View menu

### Minimal, get-out-of-the-way interface
- A compact top-left region switcher and a small top-right toolbar (catalog, view menu, fullscreen, settings) — no persistent chrome bar
- A **View** menu toggles orbits, labels, the asteroid belt, the catalog, the target panel, and the time bar independently
- Hide the bottom time bar on its own, or press `H` to strip **all** interface for a clean wall-display view

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

- Click a planet, moon, star, orbit line, or asteroid: set it as the active target
- Drag / scroll: orbit and zoom in free-flight mode
- `W A S D`: move · `Q / E`: vertical movement · `Shift`: boost
- `Space`: pause / resume simulation time
- `H`: hide or show all interface (clean wall-display view)
- `B`: toggle the bottom time bar
- `C`: toggle the catalog · `V`: toggle the view menu
- `O`: toggle orbit paths · `L`: toggle body labels
- `Control + Shift + O`: settings and away mode

## Accuracy note on spacecraft

Spacecraft positions are **illustrative**, not a live TLE/ephemeris propagation: low-Earth-orbit craft use a representative circular orbit at their real inclination and period, L2 observatories sit in the anti-sunward direction, and the outbound probes are placed along their true escape direction at their current heliocentric distance. Full JPL Horizons ephemerides and tiled catalogs remain a future roadmap item for true, to-the-second accuracy at scale.

## Accuracy boundary

This application combines sourced astronomical parameters with visualization-oriented scale compression. NASA mission textures are used where available. Exoplanet surfaces and bodies without source maps are clearly treated as procedural reconstructions. The Sagittarius A* renderer is a cinematic approximation, not a general-relativistic scientific ray tracer.

The checked-in catalog is broad but is not yet the complete set of every provisional moon, asteroid, comet, spacecraft, and Gaia star. The included data workflow is the foundation for progressively generated and tiled catalogs at that scale.

The expanded renderer currently produces a large client bundle. Code splitting, optimized local WebP/KTX2 textures, and spatially tiled catalogs are planned before the full data-volume phase.

See [visual realism](docs/visual-realism.md) and [architecture](docs/architecture.md).
