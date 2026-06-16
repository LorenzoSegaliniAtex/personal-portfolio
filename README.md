# Portfolio personale — Lorenzo Segalini

Sito statico realizzato con [Astro](https://astro.build) e ospitato su **GitHub Pages**.
Include il CV, le certificazioni con badge cliccabili che aprono il PDF del certificato,
e una GitHub Action che genera il CV in PDF (IT/EN) come artifact scaricabile.

🔗 URL pubblico: **https://lorenzosegaliniatex.github.io/personal-portfolio**

---

## Struttura del progetto

```
src/
  data/
    portfolio.json        ← I TUOI CONTENUTI (italiano) — modifica qui il CV
    portfolio.en.json     ← Versione inglese (per il PDF EN) — da tradurre
  layouts/Layout.astro    ← struttura HTML/meta
  pages/index.astro       ← layout della pagina
  styles/global.css       ← stile/tema
public/
  assets/
    profile.svg           ← sostituisci con la tua foto (profile.jpg + aggiorna il path nel JSON)
    badges/               ← immagini dei badge delle certificazioni
    certificates/         ← PDF dei certificati
    cv/                   ← PDF del CV generati dalla Action
scripts/
  generate-cv.mjs         ← genera i PDF del CV
.github/workflows/
  deploy.yml              ← build + deploy del sito su Pages
  cv.yml                  ← genera i CV PDF come artifact
```

## Come aggiornare i contenuti

Tutto il CV vive in **`src/data/portfolio.json`** (e `portfolio.en.json` per l'inglese).
Modifica i campi profilo, esperienza, formazione, competenze e certificazioni: il sito si
aggiorna da solo. Non serve toccare il codice.

### Aggiungere una certificazione con badge + PDF

1. Metti l'immagine del badge in `public/assets/badges/` (es. `aws-cloud.png`).
2. Metti il PDF del certificato in `public/assets/certificates/` (es. `aws-cloud.pdf`).
3. Aggiungi una voce in `certifications` dentro `portfolio.json`:

```json
{
  "name": "AWS Certified Cloud Practitioner",
  "issuer": "Amazon Web Services",
  "date": "Marzo 2025",
  "badge": "/assets/badges/aws-cloud.png",
  "pdf": "/assets/certificates/aws-cloud.pdf",
  "verifyUrl": "https://..."
}
```

Cliccando il badge sul sito si apre il PDF del certificato.

## Sviluppo in locale

```bash
npm install
npm run dev        # http://localhost:4321/personal-portfolio
npm run build      # build di produzione in dist/
```

## Generare il CV in PDF

### In automatico (GitHub Action)
- Vai nella tab **Actions → "Genera CV PDF (artifact)" → Run workflow**.
- Al termine, scarica l'artifact `cv-pdf` (contiene i due PDF) dalla pagina del run.
- I PDF vengono anche rigenerati a ogni deploy, così i pulsanti **CV (IT) ↓ / CV (EN) ↓**
  sul sito scaricano sempre la versione aggiornata.

### In locale
```bash
cd scripts
npm install
npm run build:cv   # crea i PDF in public/assets/cv/
```

## Pubblicazione (una sola volta)

1. Su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Fai push su `main`: il workflow `deploy.yml` builda e pubblica il sito.

## Aggiungere un dominio custom (in futuro)

1. Compra un dominio da un registrar (es. Cloudflare, Namecheap).
2. In `astro.config.mjs` imposta `site: 'https://tuodominio.com'` e `base: '/'`.
3. Crea il file `public/CNAME` contenente solo `tuodominio.com`.
4. Su GitHub: **Settings → Pages → Custom domain**, inserisci il dominio.
5. Dal registrar configura i DNS:
   - dominio apex: 4 record `A` verso gli IP di GitHub Pages
     (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)
   - oppure sottodominio `www`: un record `CNAME` verso `lorenzosegaliniatex.github.io`.
6. Attiva **Enforce HTTPS** (certificato gratuito automatico).
