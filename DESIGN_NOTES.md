# LEMONVERSE — 3D DESIGN NOTES

## Art direction

The portfolio is a playable *architectural exhibition on a floating island*, borrowing its mood from high-end sci-fi environments. Unlike a random geometric scene, every chapter has a distinct silhouette and an identifiable architectural role:

| Chapter | Unique structure | Key materials | Motion |
|---|---|---|---|
| HUB | Kinetic observatory & levitating nucleus | Bronze-gold, titanium, energy glass | Independent three-ring gyroscope |
| ABOUT / ORIGIN | Arched glass observatory | Glass, polished titanium, sage energy core | Suspended crystal |
| SKILLS / WORKSHOP | Seven data towers around a torus knot | Matte dark metal, cobalt glass | Floating jewel tops and gyroscope |
| PROJECTS / SHOWCASE | Three sculpted display vitrines | Gold trim, holographic glass | Independently rotating exhibits |
| CONTACT / SIGNAL | Sculptural dimensional portal | Brushed alloy, amethyst light | Portal pulse and central artifact |

The main world uses a cool blue-green base, restrained gold hardware, pale natural stone and one readable accent per chapter. Lighting relies on an ambient/sky hemisphere, a warm shadow-casting key, a cool rim and localized station beacons.

## Geometry strategy

`roundedGeom()` extrudes a centered shape with bevel geometry, producing soft edge reflections instead of flat box outlines. The function caches repeated geometry shapes. Architectural walls and platforms use cylinders with more sides, while distant rocks and trees intentionally use lower-poly forms to preserve a stylized game aesthetic.

Physically based `MeshStandardMaterial` and `MeshPhysicalMaterial` create polished metal, frosted colored glass and accent surfaces. Sprite-based gradients add a soft localized glow without requiring a dedicated bloom post-processing pass, which is comparatively expensive on mobile GPUs.

## Performance priorities

- Frame-renderer pixel ratio capped at 1.6 on desktop and 1.15 on smaller screens.
- Shadow texture capped at 2048 desktop, 1024 smaller screens.
- Lights illuminate only short station ranges where possible.
- Geometry is built once; only a small number of ornaments are animated per frame.
- Decorative scenic objects don't need independent interactive handlers.
- Reduced-motion CSS covers overlays; 3D ornaments remain animated at low speeds. To fully pause world animation for users requesting reduced motion, adjust `tick()`.

## User-experience principles

- Every station is physically navigable and has a map fast-travel alternative.
- Three.js scene geometry should not block the HUD or modal dialogs.
- Station signs float high and remain clickable.
- Personal data is centralized in `src/content.js` rather than hard-coded into mesh logic.
- The static content fallback should remain legible when hardware or JS modules fail.

## Upgrading further

For photorealism or high-fidelity characters, import properly licensed GLTF/GLB models with the Three.js `GLTFLoader`. For advanced lighting, use an HDRI/environment map and optional selective bloom, but profile GPU and mobile performance first. This project intentionally avoids unlicensed external assets and heavy network-dependent 3D models.
