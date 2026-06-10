import { ok, fail } from './_helpers.js';

export default async function handler(req) {
  if (req.method !== 'POST') return fail(405, 'Méthode non autorisée');
  const { password } = await req.json().catch(() => ({}));
  if (password === (process.env.ADMIN_PASSWORD || 'admin')) {
    return ok({ ok: true, data: { ok: true } });
  }
  return ok({ ok: false, data: { ok: false, attemptsLeft: 3 } });
}
