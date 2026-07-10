# Visual realism strategy

The renderer separates scientific data accuracy from cinematic presentation. A planet may use an authoritative albedo map while its apparent radius, orbit spacing, bloom, exposure, and atmospheric visibility are exaggerated in cinematic mode so the scene remains readable on two 4K displays.

## Earth pipeline (EarthVR-inspired)

Earth is the flagship surface and uses a dedicated shader rather than a stock material, following the approach popularized by the EarthVR WebVR demo (day/night blending, specular ocean, halo) and the three.js TSL earth example:

- **Day/night terminator blend** — NASA 4K day and night maps are mixed per-fragment on `smoothstep` of the sun angle, so city lights emerge exactly along the terminator as the planet rotates.
- **City lights** — the night map is boosted and masked by cloud cover so lights dim under storm systems.
- **Ocean sun-glint** — a Blinn-Phong lobe gated by the packed roughness channel (ocean = smooth) and the day mask; land never glints.
- **Cloud cover and shadows** — cloud coverage lives in the blue channel of a packed bump/roughness/clouds map, drifts independently of the surface, and is sampled twice: once for lit cloud tops and once offset for ground shadows.
- **Terrain relief** — finite-difference normal perturbation from the packed height channel.
- **Atmosphere** — a back-face shell whose glow peaks at the planet limb and is modulated by sun direction: Rayleigh-ish blue on the day side, a warm ring near the terminator, near-invisible at night. The surface shader adds matching blue in-scatter at grazing view angles.

## Rendering decisions

- All lighting calculations use Three.js' linear working color space.
- JPEG and PNG albedo textures are explicitly tagged sRGB; packed data maps stay linear.
- ACES filmic tone mapping compresses solar highlights without flattening shadow detail.
- Bloom is threshold-gated (≈0.88) so it is reserved for the Sun, hot star cores, and Sagittarius A*'s accretion flow rather than washing planet daysides.
- FXAA runs as the final pass; MSAA is off because rendering goes through the composer.
- The Sun uses domain-warped fBM granulation with limb darkening, plus a chromosphere rim shell and a procedural corona sprite with drawn streamers.
- Atmospheres use a sun-aware limb shader (see Earth pipeline) rather than a uniformly transparent shell; Venus and Titan get thicker shells than Mars.
- Rings use a radial profile texture (ringlets, Cassini division, Encke gap for Saturn) with an analytic cylindrical planet shadow computed per-fragment in world space.
- The starfield is a custom point shader: soft round sprites, per-star size/temperature/twinkle phase. The Milky Way backdrop is a procedural equirectangular dome carrying only low-frequency nebulosity — pixel stars belong exclusively to the 3D point field so nothing magnifies into blobs.
- Roughness varies by surface class: rock, ice, cloud-covered, and gas-giant materials do not share one response.
- Procedural fallbacks are fBM-based: banded, domain-warped flow for gas giants (with the Great Red Spot on Jupiter), crater fields with rim highlights for rocky bodies, lineae cracks for icy moons.
- Unknown exoplanet appearances are deterministic procedural reconstructions and are labeled as such. Exoplanet host stars reuse the solar granulation shader tinted by stellar temperature class.

## Source policy

The three.js repository's planet set (NASA-derived 4K Earth day/night and packed bump/roughness/clouds maps, Moon) and NASA 3D Resources are the preferred texture sources. A local procedural texture is generated when a texture is absent or cannot load, so the simulator remains usable offline and never renders a blank body.

The application uses three distinct accuracy labels:

1. **Measured/source texture** — derived from a public mission or planetary map.
2. **Data-grounded reconstruction** — measured size/orbit with a procedural surface.
3. **Illustrative approximation** — incomplete orbital or physical data, explicitly disclosed.

## Scale policy

Scientific mode uses logarithmic distance compression while preserving relative ordering and broad ratios. Cinematic mode increases body radii and reduces empty space. Neither mode should imply that the rendered screen distance is a literal ruler unless the interface explicitly says so.

## Black-hole boundary

Sagittarius A* is rendered as a performant visual approximation: event-horizon silhouette, photon ring, relativistically doppler-beamed accretion disk (approaching limb brightened and blue-shifted), and view-facing lensed-image arcs above and below the shadow. It is not a general-relativistic ray tracer and must remain labeled as an approximation.
