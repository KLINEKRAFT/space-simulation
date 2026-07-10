# Architecture

## Runtime layers

- **React instrument layer** — catalogs, search, scene selection, away mode, calibration, and data provenance.
- **Three.js renderer** — Solar System, galaxy, exoplanet-detail, and Sagittarius A* scenes.
- **Display synchronization** — `BroadcastChannel` with a `localStorage` fallback; one controller and one follower viewport.
- **Catalog layer** — curated built-in Solar System data plus generated NASA Exoplanet Archive and JPL Horizons files.
- **PWA layer** — installable shell and same-origin runtime caching.

## Coordinate domains

A single world coordinate scale is not used for planetary surfaces, the Solar System, and the Milky Way. Each scene has a local coordinate domain and camera behavior. This avoids floating-point precision loss and allows deliberate transitions later.

## Data pipeline

`scripts/update-astronomy-data.mjs` creates:

- `public/data/exoplanets.json` from the NASA Exoplanet Archive `pscomppars` table.
- `public/data/solar-vectors.json` from JPL Horizons `VECTORS` queries.

A weekly GitHub Action refreshes the generated files. The app uses the exoplanet file directly and retains Horizons vectors as the foundation for replacing the built-in orbital-element model.

## Current rendering domains

### Solar System

The renderer includes the Sun, eight planets, major dwarf planets and candidates, and a broad named-moon catalog. Hierarchical moon positions are calculated relative to their parent body. Cinematic and orbital-proportion display modes are separate so readability is not confused with literal scale.

### Milky Way and planetary systems

Confirmed exoplanet hosts are loaded from NASA data and placed from published right ascension, declination, and distance when available. Selecting a host generates a local system view. Exoplanet surfaces remain procedural because observed global surface maps do not exist.

### Sagittarius A*

The Galactic Center view is an explicitly labeled performant approximation with an event-horizon silhouette, photon ring, accretion flow, star density, tone mapping, and bloom. It is not a full general-relativistic ray tracer.

## Next data-volume milestones

- Generate the complete current natural-satellite and small-body index from JPL source tables.
- Partition minor bodies by spatial tile and magnitude for progressive loading.
- Add a selected Gaia host-star subset for real astrometric placement and proper motion.
- Add texture manifests with local optimized WebP/KTX2 derivatives and source attribution.
- Replace the orbital-element runtime with interpolation over refreshed Horizons/SPICE vector segments.

## Browser policy

Firefox remains a supported manual workflow. Chrome-compatible browsers may use the Window Management API, when permission is granted, to place the second window automatically. A public website cannot guarantee fullscreen or monitor placement without a user gesture and browser permission.
