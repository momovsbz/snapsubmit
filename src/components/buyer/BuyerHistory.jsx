import { Ghost } from "lucide-react";

const opPill = {
  SFR: { bg: "#FDECEA", fg: "#C0392B" },
  Bouygues: { bg: "#CDE8F0", fg: "#0869A6" },
  Orange: { bg: "#FDEBD0", fg: "#B9770E" },
};

const statusMeta = {
  pending: { label: "En attente", bg: "#F2F4F4", fg: "#636E72" },
  code_ready: { label: "Code 4 envoyé", bg: "#E6F2EF", fg: "#0D7061" },
  code6_ready: { label: "Code 6 (Xbox)", bg: "#ECE0F0", fg: "#6C3483" },
  code6sfr_ready: { label: "Code 6 (SFR)", bg: "#FDECEA", fg: "#C0392B" },
  code6orange_ready: { label: "Code 6 (Orange)", bg: "#FDEBD0", fg: "#B9770E" },
  code_valid: { label: "Validé", bg: "#E6F2EF", fg: "#0D7061" },
  code_wrong: { label: "Mauvais numéro", bg: "#FDECEA", fg: "#C0392B" },
  code_expired: { label: "Expiré", bg: "#F2F4F4", fg: "#636E72" },
  waiting_queue: { label: "En file", bg: "#CDE8F0", fg: "#0869A6" },
};

function formatFull(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  return d.match(/.{1,2}/g)?.join(" ") || d;
}

export default function BuyerHistory({ mine }) {
  if (mine.length === 0) {
    return (
      <div className="bg-white rounded-2xl py-16 text-center border" style={{ borderColor: "#DFE6E9" }}>
        <Ghost className="w-12 h-12 mx-auto mb-3" style={{ color: "#B2BEC3" }} />
        <p className="text-sm" style={{ color: "#636E72" }}>Aucun historique pour l'instant</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {mine.map((s) => {
        const op = opPill[s.operateur] || opPill.Bouygues;
        const meta = statusMeta[s.status] || statusMeta.pending;
        return (
          <div key={s.id} className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#DFE6E9" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Ghost className="w-4 h-4 flex-shrink-0" style={{ color: "#636E72" }} />
                <span className="text-sm font-bold truncate" style={{ color: "#2D3436" }}>@{s.snapchat}</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: op.bg, color: op.fg }}>
                  {s.operateur}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0" style={{ background: meta.bg, color: meta.fg }}>
                {meta.label}
              </span>
            </div>
            <p className="text-xs font-mono mt-1.5" style={{ color: "#636E72" }}>{formatFull(s.telephone)}</p>
            <p className="text-[11px] mt-1" style={{ color: "#B2BEC3" }}>
              {new Date(s.created_date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        );
      })}
    </div>
  );
}