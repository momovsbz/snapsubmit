import { base44 } from "@/api/base44Client";

export const STATUS_META = {
  waiting: { label: "En attente", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" },
  claimed: { label: "Réclamée", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-400" },
  completed: { label: "Terminée", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  cancelled: { label: "Annulée", color: "text-muted-foreground", bg: "bg-muted/40", border: "border-border", dot: "bg-muted-foreground" },
  escalated: { label: "Escaladée", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-400" },
};

export const ACTION_META = {
  created: { label: "Soumission créée", icon: "🆕" },
  claimed: { label: "Réclamée", icon: "🤚" },
  completed: { label: "Terminée", icon: "✅" },
  cancelled: { label: "Annulée", icon: "✖️" },
  escalated: { label: "Escaladée", icon: "⚠️" },
  unclaimed: { label: "Libérée", icon: "↩️" },
  reassigned: { label: "Réassignée", icon: "🔀" },
  note_added: { label: "Note ajoutée", icon: "💬" },
  reset: { label: "File réinitialisée", icon: "♻️" },
};

export async function addLog({ submission_id, queue_number, action, actor_id, actor_name, actor_role, note }) {
  try {
    await base44.entities.QueueLog.create({
      submission_id,
      queue_number,
      action,
      actor_id,
      actor_name,
      actor_role,
      note: note || "",
      timestamp: new Date().toISOString(),
    });
  } catch {
    /* ignore log errors */
  }
}

export async function nextQueueNumber() {
  const items = await base44.entities.QueueSubmission.list("queue_number", 500);
  const max = items.reduce((m, it) => Math.max(m, it.queue_number || 0), 0);
  return max + 1;
}

export function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function queueId(num) {
  return `#${String(num).padStart(3, "0")}`;
}