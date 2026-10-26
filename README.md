# LEMONVERSE · Abu Salah Musha Lemon

**LEMONVERSE** is a playable Three.js portfolio built around the public professional identity and GitHub work of **Abu Salah Musha Lemon**, a Full-Stack Developer, Graphic Designer and Creative Technologist in Dhaka, Bangladesh.

A custom 3D astronaut navigates a floating sci-fi island, where four distinct architectural stations reveal real biography, skills, six public projects and professional contact channels. All prominent content lives in one editable file; no pre-made 3D models or paid assets are required.

## Features

- **True Three.js scene:** hand-built geometries, animated architectural structures, glowing signs and pathways, 3D astronaut, water surface, scene lighting, orbiting objects, day/night mode, fog and shadows.
- **Gameplay:** WASD / arrows, Shift sprint, E to open a chapter, clickable stations and a world map with fast travel. Progress is saved locally and completion triggers a quest ending.
- **Responsive controls:** virtual joystick, touch Explore control, adapted camera and pixel density on smaller screens.
- **Verified portfolio:** StockGenie, ERP Pro Admin Panel, E-Commerce App, mediCash, ASML NU-CSE and earlier Personal Portfolio with links.
- **Accessible UI:** semantic content dialogs, keyboard focus management, reduced-motion CSS and a static fallback if Three.js cannot load.
- **No tracking, user accounts, database, server API, or paid services.**

## Requirements

- Node.js 20.19+ or 22.12+
- npm and internet access **once** to install Vite + Three.js
- Browser with WebGL support for 3D gameplay

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

```bash
npm run build
npm run preview
```

`npm run build` outputs production assets into `dist/`. **Do not open `index.html` directly with file://**: use the Vite server to resolve the Three.js import.

## Controls

| Action | Control |
|---|---|
| Move | W/A/S/D or arrow keys |
| Sprint | Shift |
| Explore nearest chapter | E |
| Open/close map | M |
| Zoom camera | Mouse wheel |
| Navigate on mobile | Virtual joystick and Explore button |
| Fast travel | Click the map icon or mission item |
| Close any dialog | Esc |

Chapter stations:
1. **The Origin:** About, education and TELCo experience
2. **The Workshop:** web/backend/design tools and listed certifications
3. **The Showcase:** six real GitHub projects with linked demos where available
4. **The Signal:** business email, GitHub, LinkedIn, Behance and YouTube

## Edit content

`src/content.js` holds `profile` and `zones`. Edit the name, title, biography, social links and project entries there. Keep the `zones` IDs (`about`, `skills`, `projects`, `contact`) intact because they are gameplay identifiers.

`src/world.js` controls actual Three.js geometry and environment details. `src/main.js` owns game and modal interactions. `src/style.css` controls the layout. The favicon lives in `assets/favicon.svg`.

Before publishing, ask Lemon to review professional details for accuracy, especially education status, availability, email and employment history. See `SOURCES.md` for an explicit audit trail.

## Deploy to GitHub Pages

1. Push these files to a new GitHub repository with `main` as its branch.
2. In the repo, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included `.github/workflows/deploy.yml` installs dependencies, builds the Vite app and publishes `dist/` to GitHub Pages on pushes to main. You may run it from the Actions tab, too.
4. `vite.config.js` uses `base: './'` for support on both a custom domain and the default GitHub Pages project URL.

**Do not overwrite another live portfolio until the new deployment has been reviewed.**

## Project structure

```text
LEMONVERSE-ASM-Lemon-3D-Portfolio/
├── .github/workflows/deploy.yml
├── assets/favicon.svg
├── src/
│   ├── content.js      # Professional information and real project links
│   ├── world.js        # Procedural Three.js world, character, navigation
│   ├── main.js         # Game state, controls, chapters, mission system
│   ├── fallback.js     # Static fallback when 3D fails to initialize
│   └── style.css       # HUD, screens, responsive styles
├── index.html
├── vite.config.js
├── package.json
├── SOURCES.md
├── TEST_REPORT.md
└── LICENSE
```

## Development and testing notes

A UI/mission test script using a mocked world adapter lives in `test_ui.py`. It **does not validate actual WebGL**. See `TEST_REPORT.md` for tested aspects and remaining checks.

## Credits

Design and implementation: LEMONVERSE interactive portfolio project. Professional information and project ownership are attributed to Abu Salah Musha Lemon. Original procedural Three.js artwork created for this portfolio, not taken from other developers' websites.
