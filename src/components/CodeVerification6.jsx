import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

export default function CodeVerification6({ data, onSubmit, loading, onExpire }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const formatPhone = (tel) => tel?.replace(/(\d{2})(?=\d)/g, "$1 ").trim() || "";

  const handleChange = (idx, val) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length === 6) onSubmit(code);
  };

  const isComplete = digits.every((d) => d !== "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card border border-border rounded-3xl px-5 py-8 shadow-2xl shadow-black/60">
        <div className="mb-6">
          <Logo />
        </div>

        <div className="text-center mb-6">
          <p className="text-foreground/80 text-sm">
            Entrez le code à <span className="text-primary font-bold">6 chiffres</span> reçu par SMS au
          </p>
          <p className="text-foreground font-semibold mt-1">{formatPhone(data?.telephone)}</p>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-5">
          <span className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${timeLeft < 60 ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>

        {/* 6-digit input */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((d, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-14 text-center text-xl font-bold bg-secondary/30 border-2 border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
          ))}
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={loading || !isComplete}
          whileHover={{ scale: loading || !isComplete ? 1 : 1.02 }}
          whileTap={{ scale: loading || !isComplete ? 1 : 0.98 }}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Vérification...
            </>
          ) : (
            "Valider le code"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}