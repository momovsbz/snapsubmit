import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { ip, telephone, submissionId } = await req.json();

    if (!ip && !telephone) {
      return Response.json({ error: 'IP ou téléphone requis' }, { status: 400 });
    }

    // Add to blacklist
    const entries = [];
    if (ip && ip !== 'Inconnue') {
      entries.push({ value: ip, type: 'ip' });
    }
    if (telephone) {
      entries.push({ value: telephone, type: 'phone' });
    }

    for (const entry of entries) {
      await base44.asServiceRole.entities.BlacklistEntry.create(entry);
    }

    // Log action
    if (submissionId) {
      await base44.asServiceRole.entities.ActionLog.create({
        submission_id: submissionId,
        action: 'rejected',
        details: { reason: 'Blacklist utilisateur' },
        timestamp: new Date().toISOString()
      });
    }

    return Response.json({ ok: true, blacklisted: entries.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});