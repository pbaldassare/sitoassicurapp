# Assicurapp — sito vetrina

Sito statico costruito con [Astro](https://astro.build) 7 e Tailwind CSS 4, pensato per il deploy su **Cloudflare Pages**.
Il modulo di contatto è gestito da una Pages Function (`functions/api/contact.ts`) che invia email con Resend
e, se configurato, salva una copia in Cloudflare KV.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm install` | installa le dipendenze |
| `npm run dev` | server di sviluppo su `http://localhost:4321` (solo il sito, senza la function) |
| `npm run build` | build statica in `dist/` |
| `npm run preview` | anteprima della build |
| `npm run pages:dev` | build + `wrangler pages dev dist`: sito **e** function `/api/contact` in locale |
| `npm run brand:build` | rigenera logo, favicon, icone e immagine OG in `public/brand/` (su Windows/macOS: `CHROMIUM_PATH=<percorso di Chrome>`) |
| `npm run screenshots` | screenshot desktop/mobile di ogni sezione in `docs/screenshots/` |
| `npm run check` | controllo tipi Astro/TypeScript |

Richiede Node 20 o superiore.

## Struttura

```
src/
  content/site.it.json   ← TUTTI i testi del sito (vedi "Dove cambiare i testi")
  components/            ← una sezione = un componente (Hero, Rates, Collab, Contact, …)
  layouts/Base.astro     ← head, SEO, Open Graph, JSON-LD, header/footer, animazioni di entrata
  pages/                 ← index, privacy, grazie, 404
  styles/tokens.css      ← design token (@theme): colori, tipografia, spaziature
  styles/global.css      ← base, componenti (.btn, .card, .field…), motion
public/
  brand/                 ← logo, favicon, OG image (generati da scripts/build-brand.mjs)
  robots.txt, _headers   ← SEO e header di sicurezza/cache per Cloudflare
functions/api/contact.ts ← Pages Function del modulo di contatto
docs/
  brand-guidelines.md    ← voce, palette, tipografia, regole del logo
  logo-alternative/      ← variante B del logo (non usata)
  screenshots/           ← output di `npm run screenshots`
scripts/                 ← build-brand.mjs, screenshots.mjs, font per il logo
```

## Deploy su Cloudflare Pages

1. Collega il repository a Cloudflare Pages (**Workers & Pages → Create → Pages → Connect to Git**).
2. Impostazioni di build:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 20 o superiore (variabile `NODE_VERSION=20` se serve)
3. Le Pages Functions in `functions/` vengono pubblicate automaticamente insieme al sito.
4. Aggiungi le variabili d'ambiente (sotto) in **Settings → Environment variables**, per Production e Preview.
5. Dopo il primo deploy, imposta il dominio in **Custom domains** e aggiorna `site` in `astro.config.mjs`
   (serve per sitemap, canonical e Open Graph) e l'URL della sitemap in `public/robots.txt`.

### Variabili d'ambiente

| Variabile | Obbligatoria | Descrizione |
| --- | --- | --- |
| `RESEND_API_KEY` | sì (per l'invio email) | chiave API di [Resend](https://resend.com) |
| `CONTACT_TO` | sì | destinatario delle richieste; più indirizzi separati da virgola |
| `CONTACT_FROM` | consigliata | mittente, es. `Assicurapp <noreply@tuodominio.it>`; il dominio va verificato su Resend. Se assente usa `onboarding@resend.dev` (solo per test) |
| `KV_CONTACTS` | no | **binding KV** (Settings → Functions → KV namespace bindings). Se presente, ogni richiesta viene salvata anche in KV: funziona da fallback se Resend non è configurato o fallisce |

Se né Resend né KV sono configurati, la function risponde con errore e il sito mostra il messaggio di errore inline.

### Test locale della function

```sh
cp .dev.vars.example .dev.vars   # inserisci la tua chiave Resend
npm run build
npm run pages:dev                # http://localhost:8788
```

Per provare anche il fallback KV in locale aggiungi `--kv KV_CONTACTS` al comando `pages:dev` (KV simulato in memoria).

## Dove cambiare i testi

Tutti i testi sono in **`src/content/site.it.json`**, divisi per sezione (`hero`, `trust`, `problem`, `features`, `rates`,
`collab`, `onboarding`, `faq`, `contact`, `footer`, `privacy`, `thanks`). I componenti leggono da lì: puoi cambiare
titoli, elenchi, compagnie, FAQ senza toccare il markup. Dopo la modifica: `npm run build`.

- Compagnie: `rates.base` e `rates.convention` (le tessere e il marquee dell'hero si aggiornano da soli).
- Blocchi funzionalità: `features.blocks` (icona tra quelle in `src/components/Icon.astro`).
- Voci di menu: `nav.items`.

## Dove cambiare i placeholder societari

Cerca `placeholder` in `src/content/site.it.json`. I campi da compilare:

| Chiave | Contenuto |
| --- | --- |
| `footer.legal`, `footer.copyright` | ragione sociale, P.IVA, sede |
| `organization.*` | ragione sociale, email, telefono, sede (finiscono nel JSON-LD `Organization`) |
| `contact.email` | email mostrata nel messaggio di errore del form (`mailto:`) |
| `privacy.updated` | data dell'ultimo aggiornamento |
| `privacy.sections[*]` | titolare, sede, P.IVA, email privacy, PEC, periodo di conservazione, elenco responsabili |

Altri valori da confermare fuori dal JSON:

- `site` in `astro.config.mjs` e l'URL in `public/robots.txt` (dominio definitivo).
- `CONTACT_TO` / `CONTACT_FROM` nelle variabili d'ambiente.

## Privacy e analytics

Nessun cookie e nessun tracker di terze parti. Se servono statistiche, abilita **Cloudflare Web Analytics** dal pannello
Pages (Settings → Web Analytics): non usa cookie e non richiede banner.

Il font (Plus Jakarta Sans 400–700, solo latin) è servito dal sito tramite `@fontsource/plus-jakarta-sans`: niente
connessioni a Google Fonts. Il brief indicava Google Fonts, ma il suo CSS bloccava il rendering e teneva Lighthouse
mobile a 83.

## SEO, AEO e GEO

Il sito è scritto per essere trovato dai motori di ricerca, citato dai motori di risposta e letto dai modelli generativi.

- **Title e description** con le parole chiave di ricerca (preventivi RC Auto multicompagnia, agenzie e broker) e numeri reali (20 compagnie).
- **H1 e H2 descrittivi**: ogni titolo di sezione dice di cosa parla e nomina Assicurapp o il prodotto.
- **Blocco "Cos'è Assicurapp"** (`#cos-e`): una definizione in un paragrafo, autosufficiente e citabile, più sei fatti chiave in un `<dl>`.
  È il testo che un motore di risposta può riprendere così com'è.
- **FAQ** con 15 domande: la risposta sta nella prima frase. Include le domande definitorie (cos'è, per chi, quali compagnie, come funziona la targa, cosa sono tariffa/convenzione/istanza).
- **Dati strutturati** collegati tra loro con `@id`: `Organization`, `WebSite`, `SoftwareApplication` (con `abstract` e `keywords`), `FAQPage`, `HowTo` per i sei passi di attivazione.
- **`/llms.txt`**: riassunto in testo semplice per i crawler dei modelli generativi, generato a build dagli stessi contenuti di `site.it.json` (`src/pages/llms.txt.ts`).
- **`robots.txt`**: consenso esplicito ai crawler di OpenAI, Anthropic, Perplexity, Google e Apple; `/grazie` e `/api/` esclusi. Sitemap con `lastmod`.

Tutti i testi restano in `src/content/site.it.json` (chiavi `meta`, `about`, `faq`). Nessun numero o cliente inventato: solo i fatti del brief.

## Prestazioni e sicurezza

- Lighthouse mobile (build locale): Performance 99, Accessibilità 100, Best practices 100, SEO 100. LCP 1,6 s, CLS 0.
- `public/_headers`: CSP restrittiva (solo risorse del sito), HSTS, `X-Frame-Options`, cache lunga sugli asset con hash
  e di una settimana su `/brand/*`, che non ha hash nel nome.
- `/api/contact` rifiuta gli invii con `Origin` di un altro dominio e scrive nei log di Cloudflare gli errori di Resend e KV.
- Senza JavaScript il form usa la validazione nativa del browser; con JavaScript gli errori compaiono accanto ai campi.

## Brand

Regole in `docs/brand-guidelines.md`. Il logo è un SVG originale generato in codice da `scripts/build-brand.mjs`
(testo convertito in path da Plus Jakarta Sans Bold, scudo con spunta disegnato geometricamente).
La penultima "p" resta intera; l'asta dell'ultima "p" scende sotto la linea di base e diventa lo scudo.
