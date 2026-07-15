import { motion } from "framer-motion";
import { PieChart as PieIcon, BarChart3, Activity, Eye } from "lucide-react";
import { PieChart, Pie, Cell, RadialBarChart, RadialBar, Tooltip, ResponsiveContainer, PolarAngleAxis } from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
};

export default function DistributionCharts({ submissions, logs }) {
  // Status distribution
  const verified = submissions.filter(s => s.status === "code_valid").length;
  const pending = submissions.filter(s => s.status === "pending").length;
  const wrong = submissions.filter(s => s.status === "code_wrong").length;
  const expired = submissions.filter(s => s.status === "code_expired").length;
  const waiting = submissions.filter(s => s.status === "waiting_queue").length;

  const statusData = [
    { name: "Validé", value: verified, color: "#22c55e" },
    { name: "En attente", value: pending, color: "#3b82f6" },
    { name: "Mauvais", value: wrong, color: "#ef4444" },
    { name: "Expiré", value: expired, color: "#f97316" },
    { name: "Queue", value: waiting, color: "#a855f7" },
  ].filter(d => d.value > 0);

  // Operator performance
  const operatorPerf = ["SFR", "Bouygues", "Orange"].map(op => {
    const opSubs = submissions.filter(s => s.operateur === op);
    const opValid = opSubs.filter(s => s.status === "code_valid").length;
    return {
      operator: op,
      total: opSubs.length,
      verified: opValid,
      rate: opSubs.length > 0 ? Math.round((opValid / opSubs.length) * 100) : 0,
      fill: op === "SFR" ? "#ef4444" : op === "Bouygues" ? "#3b82f6" : "#f97316",
    };
  });

  // Device data
  const deviceData = (() => {
    const devices = {};
    logs.forEach(log => {
      const device = log.details?.device || "Unknown";
      devices[device] = (devices[device] || 0) + 1;
    });
    return Object.entries(devices).map(([device, count]) => ({ name: device, count }));
  })();

  // Country data
  const countryData = (() => {
    const countries = {};
    logs.forEach(log => {
      const country = log.details?.country || "France";
      countries[country] = (countries[country] || 0) + 1;
    });
    return Object.entries(countries)
      .map(([country, count]) => ({ name: country, count }))
      .slice(0, 5);
  })();

  const maxDevice = Math.max(...deviceData.map(d => d.count), 1);
  const maxCountry = Math.max(...countryData.map(c => c.count), 1);

  return (
    <>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {statusData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-primary" />
              Distribution des statuts
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingScale={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-muted-foreground">{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Taux de réussite par opérateur
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="30%" outerRadius="100%" data={operatorPerf} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="rate" background cornerRadius={8} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {operatorPerf.map(op => (
              <div key={op.operator} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: op.fill }} />
                <span className="text-xs text-muted-foreground">{op.operator}: {op.rate}% ({op.verified}/{op.total})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Device & Country */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {deviceData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-6">
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
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(device.count / maxDevice) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{device.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {countryData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-6">
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
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(country.count / maxCountry) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{country.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}