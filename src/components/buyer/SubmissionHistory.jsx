import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Ghost, KeyRound, Send, CheckCircle2, XCircle, Clock, Ban, FileText } from "lucide-react";
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}