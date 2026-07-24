import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Ghost, KeyRound, Send, CheckCircle2, XCircle, Clock, Ban, FileText, Unlock, AlertTriangle, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { t } from "@/components/buyer/i18n";

const actionIcon = {
  submitted: FileText,
  code_sent: Send,
  code_entered: KeyRound,
  code_verified: CheckCircle2,
  code_wrong: XCircle,
  code_expired: Clock,
  waiting_queue: Clock,
  rejected: Ban,
};

const actionTone = {
  submitted: "#9ca3af",
  code_sent: "#facc15",
  code_entered: "#a78bfa",
  code_verified: "#22c55e",
  code_wrong: "#ef4444",
  code_expired: "#f59e0b",
  waiting_queue: "#3b82f6",
  rejected: "#ef4444",
};

const formatFull = (tel) => String(tel || "").replace(/\D/g, "").match(/.{1,2}/g)?.join(" ") || "";

export default function SubmissionHistory({ submissionId, buyerId, lang, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [releaseMsg, setReleaseMsg] = useState("");
  const [released, setReleased] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("getSubmissionHistory", { submissionId, buyerId });
        if (!alive) return;
        if (res?.data?.ok) {
          setData({ submission: res.data.submission, logs: res.data.logs || [] });
        } else {
          setErr(res?.data?.error || "Error");
        }
      } catch (e) {
        setErr(e?.response?.data?.error || "Error");
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [submissionId, buyerId]);

  const handleRelease = async () => {
    if (!sub?.id) return;
    setReleasing(true);
    setReleaseMsg("");
    try {
      const res = await base44.functions.invoke("releaseSubmission", { submissionId: sub.id, buyerId });
      if (res?.data?.error) {
        setReleaseMsg(res.data.error);
      } else {
        setReleased(true);
        setReleaseMsg(lang === "fr" ? "Remise en file ✓" : "Released to queue ✓");
        setTimeout(() => onClose?.(), 1100);
      }
    } catch (e) {
      setReleaseMsg(e?.response?.data?.error || (lang === "fr" ? "Échec" : "Failed"));
    }
    setReleasing(false);
    setConfirmRelease(false);
  };

  const handleReject = async () => {
    if (!sub?.id) return;
    setRejecting(true);
    setReleaseMsg("");
    try {
      await base44.functions.invoke("blacklistUser", {
        ip: sub.ip_address,
        telephone: sub.telephone,
        submissionId: sub.id,
      });
      await base44.functions.invoke("sendCode", {
        submissionId: sub.id,
        action: "wrong",
        buyerId,
      }).catch(() => {});
      setRejected(true);
      setReleaseMsg(lang === "fr" ? "Demande rejetée ✓" : "Request rejected ✓");
      setTimeout(() => onClose?.(), 1100);
    } catch (e) {
      setReleaseMsg(e?.response?.data?.error || (lang === "fr" ? "Échec" : "Failed"));
    }
    setRejecting(false);
    setConfirmReject(false);
  };

  const logs = (data?.logs || []).slice().sort((a, b) => {
    const ta = new Date(a.timestamp || a.created_date).getTime();
    const tb = new Date(b.timestamp || b.created_date).getTime();
    return ta - tb;
  });
  const sub = data?.submission;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Ghost className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-bold text-foreground truncate">@{sub?.snapchat || "…"}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : err ? (
            <p className="text-destructive text-sm text-center py-6">{err}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-secondary/40 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "phoneLabel")}</div>
                  <div className="font-mono text-foreground">{formatFull(sub?.telephone)}</div>
                </div>
                <div className="bg-secondary/40 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "operator")}</div>
                  <div className="text-foreground">{sub?.operateur}</div>
                </div>
                <div className="bg-secondary/40 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "statusLabel")}</div>
                  <div className="text-foreground">{t(lang, sub?.status) || sub?.status}</div>
                </div>
                <div className="bg-secondary/40 rounded-lg px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t(lang, "currentCode")}</div>
                  <div className="font-mono text-foreground">{sub?.entered_code || "—"}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t(lang, "historyTitle")}</h4>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground/70 py-4 text-center">{t(lang, "noLogs")}</p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((l, i) => {
                      const Icon = actionIcon[l.action] || FileText;
                      const tone = actionTone[l.action] || "#9ca3af";
                      const code = l.details?.code;
                      const fmt = l.action === "code_sent" && l.details?.action ? l.details.action : null;
                      const label = t(lang, `log_${l.action}`) || l.action;
                      const time = new Date(l.timestamp || l.created_date).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={l.id || i} className="flex items-start gap-3 bg-secondary/30 rounded-lg px-3 py-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tone}22` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: tone }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-foreground">{label}</span>
                              <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">{time}</span>
                            </div>
                            {code && <div className="text-xs font-mono mt-0.5 text-primary">{lang === "fr" ? "Code" : "Code"}: {code}</div>}
                            {fmt && <div className="text-[11px] text-muted-foreground mt-0.5">{fmt}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {sub?.assigned_buyer_id === buyerId && !released && !rejected && (
                <div className="pt-1 space-y-2.5">
                  {confirmRelease ? (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/90">
                          {lang === "fr"
                            ? "Remettre cette soumission en file d'attente partagée ?"
                            : "Release this submission back to the shared queue?"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRelease}
                          disabled={releasing}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 text-black font-bold py-2.5 rounded-lg text-xs disabled:opacity-50"
                        >
                          {releasing ? (
                            <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                          {lang === "fr" ? "Confirmer" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmRelease(false)}
                          disabled={releasing}
                          className="px-3 py-2.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          {t(lang, "cancel")}
                        </button>
                      </div>
                    </div>
                  ) : confirmReject ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-3">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-200/90">
                          {lang === "fr"
                            ? "Rejeter définitivement cette demande et blacklister l'utilisateur (IP + numéro) ?"
                            : "Permanently reject this request and blacklist the user (IP + phone)?"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={rejecting}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white font-bold py-2.5 rounded-lg text-xs disabled:opacity-50"
                        >
                          {rejecting ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          {lang === "fr" ? "Rejeter" : "Reject"}
                        </button>
                        <button
                          onClick={() => setConfirmReject(false)}
                          disabled={rejecting}
                          className="px-3 py-2.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          {t(lang, "cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setConfirmRelease(true)}
                        className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold bg-transparent border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        {lang === "fr" ? "Remettre en file" : "Release"}
                      </button>
                      <button
                        onClick={() => setConfirmReject(true)}
                        className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {lang === "fr" ? "Rejeter" : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {releaseMsg && (
                <div className="rounded-xl px-3 py-2.5 text-center text-xs font-bold"
                  style={{
                    backgroundColor: releaseMsg.includes("✓") ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    border: `1px solid ${releaseMsg.includes("✓") ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                    color: releaseMsg.includes("✓") ? "#22c55e" : "#ef4444",
                  }}
                >
                  {releaseMsg}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}