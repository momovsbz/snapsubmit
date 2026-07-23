import { Ghost } from "lucide-react";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

const statusMeta = {
  pending: { label: "En attente", cls: "bg-muted/40 text-muted-foreground border-border" },
  code_ready: { label: "Code 4 envoyé", cls: "bg-primary/15 text-primary border-primary/30" },
  code6_ready: { label: "Code 6 (Xbox)", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  code6sfr_ready: { label: "Code 6 (SFR)", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  code6orange_ready: { label: "Code 6 (Orange)", cls: "bg-orange-400/15 text-orange-400 border-orange-400/30" },
  code_valid: { label: "Validé", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  code_wrong: { label: "Mauvais numéro", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  code_expired: { label: "Expiré", cls: "bg-muted/40 text-muted-foreground border-border" },
  waiting_queue: { label: "En file", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

export default function BuyerHistory({ mine }) {
  if (mine.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl py-16 text-center">
        <Ghost className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Aucun historique pour l'instant</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {mine.map((s) => {
        const meta = statusMeta[s.status] || statusMeta.pending;
        return (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Ghost className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground truncate">{s.snapchat}</span>
                <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${operatorBadge[s.operateur]}`}>
                  {s.operateur}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex-shrink-0 ${meta.cls}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-1">{s.telephone}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {new Date(s.created_date).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}