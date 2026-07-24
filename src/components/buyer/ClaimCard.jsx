import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const opColor = {
  SFR: { badge: "bg-red-500/10 text-red-400 border-red-500/25", btn: "bg-red-500 hover:bg-red-600 text-white" },
  Bouygues: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/25", btn: "bg-blue-500 hover:bg-blue-600 text-white" },
  Orange: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/25", btn: "bg-orange-500 hover:bg-orange-600 text-white" },
};
const fallback = { badge: "bg-secondary/40 text-muted-foreground border-border", btn: "bg-primary hover:bg-primary/90 text-primary-foreground" };

const maskSnap = (snap) => {
  const s = String(snap || "");
  if (s.length <= 1) return "@" + s + "•••";
  return "@" + s[0] + "•".repeat(Math.min(s.length - 1, 6));
};

const maskPhone = (tel) => {
  const t = String(tel || "").replace(/\D/g, "");
  if (t.length <= 4) return "•".repeat(4);
  return "•".repeat(t.length - 4) + t.slice(-4);
};

export default function ClaimCard({ submission, onClaim, busy, active }) {
  const sub = submission;
  const c = opColor[sub.operateur] || fallback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 flex flex-col min-h-[60vh]"
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border bg-secondary/40 text-muted-foreground">
          Queued
        </span>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
          {sub.operateur}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        <span className="text-2xl font-bold text-foreground font-mono">{maskSnap(sub.snapchat)}</span>
        <span className="text-lg text-muted-foreground font-mono">{maskPhone(sub.telephone)}</span>
        <span className={`mt-2 self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
          {sub.operateur}
        </span>
      </div>

      <button
        onClick={() => onClaim(sub.id)}
        disabled={busy || !active}
        className={`mt-auto w-full font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
          active ? c.btn : "bg-secondary text-muted-foreground"
        }`}
      >
        {busy ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" /> {active ? "Claim & lock for me" : "Enter queue to claim"}
          </>
        )}
      </button>
    </motion.div>
  );
}