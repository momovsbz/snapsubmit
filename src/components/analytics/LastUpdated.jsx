import { useState, useEffect } from "react";

export default function LastUpdated({ timestamp }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timestamp || timestamp === 0) {
    return <span className="text-xs text-muted-foreground/60">· en attente…</span>;
  }

  const elapsed = Math.floor((Date.now() - timestamp) / 1000);
  const label = elapsed < 5 ? "à l'instant" : elapsed < 60 ? `il y a ${elapsed}s` : `il y a ${Math.floor(elapsed / 60)}min`;

  return <span className="text-xs text-muted-foreground/60">· Actualisé {label}</span>;
}