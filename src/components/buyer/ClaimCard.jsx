import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const operatorBadge = {
  SFR: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
  Bouygues: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
  Orange: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
};

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
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${operatorBadge[sub.operateur]}`}>
          {sub.operateur}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        <span className="text-2xl font-bold text-[#111827] font-mono">{maskSnap(sub.snapchat)}</span>
        <span className="text-lg text-[#6b7280] font-mono">{maskPhone(sub.telephone)}</span>
        <span className={`mt-2 self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border ${operatorBadge[sub.operateur]}`}>
          {sub.operateur}
        </span>
      </div>

      <button
        onClick={() => onClaim(sub.id)}
        disabled={busy}
        className="mt-auto w-full bg-[#0e746a] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-[#0c5f57] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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