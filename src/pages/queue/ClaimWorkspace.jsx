import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Paperclip,
  Send, Loader2, Clock, User, History,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { addLog, queueId, formatTime, ACTION_META } from "@/lib/queueHelpers";
import QueueNav from "@/components/queue/QueueNav";
import StatusBadge from "@/components/queue/StatusBadge";

export default function ClaimWorkspace() {
  const { id } = useParams();
  const [sub, setSub] = useState(null);
  const [logs, setLogs] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const s = await base44.entities.QueueSubmission.get(id);
      setSub(s);
      const l = await base44.entities.QueueLog.filter({ submission_id: id }, "-timestamp", 200);
      setLogs(l);
    } catch (e) { setError("Demande introuvable"); }
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    load();
    const unsub1 = base44.entities.QueueSubmission.subscribe(() => { load(); });
    const unsub2 = base44.entities.QueueLog.subscribe(() => { load(); });
    return () => { unsub1(); unsub2(); };
  }, [id]);

  const actor = () => ({ id: me?.id, name: me?.full_name || me?.email, role: me?.role });
  const isMine = sub?.claimed_by_id === me?.id || me?.role === "admin";
  const isActive = sub?.status === "claimed" || sub?.status === "escalated";

  const act = async (action, updates, noteText) => {
    if (!isMine || !isActive) return;
    setBusy(true);
    try {
      const a = actor();
      await base44.entities.QueueSubmission.update(id, updates);
      await addLog({ submission_id: id, queue_number: sub.queue_number, action, actor_id: a.id, actor_name: a.name, actor_role: a.role, note: noteText });
    } catch {}
    setBusy(false);
  };

  const complete = () => act("completed", { status: "completed", completed_date: new Date().toISOString() });
  const cancel = () => act("cancelled", { status: "cancelled" });
  const escalate = () => act("escalated", { status: "escalated" });
  const addNote = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    act("note_added", {}, note.trim());
    setNote("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <QueueNav role={me?.role} />
        <div className="max-w-xl mx-auto bg-card border border-destructive/30 rounded-2xl p-8 text-center">
          <p className="text-destructive">{error || "Introuvable"}</p>
          <Link to="/queue/buyer" className="text-primary text-sm mt-4 inline-block">← Retour à la file</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <QueueNav role={me?.role} />
      <div className="w-full max-w-3xl mx-auto">
        <Link to="/queue/buyer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour à la file
        </Link>

        <div className="bg-card border border-border rounded-3xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="font-heading text-3xl font-black text-primary">{queueId(sub.queue_number)}</span>
              <StatusBadge status={sub.status} />
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {formatTime(sub.created_date)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="bg-secondary/20 rounded-xl px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Déposant</div>
              <div className="font-medium">{sub.submitted_by_name || "Anonyme"}</div>
            </div>
            {sub.submitted_by_contact && (
              <div className="bg-secondary/20 rounded-xl px-3 py-2">
                <div className="text-xs text-muted-foreground">Contact</div>
                <div className="font-medium truncate">{sub.submitted_by_contact}</div>
              </div>
            )}
            {sub.claimed_by_name && (
              <div className="bg-secondary/20 rounded-xl px-3 py-2">
                <div className="text-xs text-muted-foreground">Réclamée par</div>
                <div className="font-medium">{sub.claimed_by_name}</div>
              </div>
            )}
            {sub.claimed_date && (
              <div className="bg-secondary/20 rounded-xl px-3 py-2">
                <div className="text-xs text-muted-foreground">Date de claim</div>
                <div className="font-medium">{formatTime(sub.claimed_date)}</div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">Description</div>
            <p className="text-foreground/90 whitespace-pre-wrap">{sub.description}</p>
          </div>

          {sub.file_url && (
            <a href={sub.file_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/20 transition-colors">
              <Paperclip className="w-4 h-4" /> Voir le fichier joint
            </a>
          )}
        </div>

        {isMine && isActive && (
          <div className="bg-card border border-border rounded-3xl p-6 mb-5">
            <h3 className="font-heading text-lg font-semibold mb-3">Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={complete} disabled={busy}
                className="flex flex-col items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl py-3 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                <CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">Terminer</span>
              </button>
              <button onClick={cancel} disabled={busy}
                className="flex flex-col items-center gap-1.5 bg-muted/40 border border-border text-muted-foreground rounded-xl py-3 hover:bg-muted/60 transition-colors disabled:opacity-50">
                <XCircle className="w-5 h-5" /><span className="text-sm font-medium">Annuler</span>
              </button>
              <button onClick={escalate} disabled={busy}
                className="flex flex-col items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl py-3 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                <AlertTriangle className="w-5 h-5" /><span className="text-sm font-medium">Escalader</span>
              </button>
            </div>

            <form onSubmit={addNote} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Ajouter une note interne..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button type="submit" disabled={busy || !note.trim()}
                className="bg-primary text-primary-foreground px-4 rounded-xl flex items-center gap-1.5 text-sm font-medium disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-3xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Historique
          </h3>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun événement.</p>
            ) : logs.map((l, i) => {
              const m = ACTION_META[l.action] || { label: l.action, icon: "•" };
              return (
                <motion.div
                  key={l.id || i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center text-sm flex-shrink-0">{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(l.timestamp)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {l.actor_name || "Système"}{l.actor_role ? ` · ${l.actor_role}` : ""}
                    </div>
                    {l.note && <p className="text-sm text-foreground/80 mt-1 bg-secondary/20 rounded-lg px-3 py-2">{l.note}</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}