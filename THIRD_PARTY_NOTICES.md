# Third-party notices

## EarthVR

This project adapts visual-layer *techniques* popularized by **EarthVR** by Celestial Phineas — day/night terminator blending, night city lights, specular ocean highlights, and distance-attenuated atmosphere halos:

- Repository: `celestialphineas/EarthVR`
- Copyright © 2018 Celestial Phineas
- License: MIT

No EarthVR source code or texture assets are bundled or loaded at runtime; the shaders, scene graph, time system, dual-display synchronization, and interface are original implementations.

Permission is hereby granted, free of charge, to any person obtaining a copy of the software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Three.js

Three.js and its official example add-ons are distributed under the MIT License. This application uses Three.js, OrbitControls, EffectComposer, RenderPass, OutputPass, UnrealBloomPass, ShaderPass, and FXAAShader. Earth day/night and packed bump/roughness/clouds maps plus the Moon map are loaded at runtime from the Three.js repository's example planet texture set (NASA-derived imagery).

## NASA resources

Planetary maps are loaded from NASA 3D Resources when available, and exoplanet system data comes from the NASA Exoplanet Archive. NASA imagery and media are used as scientific visualization source material; individual asset credits and restrictions should continue to be reviewed before packaging assets locally or using the project commercially.

## Astronomical catalogs

Bright-star positions and magnitudes for the constellation sky are an approximate, hand-curated subset in the spirit of the HYG database (Hipparcos/Yale/Gliese). Minor-body and spacecraft orbital elements are approximate published values or representative parameters for visualization; they are not a substitute for authoritative ephemerides.

## Fonts

Space Grotesk and IBM Plex Mono are served via Google Fonts under the SIL Open Font License 1.1.
