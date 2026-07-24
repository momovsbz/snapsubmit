import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BuyerLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("buyerLogin", { username: username.trim(), password });
      if (res?.data?.ok) {
        onLogin(res.data.buyerId, res.data.username);
      } else {
        setError(res?.data?.error || "Identifiants incorrects");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Identifiants incorrects");
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
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1 text-center">Espace Acheteur</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">Connectez-vous pour accéder à votre file</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {error && <p className="text-destructive text-xs font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Connexion..." : <>Se connecter <ChevronRight className="w-4 h-4" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}