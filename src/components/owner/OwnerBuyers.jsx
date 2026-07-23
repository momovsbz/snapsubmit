import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Power, Shield, AtSign, Globe, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DURATIONS = [
  { value: "day", label: "1 jour" },
  { value: "week", label: "1 semaine" },
  { value: "month", label: "1 mois" },
];

function fmtExpiry(expires_at) {
  if (!expires_at) return "—";
  const d = new Date(expires_at);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function OwnerBuyers({ ownerPassword }) {
  const [discord, setDiscord] = useState("");
  const [password, setPassword] = useState("");
  const [duration, setDuration] = useState("week");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: buyers = [] } = useQuery({
    queryKey: ["buyers"],
    queryFn: () => base44.entities.Buyer.list(),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!discord.trim() || !password) {
      setError("Discord et mot de passe requis");
      return;
    }
    setCreating(true);
    try {
      const res = await base44.functions.invoke("createBuyer", { ownerPassword, discord, password, duration });
      if (res?.data?.ok) {
        setDiscord("");
        setPassword("");
        setDuration("week");
        queryClient.invalidateQueries({ queryKey: ["buyers"] });
      } else {
        setError(res?.data?.error || "Échec");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Échec");
    }
    setCreating(false);
  };

  const toggleActive = async (b) => {
    await base44.entities.Buyer.update(b.id, { is_active: !b.is_active });
    queryClient.invalidateQueries({ queryKey: ["buyers"] });
  };

  const remove = async (b) => {
    await base44.entities.Buyer.delete(b.id);
    queryClient.invalidateQueries({ queryKey: ["buyers"] });
  };

  return (
    <div className="space-y-5">
      <motion.form
        onSubmit={handleCreate}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Créer un buyer
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pseudo Discord"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <input
            type="text"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full sm:w-36 bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/80 transition-colors disabled:opacity-60 flex items-center gap-1.5 justify-center"
          >
            {creating && <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />}
            Ajouter
          </button>
        </div>
        {error && <p className="text-destructive text-xs mt-2">{error}</p>}
      </motion.form>

      <div className="space-y-2">
        {buyers.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-6">Aucun buyer créé</p>
        ) : (
          buyers.map((b) => {
            const expired = b.expires_at && new Date(b.expires_at).getTime() < Date.now();
            return (
              <div key={b.id} className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-bold text-foreground truncate">@{b.discord}</span>
                    {b.is_active === false && (
                      <span className="text-[10px] text-destructive font-bold uppercase">désactivé</span>
                    )}
                    {expired && (
                      <span className="text-[10px] text-orange-400 font-bold uppercase">expiré</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {b.bound_ip || "IP non liée"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {expired ? <span className="text-orange-400">expiré le {fmtExpiry(b.expires_at)}</span> : `jusqu'au ${fmtExpiry(b.expires_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(b)}
                    title={b.is_active === false ? "Activer" : "Désactiver"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                      b.is_active === false
                        ? "bg-muted text-muted-foreground border-border"
                        : "bg-green-500/15 text-green-400 border-green-500/30"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(b)}
                    className="w-8 h-8 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 flex items-center justify-center hover:bg-destructive/25 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}