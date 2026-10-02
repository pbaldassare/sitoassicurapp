// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Dominio pubblico del sito: cambialo quando il dominio definitivo è attivo.
// Serve per sitemap.xml, canonical, Open Graph e JSON-LD.
export default defineConfig({
  site: 'https://assicurapp.it',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  integrations: [sitemap({ lastmod: new Date(), filter: (page) => !page.endsWith('/grazie') })],
  vite: { plugins: [tailwindcss()] },
});
