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
