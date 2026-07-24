import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const statusMeta = {
  code_valid: { label: "Validated", icon: CheckCircle2, cls: "bg-green-50 text-green-600 border-green-200" },
  code_wrong: { label: "Wrong number", icon: XCircle, cls: "bg-red-50 text-red-600 border-red-200" },
  code_expired: { label: "Expired", icon: Clock, cls: "bg-yellow-50 text-yellow-600 border-yellow-200" },
};

const operatorBadge = {
  SFR: "bg-red-50 text-red-600 border-red-200",
  Bouygues: "bg-blue-50 text-blue-600 border-blue-200",
  Orange: "bg-orange-50 text-orange-600 border-orange-200",
};

export default function BuyerHistory({ items }) {
  const sorted = [...items].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[60vh]">
      <h2 className="text-lg font-bold text-gray-900 mb-1">My history</h2>
      <p className="text-sm text-gray-400 mb-5">Requests you have already processed.</p>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400 text-sm">No history yet.</p>
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
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50"
              >
                <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{sub.snapchat}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge[sub.operateur]}`}>
                      {sub.operateur}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{sub.telephone}</p>
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