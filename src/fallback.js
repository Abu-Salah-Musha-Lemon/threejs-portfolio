/**
 * Standalone static fallback: this executes even when the Vite/Three.js module
 * cannot be loaded (missing package, WebGL context failure, offline CDN etc.).
 * It intentionally does not depend on any imports or 3D APIs.
 */
window.setTimeout(() => {
  if (window.__devverseReady) return;

  const loading = document.getElementById('loading');
  const intro = document.getElementById('intro');
  const hud = document.getElementById('hud');
  const fallback = document.getElementById('fallback');
  const targets = document.getElementById('fallback-links');
  if (loading) loading.hidden = true;
  if (intro) intro.hidden = true;
  if (hud) hud.hidden = true;
  if (!fallback) return;
  fallback.hidden = false;
  if (!targets || targets.children.length) return;

  targets.innerHTML = `
    <article class="skill-card">
      <span class="small-cap">THE PERSON</span>
      <h3>Abu Salah Musha Lemon</h3>
      <p>Full-Stack Developer · Graphic Designer · Creative Technologist · Dhaka, Bangladesh.</p>
      <p>Previously Admin &amp; IT Coordinator at TELCo. Pursuing an MSc in CSE at Jagannath University (according to his public GitHub profile).</p>
    </article>
    <article class="skill-card">
      <span class="small-cap">THE TOOLKIT</span>
      <h3>Skills</h3>
      <p>PHP · Laravel · JavaScript · HTML · CSS · Bootstrap · DataTables · Figma · Illustrator · Photoshop · Canva · Blender 3D</p>
    </article>
    <article class="skill-card">
      <span class="small-cap">THE WORK</span>
      <h3>Public GitHub Projects</h3>
      <div class="fallback-projects">
        <a href="https://github.com/Abu-Salah-Musha-Lemon/StockGenie" target="_blank" rel="noopener noreferrer">StockGenie ↗</a>
        <a href="https://github.com/Abu-Salah-Musha-Lemon/ERP-Pro-Admin-Panel" target="_blank" rel="noopener noreferrer">ERP Pro Admin Panel ↗</a>
        <a href="https://github.com/Abu-Salah-Musha-Lemon/e-commerce-app" target="_blank" rel="noopener noreferrer">E-Commerce App ↗</a>
        <a href="https://github.com/Abu-Salah-Musha-Lemon/mediCash" target="_blank" rel="noopener noreferrer">mediCash ↗</a>
        <a href="https://github.com/Abu-Salah-Musha-Lemon/ASML-NU-CSE" target="_blank" rel="noopener noreferrer">ASML NU-CSE ↗</a>
        <a href="https://github.com/Abu-Salah-Musha-Lemon/Personal-Portfolio" target="_blank" rel="noopener noreferrer">Personal Portfolio ↗</a>
      </div>
    </article>
    <article class="skill-card">
      <span class="small-cap">THE SIGNAL</span>
      <h3>Get in touch</h3>
      <div class="fallback-projects">
        <a href="mailto:lemonahmed512@gmail.com">Email Lemon ↗</a>
        <a href="https://www.linkedin.com/in/abu-salah-musha-lemon" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        <a href="https://www.behance.net/abu-salah-musha" target="_blank" rel="noopener noreferrer">Behance ↗</a>
      </div>
    </article>`;
}, 9000);
