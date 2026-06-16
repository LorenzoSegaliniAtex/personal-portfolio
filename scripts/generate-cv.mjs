// Genera il CV in PDF (Italiano e Inglese) a partire dai dati del portfolio.
//
// Sorgenti dati:
//   ../src/data/portfolio.json      -> CV italiano  -> cv-lorenzo-segalini-it.pdf
//   ../src/data/portfolio.en.json   -> CV inglese   -> cv-lorenzo-segalini-en.pdf
//
// Output: ../public/assets/cv/  (così i link "CV ↓" del sito funzionano e
//         la GitHub Action può pubblicarli come artifact).
//
// Esecuzione locale:  cd scripts && npm install && npm run build:cv

import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname } from "node:path";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "public/assets/cv");

// URL pubblico del sito (deve combaciare con astro.config.mjs: site + base).
// I badge dei certificati nel PDF puntano al PDF "online" su GitHub Pages.
// Se passi a un dominio custom, aggiorna queste due costanti.
const SITE = "https://lorenzosegaliniatex.github.io";
const BASE = "/personal-portfolio";
const onlineUrl = (p) => `${SITE}${BASE}/${String(p).replace(/^\//, "")}`;

const LABELS = {
  it: {
    summary: "Profilo",
    experience: "Esperienza",
    projects: "Progetti",
    education: "Formazione",
    skills: "Competenze",
    languages: "Lingue",
    softSkills: "Soft skills",
    certifications: "Certificazioni",
    interests: "Interessi",
  },
  en: {
    summary: "Profile",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    softSkills: "Soft skills",
    certifications: "Certifications",
    interests: "Interests",
  },
};

const TARGETS = [
  { lang: "it", data: "src/data/portfolio.json", out: "cv-lorenzo-segalini-it.pdf" },
  { lang: "en", data: "src/data/portfolio.en.json", out: "cv-lorenzo-segalini-en.pdf" },
];

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Icone in linea (stile feather). color opzionale.
const ICON_PATHS = {
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  linkedin:
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  award:
    '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
};
const icon = (name, color = "#3b6fd4") =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;

