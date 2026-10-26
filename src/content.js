/**
 * LEMONVERSE — verified profile & repository content, checked 2026-10-23.
 * Public sources are documented in SOURCES.md. Edit content here before publishing.
 * Zone IDs and x/z values are used by the Three.js navigation system.
 */
export const profile = {
  name: 'Abu Salah Musha Lemon',
  shortName: 'ASM',
  title: 'Full-Stack Developer · Graphic Designer · Creative Technologist',
  tagline: 'Engineering useful systems. Designing memorable experiences.',
  location: 'Dhaka, Bangladesh',
  availability: 'OPEN TO COLLABORATION',
  email: 'lemonahmed512@gmail.com',
  github: 'https://github.com/Abu-Salah-Musha-Lemon',
  linkedin: 'https://www.linkedin.com/in/abu-salah-musha-lemon',
  behance: 'https://www.behance.net/abu-salah-musha',
  youtube: 'https://www.youtube.com/channel/UCuJrVADp9B0T9AIadz2eAVw',
  resume: '', // Optional: replace with a public, privacy-reviewed CV URL
  about: [
    'I work at the intersection of web engineering, graphic design, and digital experience. My projects range from business systems and inventory tools to responsive dashboards and education-focused websites.',
    'At TELCo, I combined IT coordination with creative production — supporting digital infrastructure, maintaining a company website, and designing brand and print materials.',
    'I am pursuing an MSc in Computer Science and Engineering at Jagannath University while continuing to build software and explore creative technology.'
  ],
  experience: {
    role: 'Admin & IT Coordinator',
    company: 'TELCo',
    period: 'Nov 2024 — Jan 2026',
    work: 'IT infrastructure, WordPress/Divi website, design and brand production.'
  },
  education: 'MSc in CSE · Jagannath University (in progress; per GitHub profile)',
  facts: [
    { value: '06', label: 'Featured repositories' },
    { value: '02', label: 'Creative disciplines' },
    { value: '04', label: 'World chapters' }
  ],
  skills: [
    { category: 'Web Development', icon: '⌘', items: ['HTML5', 'CSS3', 'JavaScript', 'Bootstrap 5', 'jQuery', 'Responsive UI'] },
    { category: 'Backend & Systems', icon: '◇', items: ['PHP', 'Laravel 11', 'Authentication', 'CRUD Systems', 'DataTables', 'DOMPDF'] },
    { category: 'Design & 3D', icon: '✳', items: ['Figma', 'Adobe Illustrator', 'Adobe Photoshop', 'Canva', 'Blender 3D', 'Brand Design'] },
    { category: 'Creative Workflow', icon: '◈', items: ['Git & GitHub', 'WordPress / Divi', 'UI/UX Design', 'Digital Content', 'Visual Direction'] }
  ],
  certifications: [
    'UI/UX Design with Figma — Udemy',
    'Graphic Design with Canva & Freelancing — Udemy',
    'Microsoft Designer Masterclass — Udemy',
    'Career Essentials in Generative AI — Microsoft & LinkedIn',
    'Career Essentials in Software Development — Microsoft & LinkedIn'
  ],
  projects: [
    {
      number: '01', code: 'SG', title: 'StockGenie', type: 'Inventory · Point of Sale', year: 'Public repository',
      description: 'Laravel-powered inventory and POS system with stock management, transactions, PDF reporting and an interactive data-management interface.',
      tags: ['Laravel 11', 'PHP', 'Bootstrap', 'DataTables'], accent: '#b7f86a',
      github: 'https://github.com/Abu-Salah-Musha-Lemon/StockGenie', live: ''
    },
    {
      number: '02', code: 'ERP', title: 'ERP Pro Admin Panel', type: 'ERP · Admin Dashboard', year: 'Live demo',
      description: 'Responsive ERP and inventory admin dashboard with analytics, business modules, dark mode, and over 32 pages.',
      tags: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'], accent: '#7edbff',
      github: 'https://github.com/Abu-Salah-Musha-Lemon/ERP-Pro-Admin-Panel',
      live: 'https://abu-salah-musha-lemon.github.io/ERP-Pro-Admin-Panel/'
    },
    {
      number: '03', code: 'EC', title: 'E-Commerce Platform', type: 'Commerce · Laravel', year: 'Public repository',
      description: 'Single-admin web application with product and category management, authentication, order processing and dynamic data tables.',
      tags: ['Laravel', 'PHP', 'Bootstrap', 'DataTables'], accent: '#ffc3a6',
      github: 'https://github.com/Abu-Salah-Musha-Lemon/e-commerce-app', live: ''
    },
    {
      number: '04', code: 'MC', title: 'mediCash', type: 'Pharmacy · Sales', year: 'Public repository',
      description: 'Medicine sales and inventory management application for small pharmacies, including invoices, transaction workflows and notifications.',
      tags: ['Laravel 11', 'JavaScript', 'DOMPDF', 'Bootstrap'], accent: '#e7a6ff',
      github: 'https://github.com/Abu-Salah-Musha-Lemon/mediCash', live: ''
    },
    {
      number: '05', code: 'NU', title: 'ASML NU-CSE', type: 'Education · Web Resource', year: 'Live demo',
      description: 'CSE-oriented resource website featuring course, institution and student-resource information for the National University community.',
      tags: ['JavaScript', 'HTML5', 'CSS3', 'JSON'], accent: '#73e4cb',
      github: 'https://github.com/Abu-Salah-Musha-Lemon/ASML-NU-CSE',
      live: 'https://abu-salah-musha-lemon.github.io/ASML-NU-CSE/'
    },
    {
      number: '06', code: 'WEB', title: 'Personal Portfolio', type: 'Portfolio · Frontend', year: 'Live demo',
      description: 'An earlier personal web portfolio showcasing frontend development, responsive interface design and professional information.',
      tags: ['HTML', 'CSS', 'JavaScript', 'Frontend'], accent: '#ffd970',
      github: 'https://github.com/Abu-Salah-Musha-Lemon/Personal-Portfolio',
      live: 'https://abu-salah-musha-lemon.github.io/Personal-Portfolio/'
    }
  ]
};

export const zones = [
  { id: 'about', name: 'THE ORIGIN', subtitle: 'About Lemon', heading: 'Meet the mind behind the work.', color: '#b7f86a', x: -15, z: -10, chapter: '01', symbol: '✳' },
  { id: 'skills', name: 'THE WORKSHOP', subtitle: 'Skills & tools', heading: 'Where design meets engineering.', color: '#8ca6ff', x: 15, z: -10, chapter: '02', symbol: '⌘' },
  { id: 'projects', name: 'THE SHOWCASE', subtitle: 'Real GitHub projects', heading: 'Projects with purpose.', color: '#ffb08b', x: -15, z: 12, chapter: '03', symbol: '◈' },
  { id: 'contact', name: 'THE SIGNAL', subtitle: 'Contact & links', heading: 'Let’s create what comes next.', color: '#e8a8ff', x: 15, z: 12, chapter: '04', symbol: '↗' }
];
