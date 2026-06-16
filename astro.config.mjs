// @ts-check
import { defineConfig } from 'astro/config';

// Sito ospitato su GitHub Pages come "project page".
// site  = origine pubblica del tuo account GitHub Pages
// base  = nome della repository (serve perché l'URL è /personal-portfolio)
//
// Quando aggiungerai un dominio custom, imposta:
//   site: 'https://tuodominio.com'
//   base: '/'              (oppure rimuovi del tutto la riga base)
export default defineConfig({
  site: 'https://lorenzosegaliniatex.github.io',
  base: '/personal-portfolio',
});
