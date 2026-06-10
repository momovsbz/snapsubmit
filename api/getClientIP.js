import { ok, fail } from './_helpers.js';

export default function handler(req) {
  if (req.method !== 'GET' && req.method !== 'POST') return fail(405, 'Méthode non autorisée');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return ok({ ok: true, data: { ip, isVPN: false, isBlacklisted: false } });
}
