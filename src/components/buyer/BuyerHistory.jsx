import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const statusMeta = {
  code_valid: { label: "Validated", icon: CheckCircle2, cls: "bg-green-500/10 text-green-400 border-green-500/25" },
  code_wrong: { label: "Wrong number", icon: XCircle, cls: "bg-red-500/10 text-red-400 border-red-500/25" },
  code_expired: { label: "Expired", icon: Clock, cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" },
};

const operatorBadge = {
  SFR: "bg-red-500/10 text-red-400 border-red-500/25",
  Bouygues: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  Orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
};

export default function BuyerHistory({ items }) {
  const sorted = [...items].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="bg-background border border-border rounded-2xl p-6 min-h-[60vh]">
      <h2 className="text-lg font-bold text-foreground mb-1">My history</h2>
      <p className="text-sm text-muted-foreground mb-5">Requests you have already processed.</p>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground text-sm">No history yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((sub, i) => {
            const meta = statusMeta[sub.status] || statusMeta.code_valid;
            const Icon = meta.icon;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20"
              >
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{sub.snapchat}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge[sub.operateur]}`}>
                      {sub.operateur}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{sub.telephone}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${meta.cls}`}>
                  {meta.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}