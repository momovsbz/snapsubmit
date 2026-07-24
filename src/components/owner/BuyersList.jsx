import { motion } from "framer-motion";
import { Trash2, Power, Users, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BuyersList({ buyers, onChanged }) {
  const sorted = [...buyers].sort((a, b) => (a.queue_order || 0) - (b.queue_order || 0));

  const toggleActive = async (b) => {
    await base44.entities.Buyer.update(b.id, { active: !b.active });
    onChanged?.();
  };

  const remove = async (b) => {
    if (!confirm(`Supprimer l'acheteur ${b.username} ?`)) return;
    await base44.entities.Buyer.delete(b.id);
    onChanged?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Acheteurs ({sorted.length})</h3>
        <span className="ml-auto text-[11px] text-muted-foreground uppercase tracking-wide">File tournante</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-10">Aucun acheteur — ajoutez-en un pour démarrer la rotation</p>
      ) : (
        <div className="divide-y divide-border">
          {sorted.map((b, i) => (
            <div key={b.id} className={`flex items-center gap-3 px-5 py-3 ${b.active ? "" : "opacity-50"}`}>
              <div className="w-7 h-7 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                {i + 1}
              </div>
              {i === 0 && b.active && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{b.username}</p>
                <p className="text-[11px] text-muted-foreground">{b.claimed_count || 0} réclamée(s) · {b.active ? "Actif" : "Désactivé"}</p>
              </div>
              <button
                onClick={() => toggleActive(b)}
                className={`p-2 rounded-lg border transition-colors ${b.active ? "bg-green-500/15 text-green-400 border-green-500/40 hover:bg-green-500/25" : "bg-muted text-muted-foreground border-border hover:bg-muted/70"}`}
                title={b.active ? "Désactiver" : "Activer"}
              >
                <Power className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => remove(b)}
                className="p-2 rounded-lg bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}