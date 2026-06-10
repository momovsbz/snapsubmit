import { fail, getSubmissionById, ok } from './_helpers.js';

export default async function handler(req) {
  if (req.method !== 'POST') return fail(405, 'Méthode non autorisée');

  const { submissionId } = await req.json().catch(() => ({}));
  if (!submissionId) return fail(400, 'Missing submissionId');

  const submission = getSubmissionById(submissionId);
  return ok({ ok: true, data: { status: submission?.status || 'pending' } });
}
