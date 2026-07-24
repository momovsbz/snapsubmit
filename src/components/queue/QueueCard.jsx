import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Paperclip, Clock, User, Hand } from "lucide-react";
import StatusBadge from "@/components/queue/StatusBadge";
import { queueId, timeAgo } from "@/lib/queueHelpers";

export default function QueueCard({ sub, canClaim, onClaim, claiming, to }) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-2xl p-4 transition-all ${
        canClaim ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold text-primary">{queueId(sub.queue_number)}</span>
          <StatusBadge status={sub.status} />
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> {timeAgo(sub.created_date)}
        </span>
      </div>

      <p className="text-sm text-foreground/90 line-clamp-3 mb-3">{sub.description}</p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> {sub.submitted_by_name || "Anonyme"}
          </span>
          {sub.file_url && (
            <span className="flex items-center gap-1 text-primary">
              <Paperclip className="w-3 h-3" /> fichier
            </span>
          )}
        </div>

        {canClaim && (
          <button
            onClick={(e) => { e.preventDefault(); onClaim(sub); }}
            disabled={claiming}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {claiming ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Hand className="w-4 h-4" />
            )}
            Réclamer
          </button>
        )}
      </div>
    </motion.div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return content;
}