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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-card border border-border rounded-2xl px-8 py-10 w-full max-w-sm shadow-2xl shadow-black/60"
      >
        <div className="w-14 h-14 bg-primary/15 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div className="text-center mb-6">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">SNAPCHAT+ OPS</span>
          <h1 className="text-xl font-bold text-foreground">Client workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">Connectez-vous pour accéder à votre file</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {error && <p className="text-destructive text-xs font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Connexion..." : <>Se connecter <ChevronRight className="w-4 h-4" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}