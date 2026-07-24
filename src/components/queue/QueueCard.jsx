import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Paperclip, Clock, Hand, AtSign, Phone } from "lucide-react";
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/90 mb-2">
        <span className="flex items-center gap-1.5">
          <AtSign className="w-3.5 h-3.5 text-muted-foreground" /> {sub.snapchat || "—"}
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          {sub.telephone ? sub.telephone.replace(/(\d{2})(?=\d)/g, "$1 ") : "—"}
        </span>
        {sub.operateur && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/40 text-muted-foreground">{sub.operateur}</span>
        )}
      </div>

      {sub.description && (
        <p className="text-sm text-foreground/70 line-clamp-2 mb-2">{sub.description}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {sub.assigned_to_name && <span>👤 {sub.assigned_to_name}</span>}
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