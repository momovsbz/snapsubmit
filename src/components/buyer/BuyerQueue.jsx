import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const operatorBadge = {
  SFR: "bg-red-50 text-red-600 border-red-200",
  Bouygues: "bg-blue-50 text-blue-600 border-blue-200",
  Orange: "bg-orange-50 text-orange-600 border-orange-200",
};

const maskPhone = (tel) => {
  const t = String(tel || "").replace(/\D/g, "");
  if (t.length < 6) return "•• •• •• ••";
  return `${t.slice(0, 2)} ${t.slice(2, 4)} •• •• •• ${t.slice(-2)}`;
};

export default function BuyerQueue({ queue, onClaim, busyId }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col min-h-[60vh]">
      <h2 className="text-lg font-bold text-gray-900">Live queue</h2>
      <p className="text-sm text-gray-400 mb-5">Numbers stay masked until you claim them.</p>

      {queue.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-gray-400 text-sm text-center">All numbers have been claimed for the moment.</p>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto flex-1">
          {queue.map((sub, i) => {
            const isCurrent = i === 0;
            const isBusy = busyId === sub.id;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isCurrent ? "border-[#00695c]/40 bg-[#e0f2f1]/40" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isCurrent ? "bg-[#00695c] text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">{sub.snapchat}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge[sub.operateur]}`}>
                      {sub.operateur}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{maskPhone(sub.telephone)}</p>
                </div>

                {isCurrent ? (
                  <button
                    onClick={() => onClaim(sub.id)}
                    disabled={isBusy}
                    className="bg-[#00695c] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#00504a] transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {isBusy ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Claim <ChevronRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">#{i + 1}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}