# LEMONVERSE test report · v2.1 · October 26, 2026

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
