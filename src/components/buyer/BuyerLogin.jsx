import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, AtSign, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#F9F9FB" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white border rounded-2xl px-8 py-10 w-full max-w-sm shadow-sm"
        style={{ borderColor: "#DFE6E9" }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#E6F2EF", border: "1px solid #0D7061" }}>
          <Lock className="w-6 h-6" style={{ color: "#0D7061" }} />
        </div>
        <h1 className="font-heading text-xl font-bold text-center mb-1" style={{ color: "#2D3436" }}>SNAPCHAT+ OPS</h1>
        <p className="text-xs text-center mb-6" style={{ color: "#636E72" }}>Espace acheteur — connectez-vous</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#636E72" }} />
            <input
              type="text"
              placeholder="Pseudo Discord"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              autoComplete="off"
              className="w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#DFE6E9" }}
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#636E72" }} />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#DFE6E9" }}
            />
          </div>
          {error && <p className="text-xs font-medium" style={{ color: "#D63031" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl text-sm text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#0D7061" }}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Se connecter
          </button>
        </form>
        <p className="text-[11px] text-center mt-4" style={{ color: "#636E72" }}>Un seul appareil (IP) par compte.</p>
      </motion.div>
    </div>
  );
}