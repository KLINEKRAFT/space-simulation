# Visual realism strategy

The renderer separates scientific data accuracy from cinematic presentation. A planet may use an authoritative albedo map while its apparent radius, orbit spacing, bloom, exposure, and atmospheric visibility are exaggerated in cinematic mode so the scene remains readable on two 4K displays.

## Rendering decisions

- All lighting calculations use Three.js' linear working color space.
- JPEG and PNG albedo textures are explicitly tagged sRGB.
- ACES filmic tone mapping compresses solar highlights without flattening shadow detail.
- Bloom is reserved for the Sun, bright stars, atmospheric rims, and Sagittarius A*'s accretion flow.
- Atmospheres use a view-angle Fresnel shader rather than a uniformly transparent shell.
- Earth uses a separately rotating cloud layer.
- Roughness varies by surface class: rock, ice, cloud-covered, and gas-giant materials do not share one response.
- Rings use radial opacity and subtle band variation instead of a single flat disk.
- Unknown exoplanet appearances are deterministic procedural reconstructions and are labeled as such.

## Source policy

NASA 3D Resources is the preferred texture source. A local procedural texture is generated when a texture is absent or cannot load, so the simulator remains usable offline and never renders a blank body.

The application uses three distinct accuracy labels:

1. **Measured/source texture** — derived from a public mission or planetary map.
2. **Data-grounded reconstruction** — measured size/orbit with a procedural surface.
3. **Illustrative approximation** — incomplete orbital or physical data, explicitly disclosed.

## Scale policy

Scientific mode uses logarithmic distance compression while preserving relative ordering and broad ratios. Cinematic mode increases body radii and reduces empty space. Neither mode should imply that the rendered screen distance is a literal ruler unless the interface explicitly says so.

## Black-hole boundary

Sagittarius A* is rendered as a performant visual approximation: event-horizon silhouette, photon ring, Doppler-biased accretion disk, bloom, and a dense Galactic Center environment. It is not a general-relativistic ray tracer and must remain labeled as an approximation.
