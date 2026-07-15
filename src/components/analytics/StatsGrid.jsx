import { motion } from "framer-motion";
import { Users, CheckCircle2, TrendingUp, AlertCircle, Clock, Zap, KeyRound, Target } from "lucide-react";

export default function StatsGrid({ total, verified, pending, wrong, expired, waiting, codeReady, conversionRate }) {
  const stats = [
    { icon: Users, label: "Total soumissions", value: total, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
    { icon: CheckCircle2, label: "Validées", value: verified, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
    { icon: TrendingUp, label: "Taux conversion", value: `${conversionRate}%`, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
    { icon: KeyRound, label: "Code prêt", value: codeReady, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    { icon: Clock, label: "En attente", value: pending, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    { icon: AlertCircle, label: "Mauvais codes", value: wrong, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
    { icon: Target, label: "Codes expirés", value: expired, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    { icon: Zap, label: "En file", value: waiting, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-card border ${stat.border} rounded-xl p-5 hover:scale-[1.02] transition-transform`}
          >
            <div className={`w-10 h-10 ${stat.bg} ${stat.border} border rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</div>
            <div className={`font-heading text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        );
      })}
    </div>
  );
}