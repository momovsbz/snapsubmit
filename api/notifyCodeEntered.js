import { ok, fail } from './_helpers.js';

export default function handler(req) {
  if (req.method !== 'POST') return fail(405, 'Méthode non autorisée');
  return ok({ ok: true });
}
