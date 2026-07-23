import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, AtSign, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { t, getStoredLang, setStoredLang } from "@/components/buyer/i18n";

export default function BuyerLogin({ onSuccess }) {
  const [lang, setLang] = useState(getStoredLang());
  const [discord, setDiscord] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchLang = (l) => { setLang(l); setStoredLang(l); };

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
        const msg = res?.data?.error || "Connexion échouée";
        setError(msg === "Subscription expired" ? t(lang, "expiredErr") : msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Connexion échouée";
      setError(msg === "Subscription expired" ? t(lang, "expiredErr") : msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-card border border-border rounded-2xl px-8 py-10 w-full max-w-sm shadow-2xl shadow-black/60"
      >
        <div className="flex justify-end mb-2">
          <div className="flex bg-secondary/40 border border-border rounded-lg overflow-hidden text-[11px] font-bold">
            <button onClick={() => switchLang("en")} className={`px-2.5 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
            <button onClick={() => switchLang("fr")} className={`px-2.5 py-1 ${lang === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>FR</button>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary/15 border border-primary/30">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-xl font-bold text-center text-foreground mb-1">SNAPCHAT+ <span className="text-primary">OPS</span></h1>
        <p className="text-xs text-center text-muted-foreground mb-6">{t(lang, "loginSub")}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t(lang, "discord")}
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              autoComplete="off"
              className="w-full bg-secondary/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder={t(lang, "password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && <p className="text-destructive text-xs font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />}
            {t(lang, "signIn")}
          </button>
        </form>
        <p className="text-[11px] text-center text-muted-foreground/60 mt-4">{t(lang, "oneDevice")}</p>
      </motion.div>
    </div>
  );
}