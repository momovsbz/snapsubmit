export const STRINGS = {
  en: {
    workspace: "Client workspace",
    on: "On",
    activeQueue: "Active queue",
    myHistory: "My history",
    liveQueue: "Live queue",
    maskedHint: "Numbers stay masked until you claim them.",
    user: "USER",
    phone: "PHONE",
    operator: "OPERATOR",
    status: "STATUS",
    queued: "Queued",
    claimLock: "Claim & lock for me",
    revealHint: "The number and username will be revealed after claiming.",
    selectHint: "Select a number from the queue to claim it.",
    emptyQueue: "Queue empty — no submissions to claim.",
    logOut: "Log out",
    customer: "customer",
    lockedByYou: "Locked by you",
    code4: "Code 4 (Apple)",
    code6: "Code 6 (Xbox)",
    code6sfr: "Code 6 (SFR)",
    code6orange: "Code 6 (Orange)",
    wrong: "Wrong number",
    wait: "Make wait",
    blacklist: "Blacklist now",
    pending: "Pending",
    code_ready: "Code 4 sent",
    code6_ready: "Code 6 (Xbox)",
    code6sfr_ready: "Code 6 (SFR)",
    code6orange_ready: "Code 6 (Orange)",
    code_valid: "Validated",
    code_wrong: "Wrong number",
    code_expired: "Expired",
    waiting_queue: "Queued",
    noHistory: "No history yet",
    loginSub: "Buyer workspace — sign in",
    discord: "Discord username",
    password: "Password",
    signIn: "Sign in",
    oneDevice: "One device (IP) per account.",
    expiredErr: "Subscription expired",
  },
  fr: {
    workspace: "Espace client",
    on: "Actif",
    activeQueue: "File active",
    myHistory: "Mon historique",
    liveQueue: "File en direct",
    maskedHint: "Les numéros restent masqués jusqu'à réclamation.",
    user: "UTILISATEUR",
    phone: "TÉLÉPHONE",
    operator: "OPÉRATEUR",
    status: "STATUT",
    queued: "En file",
    claimLock: "Réclamer & verrouiller",
    revealHint: "Le numéro et le pseudo seront dévoilés après réclamation.",
    selectHint: "Sélectionnez un numéro dans la file pour le réclamer.",
    emptyQueue: "File vide — aucune soumission à réclamer.",
    logOut: "Déconnexion",
    customer: "client",
    lockedByYou: "Verrouillé par vous",
    code4: "Code 4 (Apple)",
    code6: "Code 6 (Xbox)",
    code6sfr: "Code 6 (SFR)",
    code6orange: "Code 6 (Orange)",
    wrong: "Mauvais numéro",
    wait: "Faire patienter",
    blacklist: "Blacklist instant",
    pending: "En attente",
    code_ready: "Code 4 envoyé",
    code6_ready: "Code 6 (Xbox)",
    code6sfr_ready: "Code 6 (SFR)",
    code6orange_ready: "Code 6 (Orange)",
    code_valid: "Validé",
    code_wrong: "Mauvais numéro",
    code_expired: "Expiré",
    waiting_queue: "En file",
    noHistory: "Aucun historique pour l'instant",
    loginSub: "Espace acheteur — connectez-vous",
    discord: "Pseudo Discord",
    password: "Mot de passe",
    signIn: "Se connecter",
    oneDevice: "Un seul appareil (IP) par compte.",
    expiredErr: "Abonnement expiré",
  },
};

export const getStoredLang = () => {
  try {
    return localStorage.getItem("buyerLang") || "en";
  } catch {
    return "en";
  }
};

export const setStoredLang = (l) => {
  try {
    localStorage.setItem("buyerLang", l);
  } catch {}
};

export const t = (lang, key) => STRINGS[lang]?.[key] || STRINGS.en[key] || key;