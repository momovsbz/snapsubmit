import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, Loader2, Users, Activity, Inbox, Trash2,
  ArrowUp, Unlock, RefreshCw, UserPlus, Filter, UserCheck,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { addLog, queueId, formatTime, ACTION_META } from "@/lib/queueHelpers";
import QueueNav from "@/components/queue/QueueNav";
import StatusBadge from "@/components/queue/StatusBadge";

const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "unassigned", label: "Non assignées" },
  { id: "waiting", label: "En attente" },
  { id: "claimed", label: "Réclamées" },
  { id: "completed", label: "Terminées" },
  { id: "cancelled", label: "Annulées" },
  { id: "escalated", label: "Escaladées" },
];

export default function OwnerPanel() {
  const [subs, setSubs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unassigned");
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [assignPick, setAssignPick] = useState({});

  const load = async () => {
    try {
      const [all, l, b] = await Promise.all([
        base44.entities.QueueSubmission.list("queue_number", 500),
        base44.entities.QueueLog.list("-timestamp", 100),
        base44.entities.User.filter({ role: "buyer" }).catch(() => []),
      ]);
      setSubs(all);
      setLogs(l);
      setBuyers(b || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    load();
    const u1 = base44.entities.QueueSubmission.subscribe(load);
    const u2 = base44.entities.QueueLog.subscribe(load);
    return () => { u1(); u2(); };
  }, []);

  const actor = () => ({ id: me?.id, name: me?.full_name || me?.email, role: me?.role });

  const assign = async (s, buyerId) => {
    if (!buyerId) return;
    setBusy(true);
    try {
      const buyer = buyers.find((b) => b.id === buyerId);
      const a = actor();
      await base44.entities.QueueSubmission.update(s.id, {
        assigned_to_id: buyerId,
        assigned_to_name: buyer?.full_name || buyer?.email || "Buyer",
      });
      await addLog({
        submission_id: s.id, queue_number: s.queue_number, action: "assigned",
        actor_id: a.id, actor_name: a.name, actor_role: a.role,
        note: `Assignée à ${buyer?.full_name || buyer?.email || "buyer"}`,
      });
      setAssignPick({ ...assignPick, [s.id]: "" });
    } catch {}
    setBusy(false);
  };

  const unclaim = async (s) => {
    setBusy(true);
    try {
      const a = actor();
      await base44.entities.QueueSubmission.update(s.id, {
        status: "waiting", claimed_by_id: "", claimed_by_name: "", claimed_date: "",
      });
      await addLog({ submission_id: s.id, queue_number: s.queue_number, action: "unclaimed", actor_id: a.id, actor_name: a.name, actor_role: a.role, note: "Libérée par l'admin" });
    } catch {}
    setBusy(false);
  };

  const moveTop = async (s) => {
    setBusy(true);
    try {
      const min = subs.reduce((m, x) => Math.min(m, x.queue_number || 999999), 999999);
      await base44.entities.QueueSubmission.update(s.id, { queue_number: min - 1 });
    } catch {}
    setBusy(false);
  };

  const remove = async (s) => {
    if (!confirm(`Supprimer la demande ${queueId(s.queue_number)} ?`)) return;
    setBusy(true);
    try {
      await base44.entities.QueueSubmission.delete(s.id);
    } catch {}
    setBusy(false);
  };

  const resetAll = async () => {
    if (!confirm("Réinitialiser toute la file ? Toutes les soumissions seront supprimées.")) return;
    setBusy(true);
    try {
      await base44.entities.QueueSubmission.deleteMany({});
      const a = actor();
      await addLog({ submission_id: "queue", queue_number: 0, action: "reset", actor_id: a.id, actor_name: a.name, actor_role: a.role });
    } catch {}
    setBusy(false);
  };

  const inviteBuyer = async (e) => {
    e.preventDefault();
    setInviteMsg("");
    if (!inviteEmail.trim()) return;
    try {
      await base44.users.inviteUser(inviteEmail.trim(), "buyer");
      setInviteMsg(`Invitation envoyée à ${inviteEmail.trim()}`);
      setInviteEmail("");
      load();
    } catch (err) {
      setInviteMsg(err?.message || "Échec de l'invitation");
    }
  };

  const filtered = filter === "all" ? subs
    : filter === "unassigned" ? subs.filter((s) => !s.assigned_to_id)
    : subs.filter((s) => s.status === filter);

  const stats = {
    waiting: subs.filter((s) => s.status === "waiting").length,
    claimed: subs.filter((s) => s.status === "claimed").length,
    completed: subs.filter((s) => s.status === "completed").length,
    escalated: subs.filter((s) => s.status === "escalated").length,
    unassigned: subs.filter((s) => !s.assigned_to_id && s.status === "waiting").length,
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
              <ShieldCheck className="w-6 h-6 text-primary" /> Owner Panel
            </h1>
            <p className="text-muted-foreground text-sm">Pilotage de la file, buyers et assignations.</p>
          </div>
          <button onClick={resetAll} disabled={busy}
            className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50">
            <RefreshCw className="w-4 h-4" /> Réinitialiser
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Non assignées", value: stats.unassigned, color: "text-red-400", icon: UserCheck },
            { label: "En attente", value: stats.waiting, color: "text-amber-400", icon: Inbox },
            { label: "Réclamées", value: stats.claimed, color: "text-blue-400", icon: Users },
            { label: "Terminées", value: stats.completed, color: "text-emerald-400", icon: ShieldCheck },
            { label: "Escaladées", value: stats.escalated, color: "text-red-400", icon: Activity },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* Buyers management */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Buyers ({buyers.length})
          </h2>
          <form onSubmit={inviteBuyer} className="flex gap-2 mb-3">
            <input type="email" placeholder="email du buyer à inviter" value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button type="submit" className="bg-primary text-primary-foreground rounded-xl px-4 flex items-center gap-1.5 text-sm font-medium hover:opacity-90">
              <UserPlus className="w-4 h-4" /> Inviter
            </button>
          </form>
          {inviteMsg && <p className="text-xs text-muted-foreground mb-3">{inviteMsg}</p>}
          {buyers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun buyer pour le moment. Ajoutez-en un pour assigner les demandes.</p>
          ) : (
            <div className="space-y-2">
              {buyers.map((b) => {
                const count = subs.filter((s) => s.assigned_to_id === b.id && s.status === "waiting").length;
                return (
                  <div key={b.id} className="flex items-center justify-between bg-secondary/20 rounded-xl px-4 py-2.5">
                    <div>
                      <div className="text-sm font-medium">{b.full_name || b.email}</div>
                      <div className="text-xs text-muted-foreground">{b.email}</div>
                    </div>
                    <span className="text-xs text-amber-400 font-medium">{count} en attente</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submissions */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold">Soumissions</h2>
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.id ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune soumission.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div key={s.id} className="bg-secondary/20 rounded-xl p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-heading font-bold text-primary w-14 flex-shrink-0">{queueId(s.queue_number)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={s.status} />
                        {s.assigned_to_name
                          ? <span className="text-xs text-blue-400">→ {s.assigned_to_name}</span>
                          : <span className="text-xs text-red-400 font-medium">Non assignée</span>}
                        {s.claimed_by_name && <span className="text-xs text-muted-foreground">· {s.claimed_by_name}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-sm text-foreground/80">
                        <span>@{s.snapchat || "—"}</span>
                        <span className="text-muted-foreground">{s.telephone ? s.telephone.replace(/(\d{2})(?=\d)/g, "$1 ") : ""}</span>
                        {s.operateur && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/40 text-muted-foreground">{s.operateur}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link to={`/queue/buyer/${s.id}`} title="Ouvrir"
                        className="p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                        <ShieldCheck className="w-4 h-4" />
                      </Link>
                      {s.status === "waiting" && (
                        <button onClick={() => moveTop(s)} disabled={busy} title="Mettre en tête"
                          className="p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-primary transition-colors">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      )}
                      {(s.status === "claimed" || s.status === "escalated") && (
                        <button onClick={() => unclaim(s)} disabled={busy} title="Libérer"
                          className="p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-amber-400 transition-colors">
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => remove(s)} disabled={busy} title="Supprimer"
                        className="p-2 rounded-lg bg-secondary/40 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Assignment control */}
                  {!s.assigned_to_id && s.status === "waiting" && (
                    <div className="flex items-center gap-2 mt-2 pl-14">
                      <UserCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <select
                        value={assignPick[s.id] || ""}
                        onChange={(e) => setAssignPick({ ...assignPick, [s.id]: e.target.value })}
                        className="flex-1 bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="">Choisir un buyer…</option>
                        {buyers.map((b) => (
                          <option key={b.id} value={b.id}>{b.full_name || b.email}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => assign(s, assignPick[s.id])}
                        disabled={busy || !assignPick[s.id]}
                        className="bg-primary text-primary-foreground text-sm font-medium px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        Assigner
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity log */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Journal d'activité
          </h2>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.map((l, i) => {
                const m = ACTION_META[l.action] || { label: l.action, icon: "•" };
                return (
                  <div key={l.id || i} className="flex items-start gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                    <span className="text-base flex-shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{m.label}</span>
                      {l.queue_number ? <span className="text-primary"> · {queueId(l.queue_number)}</span> : null}
                      <span className="text-muted-foreground"> — {l.actor_name || "Système"}</span>
                      {l.note && <span className="text-muted-foreground"> — {l.note}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(l.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}