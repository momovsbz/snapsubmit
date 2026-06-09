import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Mapping des préfixes français par opérateur
const operatorPrefixes = {
  SFR: ['601', '602', '603', '604', '605', '630', '631', '632', '633', '634', '635', '636', '637', '638', '639', '701', '702', '703', '704', '705', '730', '731', '732', '733', '734', '735', '736', '737', '738', '739'],
  Orange: ['606', '607', '608', '609', '610', '611', '612', '613', '614', '615', '616', '617', '618', '619', '706', '707', '708', '709', '710', '711', '712', '713', '714', '715', '716', '717', '718', '719'],
  Bouygues: ['620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '720', '721', '722', '723', '724', '725', '726', '727', '728', '729']
};

Deno.serve(async (req) => {
  try {
    const { telephone, operateur } = await req.json();

    if (!telephone || !operateur) {
      return Response.json({ error: 'Téléphone et opérateur requis' }, { status: 400 });
    }

    // Extract first 3 digits
    const cleanPhone = telephone.replace(/\D/g, '');
    if (cleanPhone.length < 3) {
      return Response.json({ error: 'Numéro invalide' }, { status: 400 });
    }

    const prefix = cleanPhone.slice(0, 3);
    
    // Find actual operator
    let actualOperator = null;
    for (const [op, prefixes] of Object.entries(operatorPrefixes)) {
      if (prefixes.includes(prefix)) {
        actualOperator = op;
        break;
      }
    }

    // Check if selected operator matches actual operator
    const isValid = actualOperator === operateur;

    return Response.json({
      isValid,
      actualOperator,
      selectedOperator: operateur,
      prefix
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});