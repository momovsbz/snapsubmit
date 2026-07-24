import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ListOrdered, Hand, Inbox, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { addLog } from "@/lib/queueHelpers";
import QueueNav from "@/components/queue/QueueNav";
import QueueCard from "@/components/queue/QueueCard";
import StatusBadge from "@/components/queue/StatusBadge";

export default function BuyerPanel() {
  const [subs, setSubs] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = async () => {
    try {
      const all = await base44.entities.QueueSubmission.list("queue_number", 500);
      setSubs(all);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    load();
    const unsub = base44.entities.QueueSubmission.subscribe(() => { load(); });
    return unsub;
  }, []);

  const waiting = subs.filter((s) => s.status === "waiting").sort((a, b) => a.queue_number - b.queue_number);
  const mine = subs.filter((s) => (s.status === "claimed" || s.status === "escalated") && s.claimed_by_id === me?.id);
  const firstWaiting = waiting[0];
  const actor = () => ({ id: me?.id, name: me?.full_name || me?.email, role: me?.role });

  const claim = async (sub) => {
    if (!me || sub.id !== firstWaiting?.id) return;
    setClaiming(true);
    try {
      const a = actor();
      await base44.entities.QueueSubmission.update(sub.id, {
        status: "claimed",
        claimed_by_id: a.id,
        claimed_by_name: a.name,
        claimed_date: new Date().toISOString(),
      });
      await addLog({ submission_id: sub.id, queue_number: sub.queue_number, action: "claimed", actor_id: a.id, actor_name: a.name, actor_role: a.role });
    } catch {}
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <QueueNav role={me?.role} />

      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <ListOrdered className="w-6 h-6 text-primary" /> File d'attente
            </h1>
            <p className="text-muted-foreground text-sm">Réclamez la première demande disponible (FIFO).</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-card border border-border rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-amber-400">{waiting.length}</div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-blue-400">{mine.length}</div>
              <div className="text-xs text-muted-foreground">Mes actives</div>
            </div>
          </div>
        </div>

        {mine.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-lg font-semibold mb-3">Mes demandes actives</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {mine.map((s) => (
                <Link key={s.id} to={`/queue/buyer/${s.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-blue-500/30 rounded-2xl p-4 hover:border-blue-500/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading text-lg font-bold text-primary">#{String(s.queue_number).padStart(3, "0")}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm text-foreground/80 line-clamp-2">{s.description}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-heading text-lg font-semibold mb-3">Demandes en attente</h2>
          {waiting.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">File vide — aucune demande en attente.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {waiting.map((s, i) => (
                <QueueCard
                  key={s.id}
                  sub={s}
                  canClaim={i === 0}
                  onClaim={claim}
                  claiming={claiming}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground/50 text-center mt-8 flex items-center justify-center gap-1.5">
          <Hand className="w-3.5 h-3.5" /> Seule la première demande de la file peut être réclamée.
        </p>
      </div>
    </div>
  );
}