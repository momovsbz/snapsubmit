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
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const rateLimits = await base44.asServiceRole.entities.RateLimit.filter({
      identifier,
      identifier_type: type
    });

    const rateLimit = rateLimits[0];

    if (!rateLimit) {
      return Response.json({ allowed: true, count: 0, waitTime: 0 });
    }

    // Check if user exceeded 2 submissions per phone
    if (type === 'phone' && rateLimit.count >= 2) {
      return Response.json({ allowed: false, count: 2, maxAttempts: 2, remainingAttempts: 0, message: "Limite de 2 demandes atteinte" });
    }

    // Check if 10 minutes have passed since last submission
    const lastSubmission = new Date(rateLimit.last_submission);
    const waitTime = Math.ceil((tenMinutesAgo - lastSubmission) / 1000 / 60);
    
    if (lastSubmission > tenMinutesAgo && type === 'phone') {
      const minutesLeft = Math.ceil((10 * 60 * 1000 - (now - lastSubmission)) / 1000 / 60);
      return Response.json({ allowed: false, count: rateLimit.count, waitTime: minutesLeft, message: `Attendre ${minutesLeft} minutes avant la prochaine soumission` });
    }

    return Response.json({
      allowed: true,
      count: rateLimit.count,
      maxAttempts: 2,
      remainingAttempts: Math.max(0, 2 - rateLimit.count)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});