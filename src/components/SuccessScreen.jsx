import { motion } from "framer-motion";

const operatorColors = {
  SFR: "text-red-400",
  Bouygues: "text-blue-400",
  Orange: "text-orange-400",
};

export default function SuccessScreen({ data, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-primary/15 border-2 border-primary/40 mb-8 mx-auto"
      >
        <span className="text-5xl">✅</span>
      </motion.div>

      <h2 className="font-heading text-3xl font-bold text-foreground mb-3">
        C'est envoyé !
      </h2>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        Ta soumission a bien été reçue.<br />On te contactera bientôt sur Snap.
      </p>

      {/* Summary card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Snapchat</span>
          <span className="font-semibold text-foreground text-sm flex items-center gap-1">
            👻 {data?.snapchat}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Téléphone</span>
          <span className="font-semibold text-foreground text-sm flex items-center gap-1">
            📱 {data?.telephone}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Opérateur</span>
          <span className={`font-bold text-sm flex items-center gap-1 ${operatorColors[data?.operateur]}`}>
            📡 {data?.operateur}
          </span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onReset}
        className="w-full border border-border bg-muted text-foreground font-semibold py-3.5 rounded-xl text-sm tracking-wide transition-all duration-200 hover:bg-secondary"
      >
        Nouvelle soumission
      </motion.button>
    </motion.div>
  );
}