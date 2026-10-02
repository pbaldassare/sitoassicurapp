/**
 * /llms.txt — riassunto del sito in testo semplice per i crawler dei modelli generativi
 * (convenzione llmstxt.org). Generato dagli stessi contenuti della pagina, così resta allineato.
 */
import type { APIRoute } from 'astro';
import site from '@/content/site.it.json';

export const GET: APIRoute = ({ site: base }) => {
  const url = (base ?? new URL('https://assicurapp.it')).toString().replace(/\/$/, '');
  const a = site.about;
  const lines = [
    `# ${site.meta.siteName}`,
    '',
    `> ${a.definition}`,
    '',
    `Sito: ${url}`,
    `Lingua: italiano. Pubblico: agenzie e broker assicurativi in Italia.`,
    '',
    '## Fatti chiave',
    ...a.facts.map((f) => `- ${f.term}: ${f.detail}`),
    '',
    '## Funzionalità',
    ...site.features.blocks.flatMap((b) => [`### ${b.title}`, ...b.items.map((i) => `- ${i}`), '']),
    '## Compagnie interrogabili',
    `- Tariffe base (${site.rates.base.length}): ${site.rates.base.join(', ')}`,
    `- Tariffe in convenzione (${site.rates.convention.length}): ${site.rates.convention.join(', ')}`,
    `- Nota: ${site.rates.note}`,
    '',
    '## Collaborazioni (tre livelli)',
    ...site.collab.levels.map((l) => `${l.n}. ${l.name}: ${l.text}`),
    '',
    '## Come si parte',
    ...site.onboarding.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.text}`),
    site.onboarding.closing,
    '',
    '## Domande frequenti',
    ...site.faq.items.flatMap((f) => [`### ${f.q}`, f.a, '']),
    '## Pagine',
    `- [Home](${url}/): sezioni #cos-e, #funzionalita, #tariffe, #collaborazioni, #come-si-parte, #faq, #contatti`,
    `- [Privacy](${url}/privacy)`,
    '',
    `## Contatti`,
    `Richiesta demo o proposta di collaborazione dal modulo in ${url}/#contatti.`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
