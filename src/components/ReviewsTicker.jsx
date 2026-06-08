import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const reviews = [
  { name: "Elo***", text: "vient de recevoir son Snap+ !", time: "~2 min" },
  { name: "Luc***", text: "a activé Snapchat+ avec succès !", time: "~5 min" },
  { name: "Mar***", text: "profite maintenant de Snap+ gratuit !", time: "~8 min" },
  { name: "Cam***", text: "vient de recevoir son Snap+ !", time: "~12 min" },
  { name: "Noa***", text: "a validé son abonnement Snap+ !", time: "~15 min" },
  { name: "Zoe***", text: "vient d'activer son Snap+ !", time: "~18 min" },
  { name: "Tom***", text: "a reçu son code Snapchat+ !", time: "~22 min" },
  { name: "Léa***", text: "profite déjà de Snap+ !", time: "~25 min" },
  { name: "Axe***", text: "vient de rejoindre Snap+ gratuitement !", time: "~30 min" },
  { name: "Jul***", text: "a activé son abonnement Snap+ !", time: "~35 min" },
];

export default function ReviewsTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % reviews.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const review = reviews[index];

  return (
    <div className="h-10 mb-5 flex items-center overflow-hidden">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-primary/10 border border-primary/30 rounded-full px-4 py-2 text-center text-xs text-primary font-semibold w-full flex items-center justify-center"
          >
            🎉 <span className="text-foreground/80">{review.name}</span> {review.text} · il y a {review.time}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}