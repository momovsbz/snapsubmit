import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const ACTION_COLORS = {
  submitted: "bg-blue-500/20 text-blue-400",
  code_sent: "bg-green-500/20 text-green-400",
  code_verified: "bg-emerald-500/20 text-emerald-400",
  code_wrong: "bg-red-500/20 text-red-400",
  code_expired: "bg-orange-500/20 text-orange-400",
  waiting_queue: "bg-purple-500/20 text-purple-400",
  rejected: "bg-red-600/20 text-red-500",
};

export default function ActivityTable({ logs }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Historique des actions ({logs.length})
        </h3>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 sticky top-0">
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submission</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigateur</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appareil</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pays</th>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 100).map((log) => (
              <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-3 text-xs font-mono text-muted-foreground">{log.submission_id?.slice(0, 8)}</td>
                <td className="px-6 py-3 text-xs font-semibold">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${ACTION_COLORS[log.action] || "bg-primary/15 text-primary"}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-foreground/70">{log.details?.browser || "—"}</td>
                <td className="px-6 py-3 text-xs text-foreground/70">{log.details?.device || "—"}</td>
                <td className="px-6 py-3 text-xs text-foreground/70">{log.details?.country || "—"}</td>
                <td className="px-6 py-3 text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}