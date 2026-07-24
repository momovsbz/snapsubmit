import { motion } from "framer-motion";
import HistoryItem from "@/components/buyer/HistoryItem";

export default function BuyerHistory({ items, onRemove }) {
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
          {sorted.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <HistoryItem sub={sub} index={i} onRemove={onRemove} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}