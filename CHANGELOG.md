# Changelog v2.3 (robot, whole island, stream, bridge, animals, jump, cameras)

## Robot
- New model: white shell, lemon accents, glowing chest core, visor with blinking eyes, swaying antenna, jet pack.
- Better animation: walk and sprint cycle, breathing when idle, lean while running, arms up and jet flames when jumping, squash on landing, shadow that shrinks in the air.

## Whole island
- You can walk to the very edge of the disk (circle of radius 37, was a box of 56 by 48). Rim bollards are solid.

## Jump
- Space on desktop, JUMP button on phones. Apex about 1.4 units, you can jump over the stream.

## Camera views
- V key, VIEW button in the top bar, or the VIEW button on phones cycles: Overview (as before), Follow (behind the robot), First person.
- In Follow and First person, WASD moves relative to where you look. Desktop: click the scene in first person and move the mouse (Esc releases). Phones: drag the screen to look.

## Stream, waterfall, bridge
- A stream runs from a spring on the west rim to a waterfall off the north east rim, with animated water, banks, rocks and reeds. Fish swim in it.
- An arched wooden bridge crosses it (walkable, lanterns at the ends), with a stone trail from the hub and a lookout deck on the far bank.
- The stream blocks walking, but you can jump over it.
- All of it lives in `src/terrain.js`. Positions are listed at the top of that file.

## Animals
- 7 rabbits and 3 deer wander and run away when you come close, 11 birds circle overhead, 16 butterflies by day, fireflies by night, 8 fish. Birds and butterflies rest at night.
- Code in `src/animals.js`. Counts are lower on phones.

## Tests
- `npm test` now also checks the terrain (bridge height, stream clearance, jump over water).

# Changelog v2.2 (world pass: lamps, collisions, trees, day and night)

## Lamps
- Every post now has a lamp: 24 walkway posts, 12 outer obelisks, station and hub pillars, rim bollards. 59 lamps in total.
- Each lamp has a glowing head, a halo and a pool of light on the ground. They turn on at dusk and off at dawn.
- Only 7 real lights (4 on phones) follow the player and switch to the nearest lamps, so the GPU stays fast. The player also carries a small headlamp at night.
- Station beacons are dimmer by day.

## Collisions
- Trees have box colliders, bushes circles, rocks rotated boxes, obelisks and walkway posts also block. 120 colliders in total.
- You slide along trunks instead of stopping dead. Click to walk steers around obstacles and gives up cleanly if stuck.
- Logic lives in `src/collision.js` with a Node test: `npm test`.

## Trees and nature
- New `src/nature.js`: 9 groves with 30 trees in four kinds (pine, oak, birch, and a lemon tree with yellow fruit), 4 to 5 bushes per grove, rocks, moss patches, 760 swaying grass tufts, flowers.
- Trunks have bark textures and branches, canopies are lumpy and textured, trees sway in wind and cast shadows (shadows off on phones).
- Fireflies appear at night.

## Day and night
- New `src/atmosphere.js`. A single value drives sky dome, fog, sun and moonlight, exposure, sea color, clouds, stars, sun and moon. It passes through a warm dusk tint.
- First visit follows the visitor's local time (day 06:00 to 18:00). The choice is remembered after the button is used. Set `settings.autoDayByClock = false` in `src/content.js` to always start at night.
- In day mode the HUD gets a soft dark scrim so text stays readable.
- Load with `?debug` in the URL to get `window.__lemonverse` for testing.

# Changelog v2.1 (design and usability pass)

## Colors
New palette. Update `:root` in `src/style.css` to change it.
- Background `#0B1220`, surface `#121B2D`, surface 2 `#1A2540`
- Text `#F3F6FB`, muted text `#A9B4C8`
- Primary accent (lemon) `#FFC83D`, secondary `#4CC9F0`
- Chapter colors: About `#FFC83D`, Skills `#5B8CFF`, Projects `#35D0C0`, Contact `#FF8A5B`
- All six project cards use the primary accent. Muted text colors were lifted to pass 4.5:1 contrast.

## Readability
- No text below 11px (was 8px). Mono labels 11 to 12px, body copy 14 to 16px.
- Heading letter-spacing reduced from -0.07/-0.09em to -0.03em so letters no longer touch.
- Buttons have a 44px minimum height.

## Usability
- Quick View: every chapter on one scrollable page, from the intro and the in-game top bar. No game needed.
- Intro text now says what Lemon builds. Stats are real numbers (6 projects, 32+ ERP pages, 5 certifications).
- Removed filler: "BUILD 01", "SYSTEM ONLINE", "1 player", "infinite possibilities".
- Projects: 3 featured cards plus a compact list. Optional `image` field for real screenshots (put files in `public/projects/`).
- Contact: copy email button. Optional `replyTime` and `resume` fields in `src/content.js`.
- Mobile: mission panel is collapsible and starts collapsed on screens up to 800px wide.
- Title changed to "Laravel Developer · UI & Graphic Designer" (edit `profile.title` if you prefer the old one).

## Fixes
- `src/fallback.js` returned 404 in production builds (plain script tag). It is now a module, so the static fallback can work.
- Reduced motion: 3D ornaments and stars stop animating when the OS asks for reduced motion.

## SEO and sharing
- Added og:image (`public/og-image.png`), Twitter card, canonical URL, og:url, updated description.
- The URLs assume `https://abu-salah-musha-lemon.github.io/LEMONVERSE-ASM-Lemon-3D-Portfolio/`. Change them in `index.html` if your repo name or domain differs.

## Not changed
- `test_ui.py` (mock world test) was not re-run after this pass.
- The 3D geometry colors in `src/world.js` (trees, rocks, platforms) are unchanged except the night sky. Chapter colors now follow the new palette.
