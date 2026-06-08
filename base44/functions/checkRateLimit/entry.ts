import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { identifier, type } = body; // type: 'ip' ou 'phone'

    if (!identifier || !type) {
      return Response.json({ error: "identifier et type requis" }, { status: 400 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const rateLimits = await base44.asServiceRole.entities.RateLimit.filter({
      identifier,
      identifier_type: type
    });

    const rateLimit = rateLimits[0];

    if (!rateLimit) {
      return Response.json({ allowed: true, count: 0 });
    }

    const windowStart = new Date(rateLimit.window_start);
    const isOutdated = windowStart < twentyFourHoursAgo;

    if (isOutdated) {
      await base44.asServiceRole.entities.RateLimit.update(rateLimit.id, {
        count: 0,
        window_start: now.toISOString()
      });
      return Response.json({ allowed: true, count: 0 });
    }

    const maxAttempts = type === 'ip' ? 20 : 5;
    const allowed = rateLimit.count < maxAttempts;

    return Response.json({
      allowed,
      count: rateLimit.count,
      maxAttempts,
      remainingAttempts: Math.max(0, maxAttempts - rateLimit.count)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});