import { motion } from "framer-motion";
import { Filter } from "lucide-react";

export default function ConversionFunnel({ total, codeReady, verified }) {
  const steps = [
    { label: "Soumissions", value: total, color: "#3b82f6", percent: 100 },
    { label: "Code reçu", value: codeReady, color: "#f59e0b", percent: total > 0 ? Math.round((codeReady / total) * 100) : 0 },
    { label: "Validées", value: verified, color: "#22c55e", percent: total > 0 ? Math.round((verified / total) * 100) : 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 mb-8"
    >
      <h3 className="font-heading font-bold text-foreground mb-6 flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary" />
        Tunnel de conversion
      </h3>
      <div className="space-y-5">
        {steps.map((step, i) => (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{step.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">{step.value}</span>
                <span className="text-xs text-muted-foreground">{step.percent}%</span>
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${step.percent}%` }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="h-full rounded-full"
                style={{ backgroundColor: step.color }}
              />
            </div>
            {i < steps.length - 1 && step.value > 0 && (
              <div className="text-xs text-muted-foreground mt-1.5 ml-2">
                → {step.value > 0 ? Math.round((steps[i + 1].value / step.value) * 100) : 0}% de cette étape validée
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}