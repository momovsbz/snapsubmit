import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, AtSign, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/Logo";

export default function BuyerLogin({ onSuccess }) {
  const [discord, setDiscord] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("loginBuyer", { discord, password });
      if (res?.data?.ok) {
        sessionStorage.setItem("buyerId", res.data.buyerId);
        sessionStorage.setItem("buyerDiscord", res.data.discord);
        onSuccess(res.data.buyerId, res.data.discord);
      } else {
        setError(res?.data?.error || "Connexion échouée");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Connexion échouée");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-card border border-border rounded-3xl px-8 py-10 w-full max-w-sm shadow-2xl shadow-black/50"
      >
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="w-14 h-14 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground text-center mb-1">Espace Buyer</h1>
        <p className="text-muted-foreground text-xs text-center mb-6">
          Connectez-vous avec votre Discord et mot de passe
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pseudo Discord"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              autoComplete="off"
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
            Se connecter
          </button>
        </form>
        <p className="text-muted-foreground/50 text-[11px] text-center mt-4">
          Un seul appareil (IP) par compte.
        </p>
      </motion.div>
    </div>
  );
}