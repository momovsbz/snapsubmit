import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

// In-memory store: ip -> { count, firstAttempt }
const attempts = new Map();

const IP_WHITELIST = ["184.144.152.184"];

function getClientIP(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

Deno.serve(async (req) => {
  try {
    // Read fresh per-request so it always matches the current secret value
    // (createBuyer reads fresh too — this keeps both functions consistent).
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    const ip = getClientIP(req);

    // Whitelisted IPs bypass rate limiting entirely
    if (IP_WHITELIST.includes(ip)) {
      const { password } = await req.json();
      if (password === ADMIN_PASSWORD) return Response.json({ ok: true });
      return Response.json({ ok: false, attemptsLeft: 5 }, { status: 401 });
    }
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
      const newCount = current.count + 1;
      attempts.set(ip, { count: newCount, firstAttempt: current.firstAttempt });
      const attemptsLeft = MAX_ATTEMPTS - newCount;

      // Blacklist permanent après 5 tentatives échouées
      if (newCount >= MAX_ATTEMPTS && ip !== "unknown") {
        try {
          const existing = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: ip, type: 'ip' });
          if (existing.length === 0) {
            await base44.asServiceRole.entities.BlacklistEntry.create({ value: ip, type: 'ip' });
          }
        } catch (e) {
          console.error("Blacklist insert failed:", e.message);
        }
      }

      return Response.json({ ok: false, attemptsLeft: Math.max(0, attemptsLeft) }, { status: 401 });
    }

    // Success — clear attempts
    attempts.delete(ip);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});