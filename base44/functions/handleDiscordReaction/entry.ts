import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userId, emoji, submissionId } = body;

    if (!userId || !submissionId) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Only process ✅ emoji for sending code
    if (emoji !== '✅') {
      return Response.json({ ok: true });
    }

    // Get submission details
    const submission = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
    
    if (!submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Generate a simple code (you can customize this)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Send DM to user with the code
    try {
      // Create DM channel
      const dmRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient_id: userId
        })
      });

      if (dmRes.ok) {
        const dmData = await dmRes.json();
        const dmChannelId = dmData.id;

        // Send code in DM
        await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            content: `🎉 **Voici votre code Snapchat+**\n\n\`\`\`\n${code}\n\`\`\`\n\n**Détails:**\n• Utilisateur: @${submission.snapchat}\n• Numéro: ${submission.telephone}\n• Opérateur: ${submission.operateur}`
          })
        });

        // Update submission status
        await base44.asServiceRole.entities.Submission.update(submissionId, {
          status: 'code_ready'
        });

        return Response.json({ ok: true, code });
      } else {
        const error = await dmRes.text();
        console.error(`DM creation error: ${error}`);
        return Response.json({ error: "Failed to create DM" }, { status: 500 });
      }
    } catch (e) {
      console.error("DM send error:", e.message);
      return Response.json({ error: e.message }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});