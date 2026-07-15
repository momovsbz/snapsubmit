import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Lock, LogOut, Power, RefreshCw } from "lucide-react";
import OperatorSubmissions from "@/components/OperatorSubmissions";
import StatsGrid from "@/components/analytics/StatsGrid";
import ConversionFunnel from "@/components/analytics/ConversionFunnel";
import TrendCharts from "@/components/analytics/TrendCharts";
import DistributionCharts from "@/components/analytics/DistributionCharts";
import ActivityTable from "@/components/analytics/ActivityTable";

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await base44.functions.invoke("verifyAdminPassword", { password: input });
      if (res?.data?.ok) {
        onUnlock();
      } else if (res?.data?.locked) {
        setLocked(true);
        setRemaining(res.data.remaining);
        setInput("");
      } else {
        const left = res?.data?.attemptsLeft;
        setError(left > 0 ? `Mot de passe incorrect — ${left} tentative(s) restante(s)` : "Mot de passe incorrect");
        setInput("");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      if (err?.response?.data?.locked) {
        setLocked(true);
        setRemaining(err.response.data.remaining);
      } else {
        setError("Mot de passe incorrect");
        setInput("");
        setTimeout(() => setError(""), 3000);
      }
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
        {locked ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-5 text-center">
            <p className="text-destructive font-bold text-sm mb-1">🔒 Accès bloqué</p>
            <p className="text-muted-foreground text-xs">Trop de tentatives échouées. Réessayez dans <span className="text-destructive font-semibold">{remaining} min</span>.</p>
          </div>
        ) : (
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
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors"
            >
              Accéder
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function Analytics() {
  const [unlocked, setUnlocked] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);

  const { data: submissions = [], isLoading: subLoading, refetch: refetchSubs, isFetching: subsFetching } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const all = [];
      for (let skip = 0; skip < 30000; skip += 5000) {
        const batch = await base44.entities.Submission.list("-created_date", 5000, skip);
        all.push(...batch);
        if (batch.length < 5000) break;
      }
      return all;
    },
    enabled: unlocked,
  });

  const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs, isFetching: logsFetching } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const all = [];
      for (let skip = 0; skip < 30000; skip += 5000) {
        const batch = await base44.entities.ActionLog.list("-timestamp", 5000, skip);
        all.push(...batch);
        if (batch.length < 5000) break;
      }
      return all;
    },
    enabled: unlocked,
  });

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  if (subLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Chargement des données…</p>
        </div>
      </div>
    );
  }

  // Filtrer par opérateur si sélectionné
  const filtered = selectedOperator ? submissions.filter(s => s.operateur === selectedOperator) : submissions;

  const total = filtered.length;
  const verified = filtered.filter(s => s.status === "code_valid").length;
  const pending = filtered.filter(s => s.status === "pending").length;
  const wrong = filtered.filter(s => s.status === "code_wrong").length;
  const expired = filtered.filter(s => s.status === "code_expired").length;
  const waiting = filtered.filter(s => s.status === "waiting_queue").length;
  const codeReady = filtered.filter(s => ["code_ready", "code6_ready", "code6sfr_ready", "code6orange_ready"].includes(s.status)).length;
  const conversionRate = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">
              Analytics <span className="text-primary">Snap+</span>
            </h1>
            <p className="text-muted-foreground text-sm">Statistiques et conversions en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { refetchSubs(); refetchLogs(); }}
              disabled={subsFetching || logsFetching}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${subsFetching || logsFetching ? "animate-spin" : ""}`} />
              Actualiser
            </button>
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

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
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

        {/* Operator submissions table */}
        {selectedOperator && (
          <OperatorSubmissions operator={selectedOperator} submissions={filtered} />
        )}

        {/* KPI Stats */}
        <StatsGrid
          total={total}
          verified={verified}
          pending={pending}
          wrong={wrong}
          expired={expired}
          waiting={waiting}
          codeReady={codeReady}
          conversionRate={conversionRate}
        />

        {/* Conversion Funnel */}
        <ConversionFunnel total={total} codeReady={codeReady} verified={verified} />

        {/* Trend Charts */}
        <TrendCharts submissions={filtered} />

        {/* Distribution Charts */}
        <DistributionCharts submissions={filtered} logs={logs} />

        {/* Activity Table */}
        <ActivityTable logs={logs} />
      </div>
    </div>
  );
}