# LEMONVERSE test report · v2.3 · October 27, 2026

## v2.3 checks
- `npm test` passes (collision and terrain tests). `npm run build` passes.
- Real browser, software WebGL, no JavaScript errors on desktop and on an emulated touch phone.
- Walked to radius 37 (the island edge) in 6 of 7 straight lines, the seventh was stopped by a tree, as intended.
- Walked over the bridge from the south bank to the north rim. Walking into the stream away from the bridge is blocked.
- Jump with sprint carried the robot over the stream (apex 1.4, landed on the far bank).
- Touch phone: JUMP and VIEW buttons visible and working. First person and Follow views render.
- Not tested: real frame rate on phones. This version adds grass, animals, water shaders and more lights. If it stutters, lower `grassCount` in `src/nature.js`, the animal counts in `src/animals.js`, or `lamps.initLights` in `src/world.js`.
- Not tested: pointer lock with a real mouse (headless browsers cannot do it), click to look in first person.

# v2.2 report

## v2.2 checks
- `npm test` passes (collision unit tests, including 20,000 random points).
- Real browser, software WebGL: 78 reachable colliders, 359 walks straight into them, 0 pass throughs.
- 59 lamps registered, 30 trees in 9 groves, no JavaScript errors.
- Night and day render correctly (instant switch). The animated switch takes about 2 seconds at 60 fps. In the slow software renderer it takes much longer, which is a test artifact.
- Not tested: frame rate on real phones with 760 grass blades, 7 lights and tree shadows. If a low end phone stutters, lower `grassCount` in `src/nature.js` or the light pool in `src/world.js` (`lamps.initLights`).

# v2.1 report (same day)

## Passed (real browser, software WebGL via SwiftShader)
- `npm install` and `npm run build` succeed (Vite 7, three 0.180).
- Production preview: the real Three.js world initializes (`__devverseReady` true), no JavaScript errors, no failed requests other than Google Fonts (blocked in the test sandbox).
- Intro, in-game HUD, world map warp to Projects, Quick View open, jump links, Escape to close: desktop (1100×680) and mobile (390×760).
- Screenshots in this package are from this real build.

## Not tested
- Real GPU frame rate and battery behavior. SwiftShader is software rendering and says nothing about speed on user devices.
- Touch joystick on a physical phone, orientation changes, Safari and Firefox.
- GitHub Pages deployment and the og:image preview on WhatsApp or LinkedIn.

---

# Earlier report (v2.0, October 23, 2026)

# LEMONVERSE test report · October 23, 2026

## Passed

- `node --check`: `src/content.js`, `src/main.js`, `src/world.js`, `src/fallback.js`, `vite.config.js`.
- Browser UI integration tests with a stub/mock world adapter at 320×720, 390×844, 768×1024, 1440×900, and 1920×1080.
- On each tested viewport, opening the site, entering the game, map navigation, browsing About → Skills → Projects → Contact, 6 verified project cards, external project-link presence, functional public contact links, quest completion and day/night UI controls.
- Zero uncaught JavaScript errors and zero reported horizontal page overflow in these tests.

## Not tested / limitation

The test environment has no access to `registry.npmjs.org`: `npm install` fails with DNS `EAI_AGAIN`, and packages are not cached. Therefore **a real Three.js WebGLRenderer session, GPU frame-rate, 3D model visuals, actual raycast movement, mobile joystick in WebGL, and production Vite build have NOT been verified here**.

The included screenshots show HTML/CSS UI rendered against a **mock/stub Three.js scene**, not the actual production 3D world. They are not claimed to be gameplay screenshots.

## Local release checklist

1. Run `npm install && npm run build && npm run dev` on a machine with npm access.
2. Confirm the floating island, all four 3D landmarks, the player avatar, point lights and labels render in Chrome/Firefox.
3. Walk using WASD, hold Shift to sprint, press E near each landmark, click a landmark, use M for the map, and test auto-walk.
4. Test mobile touch joystick & Explore, including orientation changes.
5. Check performance under battery saver / integrated GPU and record a real screenshot.
6. Test GitHub Pages deployment before linking from an existing portfolio.
