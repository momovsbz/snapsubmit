import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";

const faqItems = [
  {
    question: "Qu'est-ce que Snapchat+ ?",
    answer: "Snapchat+ est un abonnement premium qui offre des badges exclusifs, la possibilité de voir qui a visionné votre story, un boost de score et bien d'autres fonctionnalités. Cette offre est limitée dans le temps.",
  },
  {
    question: "Est-ce que Snapchat+ sera facturé ?",
    answer: "Non, l'abonnement Snapchat+ ne vous sera pas facturé lors de cette offre. Vous bénéficiez d'une année gratuite.",
  },
  {
    question: "Quels opérateurs sont éligibles ?",
    answer: "Seuls les numéros SFR, Bouygues Telecom et Orange sont éligibles à cette offre. Les autres opérateurs ne sont pas encore compatibles.",
  },
  {
    question: "Comment fonctionne la vérification par SMS ?",
    answer: "Après avoir soumis votre demande, vous recevrez un code SMS à 4 chiffres. Ce code confirme que vous êtes le propriétaire du numéro de téléphone.",
  },
  {
    question: "Combien de temps faut-il pour activer l'abonnement ?",
    answer: "Après vérification du code, votre demande est traitée par nos équipes. Le délai peut varier selon la charge.",
  },
  {
    question: "Que faire si je ne reçois pas le SMS ?",
    answer: "Vérifiez que votre numéro est correct et que vous avez une bonne réception. Vous pouvez réessayer après quelques minutes.",
  },
];

export default function FAQ({ onBack }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card border border-border rounded-3xl px-6 py-8 shadow-2xl shadow-black/60 max-h-[70vh] overflow-y-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground/60 text-xs mb-6 hover:text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Retour
        </button>

        <h2 className="font-heading text-2xl font-bold text-foreground mb-6 text-center">
          Questions fréquentes
        </h2>

        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <motion.div
              key={idx}
              className="border border-border rounded-xl overflow-hidden bg-secondary/20"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-foreground">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-primary transition-transform ${
                    openIndex === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border px-4 py-3 bg-secondary/10"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <p className="text-muted-foreground/40 text-xs text-center mt-8">
          Besoin d'aide ? Consultez nos ressources d'assistance
        </p>
      </div>
    </motion.div>
  );
}