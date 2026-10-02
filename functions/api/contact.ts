/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * 1. Valida i campi del form (nome, agenzia, email, telefono, messaggio, privacy).
 * 2. Controlla l'honeypot (`website`): se compilato, risponde ok senza fare nulla.
 * 3. Invia l'email con Resend (RESEND_API_KEY, CONTACT_TO, CONTACT_FROM).
 * 4. Se il binding KV `KV_CONTACTS` è configurato, salva sempre una copia (fallback).
 *
 * Risponde in JSON se la richiesta ha `Accept: application/json` (fetch dal sito),
 * altrimenti reindirizza a /grazie (invio senza JavaScript).
 */
interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  KV_CONTACTS?: KVNamespace;
}

interface ContactPayload {
  name: string;
  agency: string;
  email: string;
  phone: string;
  message: string;
  collab: boolean;
  privacy: boolean;
}

const MAX = { name: 120, agency: 160, email: 200, phone: 40, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9 ().-]{6,20}$/;

function clean(v: FormDataEntryValue | null, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function validate(fd: FormData): { ok: true; data: ContactPayload } | { ok: false; errors: Record<string, string> } {
  const data: ContactPayload = {
    name: clean(fd.get('name'), MAX.name),
    agency: clean(fd.get('agency'), MAX.agency),
    email: clean(fd.get('email'), MAX.email),
    phone: clean(fd.get('phone'), MAX.phone),
    message: clean(fd.get('message'), MAX.message),
    collab: fd.get('collab') === '1',
    privacy: fd.get('privacy') === '1',
  };
  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = 'Inserisci il tuo nome.';
  if (data.agency.length < 2) errors.agency = "Inserisci il nome dell'agenzia.";
  if (!EMAIL_RE.test(data.email)) errors.email = 'Inserisci un indirizzo email valido.';
  if (!PHONE_RE.test(data.phone)) errors.phone = 'Inserisci un numero di telefono valido.';
  if (data.message.length < 8) errors.message = 'Scrivi almeno due parole.';
  if (!data.privacy) errors.privacy = 'Serve il consenso per poterti ricontattare.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

async function sendWithResend(env: Env, d: ContactPayload, meta: { ip: string; ua: string }): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) return false;
  const from = env.CONTACT_FROM || 'Assicurapp <onboarding@resend.dev>';
  const subject = `${d.collab ? '[Collaborazione] ' : '[Demo] '}${d.agency} — ${d.name}`;
  const rows = [
    ['Nome', d.name],
    ['Agenzia', d.agency],
    ['Email', d.email],
    ['Telefono', d.phone],
    ['Collaborazione', d.collab ? 'Sì' : 'No'],
    ['Messaggio', d.message],
    ['IP', meta.ip],
    ['User agent', meta.ua],
  ];
  const html = `<h2 style="font-family:sans-serif">Nuova richiesta dal sito</h2>
<table style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#475569;vertical-align:top"><b>${k}</b></td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
    )
    .join('')}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: env.CONTACT_TO.split(',').map((s) => s.trim()),
      reply_to: d.email,
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) console.error('Resend: risposta', res.status, await res.text());
  return res.ok;
}

async function saveToKv(env: Env, d: ContactPayload, meta: { ip: string; ua: string }, emailed: boolean) {
  if (!env.KV_CONTACTS) return false;
  const id = `${new Date().toISOString()}_${crypto.randomUUID()}`;
  await env.KV_CONTACTS.put(id, JSON.stringify({ ...d, ...meta, emailed, receivedAt: new Date().toISOString() }), {
    metadata: { agency: d.agency, email: d.email, emailed },
  });
  return true;
}

function wantsJson(req: Request) {
  return (req.headers.get('accept') || '').includes('application/json');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Accetta solo invii dal sito stesso
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Honeypot: i bot lo compilano, gli umani no. Risposta "ok" per non dare indizi.
  if (clean(fd.get('website'), 200)) {
    return wantsJson(request) ? json({ ok: true }) : Response.redirect(new URL('/grazie', request.url).toString(), 303);
  }

  const v = validate(fd);
  if (!v.ok) {
    return wantsJson(request)
      ? json({ ok: false, error: 'validation', errors: v.errors }, 422)
      : Response.redirect(new URL('/?errore=modulo#contatti', request.url).toString(), 303);
  }

  const meta = {
    ip: request.headers.get('cf-connecting-ip') || '',
    ua: (request.headers.get('user-agent') || '').slice(0, 300),
  };

  let emailed = false;
  try {
    emailed = await sendWithResend(env, v.data, meta);
  } catch (e) {
    console.error('Resend: invio fallito', e);
  }
  let stored = false;
  try {
    stored = await saveToKv(env, v.data, meta, emailed);
  } catch (e) {
    console.error('KV: salvataggio fallito', e);
  }

  if (!emailed && !stored) {
    return wantsJson(request)
      ? json({ ok: false, error: 'not_configured' }, 500)
      : Response.redirect(new URL('/?errore=invio#contatti', request.url).toString(), 303);
  }

  return wantsJson(request) ? json({ ok: true, emailed, stored }) : Response.redirect(new URL('/grazie', request.url).toString(), 303);
};

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'POST') return new Response(null, { status: 500 });
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
};
