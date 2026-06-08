import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const reviews = [
  { name: "Elo***" },
  { name: "Luc***" },
  { name: "Mar***" },
  { name: "Cam***" },
  { name: "Noa***" },
  { name: "Zoe***" },
  { name: "Tom***" },
  { name: "Léa***" },
  { name: "Axe***" },
  { name: "Jul***" },
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
    <div className="mb-5 flex items-center overflow-hidden h-11">
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-primary/10 border border-primary/30 rounded-full px-4 py-3 text-center text-xs text-primary font-semibold w-full flex items-center justify-center"
          >
            🎉 <span className="text-foreground/80">{review.name}</span> vient de recevoir son Snap+ !
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}