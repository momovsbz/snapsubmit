import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, X, Clock } from "lucide-react";

const STALE_THRESHOLD = 10 * 60 * 1000;

export default function AlertsPanel({ submissions }) {
  const [newAlert, setNewAlert] = useState(null);
  const [staleCount, setStaleCount] = useState(0);
  const prevCountRef = useRef(0);
  const initializedRef = useRef(false);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // Detect new submissions
  useEffect(() => {
    const total = submissions.length;
    if (initializedRef.current && total > prevCountRef.current) {
      const diff = total - prevCountRef.current;
      setNewAlert(diff);
      playBeep();
      const timer = setTimeout(() => setNewAlert(null), 10000);
      prevCountRef.current = total;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = total;
    initializedRef.current = true;
  }, [submissions.length]);

  // Detect stale submissions (pending > 10 min)
  useEffect(() => {
    const now = Date.now();
    const stale = submissions.filter(s => {
      if (s.status !== "pending" || !s.created_date) return false;
      return now - new Date(s.created_date).getTime() > STALE_THRESHOLD;
    });
    setStaleCount(stale.length);
  }, [submissions]);

  return (
    <AnimatePresence>
      {(newAlert || staleCount > 0) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 mb-6"
        >
          {newAlert && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <motion.div
                className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Bell className="w-4 h-4 text-green-400" />
              </motion.div>
              <div className="flex-1">
                <p className="text-green-400 font-bold text-sm">
                  {newAlert} nouvelle{newAlert > 1 ? "s" : ""} demande{newAlert > 1 ? "s" : ""} reçue{newAlert > 1 ? "s" : ""} !
                </p>
                <p className="text-muted-foreground text-xs">Données actualisées automatiquement</p>
              </div>
              <button onClick={() => setNewAlert(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {staleCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-amber-400 font-bold text-sm">
                  {staleCount} demande{staleCount > 1 ? "s" : ""} en attente depuis +10 min
                </p>
                <p className="text-muted-foreground text-xs">Ces demandes nécessitent votre attention</p>
              </div>
              <Clock className="w-4 h-4 text-amber-400/50" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}