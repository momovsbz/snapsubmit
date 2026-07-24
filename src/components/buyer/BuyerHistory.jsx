import { Ghost } from "lucide-react";
import { t } from "@/components/buyer/i18n";

const opPill = {
  SFR: "bg-red-500/15 text-red-400 border border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border border-orange-400/30",
};

const statusCls = {
  pending: "bg-muted/40 text-muted-foreground border-border",
  code_ready: "bg-primary/15 text-primary border-primary/30",
  code6_ready: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  code6sfr_ready: "bg-red-500/15 text-red-400 border-red-500/30",
  code6orange_ready: "bg-orange-400/15 text-orange-400 border-orange-400/30",
  code_valid: "bg-green-500/15 text-green-400 border-green-500/30",
  code_wrong: "bg-destructive/15 text-destructive border-destructive/30",
  code_expired: "bg-muted/40 text-muted-foreground border-border",
  waiting_queue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

function formatFull(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  return d.match(/.{1,2}/g)?.join(" ") || d;
}

export default function BuyerHistory({ mine, lang, onOpenHistory }) {
  if (mine.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl py-16 text-center">
        <Ghost className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">{t(lang, "noHistory")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {mine.map((s) => (
        <div key={s.id} onClick={() => onOpenHistory?.(s.id)} className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Ghost className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-bold text-foreground truncate">@{s.snapchat}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${opPill[s.operateur] || opPill.Bouygues}`}>
                {s.operateur}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0 ${statusCls[s.status] || statusCls.pending}`}>
              {t(lang, s.status) || s.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1.5">{formatFull(s.telephone)}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            {new Date(s.created_date).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ))}
    </div>
  );
}