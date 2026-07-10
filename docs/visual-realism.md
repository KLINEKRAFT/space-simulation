# Visual realism strategy

The renderer separates scientific data accuracy from cinematic presentation. A planet may use an authoritative albedo map while its apparent radius, orbit spacing, bloom, exposure, and atmospheric visibility are enhanced in cinematic mode so the scene remains readable on two 4K displays.

## Rendering decisions

- Lighting is evaluated in Three.js' linear working color space; photographic color maps are tagged sRGB and non-color relief/specular maps remain linear.
- An HDR half-float render target feeds ACES filmic tone mapping and post-processing.
- Bloom is intentionally restrained and reserved for the Sun, bright stars, atmospheric rims, and Sagittarius A*'s accretion flow.
- Stars use soft radial particle sprites rather than hard square points.
- The Sun combines animated multi-octave shader noise, a corona, bloom, and a restrained lens flare.
- Atmospheres combine camera-facing limb intensity with sun-facing illumination and a warmer sunset term near the terminator.
- Earth is assembled from separate surface, relief, specular, night-light, cloud, and atmosphere layers. Clouds rotate independently.
- Roughness and surface response vary by class: rock, ice, cloud-covered worlds, and gas giants do not share one generic material.
- Rings use shader-generated radial bands and gaps rather than a flat uniformly transparent disk.
- Unknown exoplanet appearances are deterministic procedural reconstructions and remain labeled as such.

## Open-source reference study

The visual-material architecture was informed by EarthVR's MIT-licensed layered Earth approach: diffuse/specular/bump maps, a separate night-light shader, a cloud shell, atmospheric scattering, a sky environment, and lens flare. This project reimplements those ideas for the current Three.js API, React, HDR post-processing, multiple planets, synchronized browser windows, and a modern simulation clock.

Additional atmosphere repositories and official Three.js examples were reviewed for Rayleigh-style limb treatment, post-processing order, physically based material behavior, and Lensflare integration. Exact third-party notices are recorded in `THIRD_PARTY_NOTICES.md`.

## Time and orbital policy

The default time rate is real time: one simulation second per real second. Orbital positions use each body's cataloged period, and axial rotation advances from the same simulated-day delta. Cinematic acceleration is opt-in through named presets rather than an ambiguous “days per second” slider.

## Source policy

NASA 3D Resources is the preferred planetary-map source. A local procedural texture is generated when a source map is absent or cannot load, so the simulator remains usable and never renders a blank body. EarthVR's MIT-licensed Earth and Moon layers are loaded with attribution while local fallbacks remain available.

The application uses three distinct accuracy labels:

1. **Measured/source texture** — derived from a public mission or planetary map.
2. **Data-grounded reconstruction** — measured size/orbit with a procedural surface.
3. **Illustrative approximation** — incomplete orbital or physical data, explicitly disclosed.

## Scale policy

Scientific mode uses logarithmic distance compression while preserving relative ordering and broad ratios. Cinematic mode increases body radii and reduces empty space. Neither mode should imply that rendered screen distance is a literal ruler unless the interface explicitly says so.

## Black-hole boundary

Sagittarius A* is rendered as a performant visual approximation: event-horizon silhouette, photon ring, Doppler-biased accretion disk, bloom, and a dense Galactic Center environment. It is not a general-relativistic ray tracer and remains labeled as an approximation.
