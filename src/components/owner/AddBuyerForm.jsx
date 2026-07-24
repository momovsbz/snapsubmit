import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddBuyerForm({ ownerPassword, onCreated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!username.trim() || !password) {
      setError("Nom d'utilisateur et mot de passe requis");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createBuyer", {
        username: username.trim(),
        password,
        ownerPassword,
      });
      if (res?.data?.ok) {
        setSuccess(true);
        setUsername("");
        setPassword("");
        onCreated?.();
        setTimeout(() => setSuccess(false), 2500);
      } else {
        setError(res?.data?.error || "Erreur");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Erreur");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" />
        Ajouter un acheteur
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          type="text"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {error && <p className="text-destructive text-xs font-medium">{error}</p>}
        {success && <p className="text-green-400 text-xs font-medium">Acheteur créé ✓</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg text-sm hover:bg-primary/80 transition-colors disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer l'acheteur"}
        </button>
      </form>
    </motion.div>
  );
}