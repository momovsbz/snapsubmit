import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const opColor = {
  SFR: { badge: "bg-red-50 text-red-600 border-red-200", btn: "bg-red-500 hover:bg-red-600" },
  Bouygues: { badge: "bg-blue-50 text-blue-600 border-blue-200", btn: "bg-blue-500 hover:bg-blue-600" },
  Orange: { badge: "bg-orange-50 text-orange-600 border-orange-200", btn: "bg-orange-500 hover:bg-orange-600" },
};
const fallback = { badge: "bg-gray-50 text-gray-600 border-gray-200", btn: "bg-gray-600 hover:bg-gray-700" };

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

export default function ClaimCard({ submission, onClaim, busy }) {
  const sub = submission;
  const c = opColor[sub.operateur] || fallback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 flex flex-col min-h-[60vh]"
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#e5e7eb] bg-gray-50 text-[#6b7280]">
          Queued
        </span>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
          {sub.operateur}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        <span className="text-2xl font-bold text-[#111827] font-mono">{maskSnap(sub.snapchat)}</span>
        <span className="text-lg text-[#6b7280] font-mono">{maskPhone(sub.telephone)}</span>
        <span className={`mt-2 self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
          {sub.operateur}
        </span>
      </div>

      <button
        onClick={() => onClaim(sub.id)}
        disabled={busy}
        className={`mt-auto w-full text-white font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${c.btn}`}
      >
        {busy ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" /> Claim & lock for me
          </>
        )}
      </button>
    </motion.div>
  );
}