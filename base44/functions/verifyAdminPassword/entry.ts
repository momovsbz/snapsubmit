import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

// In-memory store: ip -> { count, firstAttempt }
const attempts = new Map();

function getClientIP(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

Deno.serve(async (req) => {
  try {
    const ip = getClientIP(req);
    const now = Date.now();

    // Check lockout
    const entry = attempts.get(ip);
    if (entry) {
      const elapsed = now - entry.firstAttempt;
      if (elapsed > LOCKOUT_MS) {
        attempts.delete(ip);
      } else if (entry.count >= MAX_ATTEMPTS) {
        const remaining = Math.ceil((LOCKOUT_MS - elapsed) / 60000);
        return Response.json({ ok: false, locked: true, remaining }, { status: 429 });
      }
    }

    const { password } = await req.json();

    if (!password) {
      return Response.json({ ok: false }, { status: 400 });
    }

    if (!ADMIN_PASSWORD) {
      return Response.json({ error: "ADMIN_PASSWORD secret not set" }, { status: 500 });
    }

    if (password !== ADMIN_PASSWORD) {
      // Record failed attempt
      const current = attempts.get(ip) || { count: 0, firstAttempt: now };
      attempts.set(ip, { count: current.count + 1, firstAttempt: current.firstAttempt });
      const attemptsLeft = MAX_ATTEMPTS - (current.count + 1);
      return Response.json({ ok: false, attemptsLeft: Math.max(0, attemptsLeft) }, { status: 401 });
    }

    // Success — clear attempts
    attempts.delete(ip);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});