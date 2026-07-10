# Architecture

## Current proof

The first proof validates the expensive and failure-prone parts of the product before large astronomy catalogs are introduced:

- one WebGL scene rendered as either a single viewport or two adjacent view offsets;
- a controller window and a synchronized follower window;
- `BroadcastChannel` with a `localStorage` event fallback;
- a hidden, synchronized away-message panel;
- cinematic and manual navigation modes;
- adaptive pixel-ratio caps for dual 4K monitors;
- a low-precision J2000 demonstration ephemeris for the Sun, Earth, and Moon.

The two windows use the same conceptual camera. `PerspectiveCamera.setViewOffset()` assigns the left and right halves of a single wide frustum. Bezel correction inserts a narrow, intentionally unrendered strip between the viewports.

## Accuracy boundary

The proof is not yet the final scientific ephemeris. Its footer labels the current orbital model as a low-precision demonstration. The production data pipeline will distinguish:

1. measured values;
2. derived values;
3. estimated values;
4. procedural visual reconstructions;
5. unknown values.

No procedural exoplanet surface will be presented as an observed image.

## Planned data pipeline

### Solar System

- JPL Horizons or generated SPICE-derived state vectors;
- versioned, compressed interpolation segments for browser use;
- JPL Small-Body Database identifiers and classifications;
- natural-satellite and dwarf-planet catalogs;
- progressive loading for asteroids, comets, spacecraft, and trans-Neptunian objects.

### Stars and planetary systems

- NASA Exoplanet Archive for confirmed planets, candidates, and host-star measurements;
- Gaia astrometry for positions, distances, proper motion, and photometry;
- confidence and provenance metadata stored with every field;
- binary or columnar catalog chunks loaded by galactic sector.

### Milky Way and Sagittarius A*

- measured catalog stars where practical;
- a procedural density model for the unresolved galactic population;
- layered dust and emission structures;
- a GPU black-hole visualization using a documented approximation rather than claiming full real-time general-relativistic ray tracing.

## Scale domains

The final engine will use floating origins and separate scale domains:

- body surface;
- local moon system;
- planetary system;
- nearby stellar neighborhood;
- galactic space;
- galactic center.

Transitions can appear continuous while coordinates are rebased behind the scenes.

## Browser policy

Firefox remains a supported manual workflow. Chrome-compatible browsers may use the Window Management API, when permission is granted, to place the second window automatically. A public website cannot guarantee fullscreen or monitor placement without a user gesture and browser permission.