// Carica un'immagine da /public e la converte in data URI
// (puppeteer usa setContent senza base URL, quindi i path relativi non si caricano).
async function loadImageDataUri(imgPath) {
  if (!imgPath) return null;
  try {
    const abs = resolve(root, "public", imgPath.replace(/^\//, ""));
    const buf = await readFile(abs);
    const ext = extname(abs).toLowerCase();
    const mime =
      ext === ".svg"
        ? "image/svg+xml"
        : ext === ".png"
        ? "image/png"
        : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function renderHtml(data, lang, photo) {
  const L = LABELS[lang];
  const p = data.profile;

  const experience = (data.experience || [])
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(e.role)} — ${esc(e.company)}</span>
          <span class="entry-period">${icon("calendar", "#999")}${esc(e.period)}</span>
        </div>
        <div class="entry-sub">${icon("pin", "#999")}${esc(e.location)}</div>
        ${e.description ? `<p>${esc(e.description)}</p>` : ""}
        ${
          e.highlights && e.highlights.length
            ? `<ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
            : ""
        }
      </div>`
    )
    .join("");

  // Formazione: layout impilato (nella colonna stretta il flex farebbe spezzare il titolo).
  const education = (data.education || [])
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-title">${esc(e.degree)}</div>
        <div class="entry-sub">${esc(e.institution)}</div>
        <div class="entry-meta">${icon("calendar", "#999")}${esc(e.period)}</div>
        <div class="entry-meta">${icon("pin", "#999")}${esc(e.location)}</div>
        ${e.description ? `<p>${esc(e.description)}</p>` : ""}
      </div>`
    )
    .join("");

  const skills = (data.skills || [])
    .map(
      (s) =>
        `<div class="skill-row"><span class="skill-cat">${esc(s.category)}</span><br>${s.items
          .map(esc)
          .join(", ")}</div>`
    )
    .join("");

  const projects = (data.projects || [])
    .map(
      (pr) => `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${esc(pr.name)}</span>
          ${pr.tech ? `<span class="entry-period">${esc(pr.tech)}</span>` : ""}
        </div>
        ${
          pr.highlights && pr.highlights.length
            ? `<ul>${pr.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
            : ""
        }
      </div>`
    )
    .join("");

  const languages = (data.languages || [])
    .map((l) => `${esc(l.name)} — ${esc(l.level)}`)
    .join(", ");

  const softSkills = (data.softSkills || []).map(esc).join(", ");

  const interests = (data.interests || [])
    .map((i) => `<li>${esc(i)}</li>`)
    .join("");

  // Certificazioni: solo il badge, cliccabile, che apre il PDF online del certificato.
  const certBadges = await Promise.all(
    (data.certifications || []).map(async (c) => {
      const badge = await loadImageDataUri(c.badge);
      if (!badge) return "";
      const href = onlineUrl(c.pdf);
      return `<a class="cert-badge" href="${href}" title="${esc(c.name)}"><img src="${badge}" alt="${esc(c.name)}" /></a>`;
    })
  );
  const certs = certBadges.join("");

  const links = (p.links || [])
    .filter((l) => /^https?:/i.test(l.url))
    .map(
      (l) =>
        `<span class="ci">${icon("linkedin")}${esc(l.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</span>`
    )
    .join("");

  return `<!doctype html>
  <html lang="${lang}">
  <head><meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; color: #1c2029; font-size: 9.5pt; line-height: 1.4; margin: 0; }

    header { display: flex; justify-content: space-between; align-items: center; gap: 18px;
             border-bottom: 2px solid #3b6fd4; padding-bottom: 10px; margin-bottom: 14px; }
    h1 { font-size: 22pt; margin: 0 0 2px; letter-spacing: 0.5px; }
    .headline { color: #3b6fd4; font-size: 12pt; margin: 0 0 6px; }
    .contact { display: flex; flex-wrap: wrap; gap: 4px 16px; color: #555; font-size: 9pt; }
    .ci { display: inline-flex; align-items: center; white-space: nowrap; }
    .photo { width: 92px; height: 92px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e6ee; flex: none; }

    .icon { width: 1.05em; height: 1.05em; vertical-align: -0.16em; margin-right: 5px; flex: none; }

    .columns { display: flex; gap: 24px; align-items: flex-start; }
    .col-left { width: 33%; }
    .col-right { flex: 1; }

    h2 { font-size: 10.5pt; color: #3b6fd4; text-transform: uppercase; letter-spacing: 0.8px;
         margin: 0 0 6px; border-bottom: 1px solid #d8dde6; padding-bottom: 3px; }
    .block { margin-bottom: 12px; }

    .entry { margin-bottom: 8px; }
    .entry-head { display: flex; justify-content: space-between; gap: 12px; }
    .entry-title { font-weight: 700; }
    .entry-period { color: #777; font-size: 8.5pt; white-space: nowrap; display: inline-flex; align-items: center; }
    .entry-sub { color: #666; font-size: 9pt; }
    .entry-meta { color: #777; font-size: 8.5pt; }
    p { margin: 3px 0; }
    ul { margin: 4px 0; padding-left: 16px; }
    li { margin: 1px 0; }
    .skill-row { margin: 5px 0; }
    .skill-cat { font-weight: 700; }
    .cert-badges { display: flex; flex-wrap: wrap; gap: 10px; }
    .cert-badge { display: inline-block; line-height: 0; }
    .cert-badge img { width: 68px; height: 68px; object-fit: contain; }
  </style></head>
  <body>
    <header>
      <div class="header-main">
        <h1>${esc(p.name)}</h1>
        <div class="headline">${esc(p.headline)}</div>
        <div class="contact">
          ${p.email ? `<span class="ci">${icon("mail")}${esc(p.email)}</span>` : ""}
          ${p.phone ? `<span class="ci">${icon("phone")}${esc(p.phone)}</span>` : ""}
          ${p.location ? `<span class="ci">${icon("pin")}${esc(p.location)}</span>` : ""}
          ${links}
        </div>
      </div>
      ${photo ? `<img class="photo" src="${photo}" alt="${esc(p.name)}" />` : ""}
    </header>

    <div class="columns">
      <aside class="col-left">
        <div class="block"><h2>${L.skills}</h2>${skills}</div>
        ${languages ? `<div class="block"><h2>${L.languages}</h2><div>${languages}</div></div>` : ""}
        ${softSkills ? `<div class="block"><h2>${L.softSkills}</h2><div>${softSkills}</div></div>` : ""}
        <div class="block"><h2>${L.education}</h2>${education}</div>
        ${certs ? `<div class="block"><h2>${L.certifications}</h2><div class="cert-badges">${certs}</div></div>` : ""}
      </aside>

      <main class="col-right">
        ${p.summary ? `<div class="block"><h2>${L.summary}</h2><p>${esc(p.summary)}</p></div>` : ""}
        <div class="block"><h2>${L.experience}</h2>${experience}</div>
        ${projects ? `<div class="block"><h2>${L.projects}</h2>${projects}</div>` : ""}
        ${interests ? `<div class="block"><h2>${L.interests}</h2><ul>${interests}</ul></div>` : ""}
      </main>
    </div>
  </body></html>`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const t of TARGETS) {
    const raw = await readFile(resolve(root, t.data), "utf8");
    const data = JSON.parse(raw);
    const photo = await loadImageDataUri(data.profile && data.profile.photo);
    const html = await renderHtml(data, t.lang, photo);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const outPath = resolve(outDir, t.out);
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });
    await page.close();
    console.log(`✓ Generato ${t.out}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
