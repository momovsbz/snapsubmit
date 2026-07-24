import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export default function SubscriptionTimer({ expiresAt, lang }) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, []);
  if (!expiresAt) return null;
  const remaining = new Date(expiresAt).getTime() - Date.now();
  const expired = remaining <= 0;
  const low = !expired && remaining < 3600 * 1000;
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
        expired
          ? "bg-destructive/15 text-destructive border-destructive/30"
          : low
          ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
          : "bg-secondary/40 text-foreground border-border"
      }`}
      title={lang === "fr" ? "Temps restant sur l'abonnement" : "Time left on subscription"}
    >
      <Clock className="w-3.5 h-3.5" />
      {expired ? (lang === "fr" ? "Expiré" : "Expired") : fmt(remaining)}
    </div>
  );
}