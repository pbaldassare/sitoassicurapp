# Assicurapp — Brand guidelines

Fonte di verità per voce, colori, tipografia e componenti del sito.
I valori sono sincronizzati in `src/styles/tokens.css` (Tailwind v4 `@theme`).

## 1. Posizionamento

Assicurapp è la piattaforma web per agenzie e broker assicurativi italiani.
Tre cose deve trasmettere ogni pagina, in quest'ordine:

1. **Semplice** — un accesso invece di un portale per compagnia.
2. **Intuitiva** — dalla targa al preventivo, dal preventivo alla polizza, senza cambiare strumento.
3. **Collaborativa** — convenzioni e istanze permettono a intermediari diversi di lavorare insieme.

Direzione visiva: **Minimalism & Swiss Style + Flat Design**. Griglia rigorosa, molto bianco, gerarchia tipografica netta,
nessun gradiente decorativo, nessun glassmorphism, nessuna emoji come icona.

## 2. Voce e tono

- Diretto, concreto, da collega a collega. **Dai del tu**.
- Frasi corte. Un'idea per frase.
- Ogni affermazione è qualcosa che la piattaforma fa davvero. Niente numeri, clienti o testimonianze inventati.
- Vietati: "rivoluzionario", "all-in-one", "soluzione innovativa", "leader", "smart".
- Social proof solo con fatti: 15 tariffe base, 5 in convenzione, ANIA, Stripe e bonifico.

Esempi:

| Non così | Così |
| --- | --- |
| La soluzione all-in-one per il tuo business | Preventivi, polizze e provvigioni. Un accesso solo. |
| Grazie alla nostra tecnologia innovativa… | Inserisci la targa: contraente e veicolo arrivano da ANIA. |

## 3. Logo

**Wordmark + segno.** La parola `assicurapp` in minuscolo, Plus Jakarta Sans 700, convertita in path.
Le due "p" finali perdono i discendenti: al loro posto, appeso alla linea di base, nasce uno **scudo verde con segno di spunta**.
Il resto della parola è navy `#1E3A8A`. Lo scudo funziona anche da solo (favicon, app icon).

File in `public/brand/` (generati da `npm run brand:build`, script `scripts/build-brand.mjs`):

| File | Uso |
| --- | --- |
| `logo.svg` | orizzontale a colori, su sfondo chiaro |
| `logo-white.svg` | su sfondo navy |
| `logo-mark.svg` | solo scudo con spunta |
| `favicon.svg`, `favicon-32.png` | favicon |
| `apple-touch-icon.png` | 180 px, sfondo navy |
| `og-image.png` | 1200×630, anteprima social |

Regole: area di rispetto pari all'altezza dello scudo su ogni lato; altezza minima 24 px per il wordmark, 16 px per il mark.
Non ruotare, non ricolorare (solo navy/bianco per la parola, verde per lo scudo), non aggiungere ombre.

Variante B (monogramma "A" a scudo con linea di percorso) in `docs/logo-alternative/`, non usata nel sito.

## 4. Palette

| Token | Hex | Uso |
| --- | --- | --- |
| `--color-navy-900` | `#0F172A` | testi, hero scuro, footer |
| `--color-navy-700` | `#1E3A8A` | primario: pulsanti, wordmark |
| `--color-blue-500` | `#3B82F6` | accento, link, focus ring, frecce nei diagrammi |
| `--color-green-500` | `#10B981` | conferme, "attivo", CTA secondaria, scudo del logo |
| `--color-slate-50` | `#F8FAFC` | sfondi sezione alternati |
| `--color-slate-200` | `#E2E8F0` | bordi |
| `--color-slate-600` | `#475569` | testo secondario |
| `--color-white` | `#FFFFFF` | sfondo base |

Tinte di supporto (derivate, solo per sfondi tenui): `blue-100 #DBEAFE`, `green-100 #D1FAE5`, `navy-800 #172554`, `slate-100/400`, `red-500/100` per gli errori.

Contrasto: tutte le coppie testo/sfondo usate rispettano AA (≥ 4.5:1 per il testo, ≥ 3:1 per testo grande e icone).
Sul navy usare bianco o `slate-400 #94A3B8` per il testo secondario. Sul verde `#10B981` usare testo navy-900, mai bianco su testo piccolo.

## 5. Tipografia

Famiglia unica: **Plus Jakarta Sans** (300/400/500/600/700) da Google Fonts, con fallback
`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`.

| Stile | Dimensione / interlinea | Peso | Note |
| --- | --- | --- | --- |
| Display | 56 / 64 | 700 | letter-spacing −0.02em, solo hero desktop |
| H1 | 44 / 52 | 700 | −0.02em |
| H2 | 32 / 40 | 700 | −0.02em (40/48 su desktop nelle sezioni) |
| H3 | 22 / 30 | 700 | −0.01em |
| Body | 17 / 28 | 400 | |
| Small | 14 / 20 | 400–500 | |
| Eyebrow | 13 / 20 | 600 | maiuscolo, +0.08em, con trattino verde |

Base 16 px, line-height minimo 1.5. Titoli con `text-wrap: balance`.

## 6. Spaziatura, forme, ombre

- Scala: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- Sezioni: padding verticale 96 px desktop, 64 px mobile. Contenitore max 1200 px, gutter 20/24/32 px.
- Raggi: 12 px sulle card, 999 px sui pulsanti e i badge.
- Ombre: una sola, soft, per le card in hover (`--shadow-card`). Mai ombre statiche.
- Bordi 1 px `slate-200`; tratteggiati per le tariffe in convenzione.

## 7. Icone

Lucide (o equivalenti a linea), 24 px, stroke 1.75, `currentColor`. Inline come SVG (componente `Icon.astro`).
Icone decorative con `aria-hidden`; pulsanti solo-icona sempre con `aria-label`.

## 8. Motion

- Entrata delle sezioni: fade + 12 px verso l'alto, 400 ms, ease-out (`--ease-out-soft`).
- Micro-feedback: 160 ms su hover/click (colore, bordo, freccia che scorre di 3 px).
- Hero: le quotazioni del mockup compaiono una alla volta; le tessere delle compagnie scorrono lentamente e si fermano in hover.
- Tutto disattivato con `prefers-reduced-motion: reduce`.

## 9. Componenti

- **Pulsanti**: primario navy pieno; outline navy; su navy: verde pieno (CTA principale) e outline bianco. Altezza ≥ 44 px.
- **Card**: bianco, bordo `slate-200`, raggio 12, ombra solo in hover.
- **Chip icona**: 44×44, sfondo `blue-100`, icona navy-700.
- **Form**: label sempre visibili, errori inline sotto il campo in rosso, focus ring blu a 3 px.
- **Accordion**: `<details>/<summary>` nativi, chevron che ruota.

## 10. Accessibilità (checklist pre-consegna)

- [x] Contrasto AA su tutte le coppie usate
- [x] Touch target ≥ 44 px su link di navigazione, pulsanti, filtri, checkbox
- [x] Nessuno scroll orizzontale a 375, 640, 768, 1024, 1280 px
- [x] Focus visibile (ring 3 px blu con offset)
- [x] Skip link, landmark (`header`, `main`, `footer`, `nav` con `aria-label`)
- [x] `prefers-reduced-motion` rispettato
- [x] Immagini/SVG informativi con `title`/`aria-label`, decorativi con `aria-hidden`
