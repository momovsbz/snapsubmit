import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_OPERATORS = ['SFR', 'Bouygues', 'Orange'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { snapchat, telephone, operateur, turnstileToken, description, file_url, submitted_by_name } = await req.json();

    if (!snapchat || !telephone || !operateur) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 });
    }
    if (!VALID_OPERATORS.includes(operateur)) {
      return Response.json({ error: 'Opérateur invalide' }, { status: 400 });
    }
    const tel = String(telephone).replace(/\D/g, '');
    if (!/^(06|07)\d{8}$/.test(tel)) {
      return Response.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }
    const snap = String(snapchat).trim();
    if (!/^[a-zA-Z0-9_.-]+$/.test(snap) || snap.length < 1 || snap.length > 30) {
      return Response.json({ error: 'Nom Snapchat invalide' }, { status: 400 });
    }

    let ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             'unknown';

    // ---- Cloudflare Turnstile ----
    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!turnstileToken) {
      return Response.json({ error: "Vérification anti-bot requise" }, { status: 403 });
    }
    try {
      const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: turnstileSecret || "", response: turnstileToken, remoteip: ip })
      });
      const tsData = await tsRes.json();
      if (!tsData.success) {
        return Response.json({ error: "Vérification anti-bot échouée" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Vérification anti-bot échouée" }, { status: 403 });
    }

    // ---- Blacklist IP + telephone ----
    if (ip !== 'unknown') {
      const ipBl = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: ip, type: 'ip' });
      if (ipBl.length > 0) return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const phoneBl = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: tel, type: 'phone' });
    if (phoneBl.length > 0) return Response.json({ error: 'Accès refusé' }, { status: 403 });

    // ---- Navigateur / appareil ----
    const userAgent = req.headers.get('user-agent') || '';
    let browser = 'Inconnu';
    let device = '💻 PC';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = '📱 Téléphone';
    else if (userAgent.includes('iPad')) device = '📱 Tablette';

    // ---- Geolocalisation ----
    let country = 'Inconnue';
    try {
      const geoRes = await base44.functions.invoke('geolocateIP', { ip });
      if (geoRes?.data) country = geoRes.data.country || 'Inconnue';
    } catch {}

    // ---- Numero de file (max + 1, anti-collision) ----
    const last = await base44.asServiceRole.entities.QueueSubmission.list('-queue_number', 1);
    const nextNum = (last[0]?.queue_number || 0) + 1;

    const sub = await base44.asServiceRole.entities.QueueSubmission.create({
      queue_number: nextNum,
      snapchat: snap,
      telephone: tel,
      operateur,
      description: description || '',
      file_url: file_url || '',
      ip_address: ip,
      country,
      browser,
      device_type: device,
      status: 'waiting',
      submitted_by_name: submitted_by_name || '',
      submitted_by_contact: '',
    });

    await base44.asServiceRole.entities.QueueLog.create({
      submission_id: sub.id,
      queue_number: nextNum,
      action: 'created',
      actor_name: submitted_by_name || 'Anonyme',
      actor_role: 'user',
      timestamp: new Date().toISOString(),
    });

    return Response.json({ ok: true, submissionId: sub.id, queueNumber: nextNum });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});