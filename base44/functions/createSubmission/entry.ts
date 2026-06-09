import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { snapchat, telephone, operateur } = await req.json();

    if (!snapchat || !telephone || !operateur) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Get client IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // Check rate limit by IP (global limit)
    const ipRateLimits = await base44.asServiceRole.entities.RateLimit.filter({
      identifier: ip,
      identifier_type: 'ip'
    });

    const ipRateLimit = ipRateLimits[0];

    if (ipRateLimit) {
      // Check if user exceeded 2 submissions
      if (ipRateLimit.count >= 2) {
        return Response.json({ 
          error: 'Limite de 2 demandes atteinte',
          allowed: false 
        }, { status: 429 });
      }

      // Check if 10 minutes have passed since last submission
      const lastSubmission = new Date(ipRateLimit.last_submission);
      if (lastSubmission > tenMinutesAgo) {
        const minutesLeft = Math.ceil((10 * 60 * 1000 - (now - lastSubmission)) / 1000 / 60);
        return Response.json({ 
          error: `Attendre ${minutesLeft} minutes avant la prochaine soumission`,
          waitTime: minutesLeft,
          allowed: false 
        }, { status: 429 });
      }

      // Update rate limit
      await base44.asServiceRole.entities.RateLimit.update(ipRateLimit.id, {
        count: ipRateLimit.count + 1,
        last_submission: now.toISOString()
      });
    } else {
      // Create new rate limit entry
      await base44.asServiceRole.entities.RateLimit.create({
        identifier: ip,
        identifier_type: 'ip',
        count: 1,
        last_submission: now.toISOString(),
        window_start: now.toISOString()
      });
    }

    // Create submission
    const submission = await base44.asServiceRole.entities.Submission.create({
      snapchat,
      telephone,
      operateur,
      status: 'pending'
    });

    return Response.json({ ok: true, submissionId: submission.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});