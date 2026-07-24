import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Paperclip,
  Send, Loader2, Clock, User, History, AtSign, Phone, Globe,
  Monitor, ShieldAlert, Hash,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { addLog, queueId, formatTime, ACTION_META } from "@/lib/queueHelpers";
import QueueNav from "@/components/queue/QueueNav";
import StatusBadge from "@/components/queue/StatusBadge";

const DISCORD_ACTIONS = [
  { id: "code_ready", label: "Code 4 (APPLE)", icon: "🔢", color: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" },
  { id: "code6", label: "Code 6 (XBOX)", icon: "🎮", color: "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20" },
  { id: "code6sfr", label: "Code 6 SFR", icon: "📡", color: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" },
  { id: "code6orange", label: "Code 6 Orange", icon: "🟠", color: "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20" },
  { id: "valid", label: "Code validé", icon: "✅", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" },
  { id: "wrong", label: "Mauvais numéro", icon: "❌", color: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" },
  { id: "wait", label: "Faire patienter", icon: "⏳", color: "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20" },
  { id: "expired", label: "Code expiré", icon: "⏰", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20" },
  { id: "blacklist", label: "Blacklist", icon: "🚫", color: "bg-red-700/10 border-red-700/30 text-red-500 hover:bg-red-700/20" },
];

export default function ClaimWorkspace() {
  const { id } = useParams();
  const [sub, setSub] = useState(null);
  const [logs, setLogs] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
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

  const discordAction = async (action) => {
    if (!isMine || !isActive) return;
    if (action === "blacklist" && !confirm("Blacklister cet IP + numéro et annuler la demande ?")) return;
    setBusy(true);
    setPendingAction(action);
    try {
      const a = actor();
      await base44.functions.invoke("triggerQueueAction", {
        queueSubmissionId: id,
        action,
        buyerId: a.id,
        buyerName: a.name,
      });
    } catch (e) {
      setError(e?.message || "Action échouée");
    }
    setBusy(false);
    setPendingAction("");
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const a = actor();
      await base44.entities.QueueSubmission.update(id, { status: "cancelled" });
      await addLog({ submission_id: id, queue_number: sub.queue_number, action: "cancelled", actor_id: a.id, actor_name: a.name, actor_role: a.role });
    } catch {}
    setBusy(false);
  };

  const addNote = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    (async () => {
      try {
        const a = actor();
        await addLog({ submission_id: id, queue_number: sub.queue_number, action: "note_added", actor_id: a.id, actor_name: a.name, actor_role: a.role, note: note.trim() });
      } catch {}
      setBusy(false);
      setNote("");
    })();
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

        {/* Lead details */}
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
            <div className="bg-secondary/20 rounded-xl px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><AtSign className="w-3 h-3" /> Snapchat</div>
              <div className="font-medium truncate">@{sub.snapchat || "—"}</div>
            </div>
            <div className="bg-secondary/20 rounded-xl px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</div>
              <div className="font-medium">{sub.telephone ? sub.telephone.replace(/(\d{2})(?=\d)/g, "$1 ") : "—"}</div>
            </div>
            <div className="bg-secondary/20 rounded-xl px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" /> Opérateur</div>
              <div className="font-medium">{sub.operateur || "—"}</div>
            </div>
            <div className="bg-secondary/20 rounded-xl px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" /> Pays</div>
              <div className="font-medium">{sub.country || "—"}</div>
            </div>
            <div className="bg-secondary/20 rounded-xl px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Monitor className="w-3 h-3" /> Navigateur</div>
              <div className="font-medium">{sub.browser || "—"}</div>
            </div>
            <div className="bg-secondary/20 rounded-xl px-3 py-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Monitor className="w-3 h-3" /> Appareil</div>
              <div className="font-medium">{sub.device_type || "—"}</div>
            </div>
            <div className="bg-secondary/20 rounded-xl px-3 py-2 col-span-2 md:col-span-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> IP</div>
              <div className="font-medium font-mono text-xs break-all">{sub.ip_address || "—"}</div>
            </div>
            {sub.assigned_to_name && (
              <div className="bg-secondary/20 rounded-xl px-3 py-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Assignée à</div>
                <div className="font-medium">{sub.assigned_to_name}</div>
              </div>
            )}
            {sub.claimed_date && (
              <div className="bg-secondary/20 rounded-xl px-3 py-2">
                <div className="text-xs text-muted-foreground">Claim le</div>
                <div className="font-medium">{formatTime(sub.claimed_date)}</div>
              </div>
            )}
          </div>

          {sub.action_status && (
            <div className="mb-3 inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-lg px-3 py-1.5 text-xs font-medium">
              Dernière action : {sub.action_status}
            </div>
          )}

          {sub.description && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-1">Note du déposant</div>
              <p className="text-foreground/90 whitespace-pre-wrap text-sm">{sub.description}</p>
            </div>
          )}

          {sub.file_url && (
            <a href={sub.file_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/20 transition-colors">
              <Paperclip className="w-4 h-4" /> Voir le fichier joint
            </a>
          )}
        </div>

        {/* Discord actions */}
        {isMine && isActive && (
          <div className="bg-card border border-border rounded-3xl p-6 mb-5">
            <h3 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" /> Actions Discord
            </h3>
            <p className="text-muted-foreground text-xs mb-4">
              Ces actions mettent à jour le statut et postent un log sur Discord.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {DISCORD_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => discordAction(a.id)}
                  disabled={busy}
                  className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${a.color}`}
                >
                  {busy && pendingAction === a.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-base">{a.icon}</span>
                  )}
                  <span className="truncate">{a.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 mt-3">
              <button onClick={cancel} disabled={busy}
                className="flex items-center justify-center gap-2 bg-muted/40 border border-border text-muted-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-muted/60 transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4" /> Annuler la demande
              </button>
            </div>

            {error && (
              <p className="text-destructive text-xs mt-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <form onSubmit={addNote} className="mt-4 flex gap-2">
              <input type="text" placeholder="Ajouter une note interne..." value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button type="submit" disabled={busy || !note.trim()}
                className="bg-primary text-primary-foreground px-4 rounded-xl flex items-center gap-1.5 text-sm font-medium disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* History */}
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