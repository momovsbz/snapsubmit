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

    const cleanPhone = telephone.replace(/\D/g, '');
    if (cleanPhone.length < 3) {
      return Response.json({ error: 'Numéro invalide' }, { status: 400 });
    }

    const prefix = cleanPhone.slice(0, 3);
    
    // Find actual operator from local prefixes
    let actualOperator = null;
    for (const [op, prefixes] of Object.entries(operatorPrefixes)) {
      if (prefixes.includes(prefix)) {
        actualOperator = op;
        break;
      }
    }

    // Check with IPQualityScore API
    const apiKey = Deno.env.get("IPQUALITYSCORE_KEY");
    let carrierLookup = null;
    
    if (apiKey) {
      try {
        const phoneFormatted = `33${cleanPhone.slice(1)}`;
        const response = await fetch(`https://api.ipqualityscore.com/api/phone/validate/?phone=${phoneFormatted}&country=FR&strictness=1&api_key=${apiKey}`);
        const data = await response.json();
        
        if (data.carrier) {
          carrierLookup = data.carrier;
        }
      } catch (e) {
        // Fallback to local check if API fails
      }
    }

    const detectedOperator = carrierLookup || actualOperator;
    const isValid = detectedOperator === operateur;

    return Response.json({
      isValid,
      detectedOperator,
      selectedOperator: operateur,
      prefix,
      source: carrierLookup ? 'IPQualityScore' : 'local'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});