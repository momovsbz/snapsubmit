import { motion } from "framer-motion";
import { Ghost, Clock, ChevronRight } from "lucide-react";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

export default function BuyerQueue({ queue, onClaim, busyId }) {
  if (queue.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <Ghost className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Aucune soumission en attente pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {queue.map((sub, i) => {
        const isCurrent = i === 0;
        const isBusy = busyId === sub.id;
        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className={`bg-card border rounded-2xl p-4 flex items-center gap-3 ${isCurrent ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border"}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isCurrent ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground border border-border"}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Ghost className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">{sub.snapchat}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge[sub.operateur]}`}>{sub.operateur}</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{sub.telephone}</p>
            </div>
            {isCurrent ? (
              <button
                onClick={() => onClaim(sub.id)}
                disabled={isBusy}
                className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
              >
                {isBusy ? <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Réclamer <ChevronRight className="w-3.5 h-3.5" /></>}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Position {i + 1}</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}