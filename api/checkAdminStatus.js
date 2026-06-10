import { ok } from './_helpers.js';

export default function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  return ok({ ok: true, data: { is_inactive: false } });
}
