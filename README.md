# Space Simulation

A public, browser-based scientific space explorer designed for a seamless two-monitor display, cinematic and free-flight navigation, and a synchronized away-message mode.

## Current build

This branch contains the first technical proof:

- procedural star field and Milky Way band;
- Sun, Earth, and Moon demonstration scene;
- low-precision current-time J2000 orbital model;
- cinematic camera and manual free flight;
- continuous left/right camera frustums for two matching displays;
- synchronized second window using `BroadcastChannel`;
- Chrome screen-placement enhancement with a Firefox manual fallback;
- hidden away/settings panel with the default message **Out of the office**;
- quality presets, fullscreen controls, FPS readout, and bezel correction;
- installable web-app manifest.

The astronomy footer deliberately labels this as a demonstration ephemeris. JPL, NASA Exoplanet Archive, Gaia, small-body catalogs, production textures, and uncertainty metadata are subsequent stages.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Validate

```bash
npm run check
```

## Dual-display test

1. Open the app on the left monitor.
2. Select **Launch Second Display**.
3. In Firefox, move the new window to the right monitor.
4. Select fullscreen in each window.
5. Adjust bezel correction in **Away / Settings** if the center line does not align.

Chrome may place the second window automatically after screen-management permission is granted.

## Controls

- Cinematic mode: automatic camera path.
- Free flight: drag, scroll, `W A S D`, `Q / E`, and `Shift`.
- Hidden panel shortcut: `Control + Shift + O`.

See [`docs/architecture.md`](docs/architecture.md) for the catalog, accuracy, and scale-domain plan.
