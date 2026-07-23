import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Ghost, LogOut, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BuyerLogin from "@/components/buyer/BuyerLogin";
import SubmissionActions from "@/components/buyer/SubmissionActions";
import Logo from "@/components/Logo";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

export default function Buyer() {
  const [buyerId, setBuyerId] = useState(() => sessionStorage.getItem("buyerId"));
  const [discord, setDiscord] = useState(() => sessionStorage.getItem("buyerDiscord"));
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const pollRef = useRef(null);

  const loadQueue = async (silent = false) => {
    if (!buyerId) return;
    if (document.hidden) return;
    try {
      const res = await base44.functions.invoke("getBuyerQueue", { buyerId });
      if (res?.data?.ok) {
        setQueue(res.data.queue || []);
        if (!silent) setError("");
      } else if (!silent) {
        setError(res?.data?.error || "Erreur");
      }
    } catch (err) {
      if (!silent) setError(err?.response?.data?.error || "Erreur de chargement");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!buyerId) return;
    loadQueue();
    pollRef.current = setInterval(() => loadQueue(true), 10000);
    const onVisible = () => { if (!document.hidden) loadQueue(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [buyerId]);

  const handleClaim = async (id) => {
    setClaimingId(id);
    try {
      const res = await base44.functions.invoke("claimSubmission", { submissionId: id, buyerId });
      if (res?.data?.ok) {
        setActiveId(id);
        await loadQueue();
      } else {
        setError(res?.data?.error || "Échec");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Échec");
    }
    setClaimingId(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("buyerId");
    sessionStorage.removeItem("buyerDiscord");
    setBuyerId(null);
    setDiscord(null);
    setQueue([]);
    setActiveId(null);
  };

  if (!buyerId) {
    return <BuyerLogin onSuccess={(id, d) => { setBuyerId(id); setDiscord(d); setLoading(true); }} />;
  }

  const activeSub = queue.find((s) => s.id === activeId);

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-xs font-bold hover:bg-secondary/70 transition-colors border border-border"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>

        <div className="mb-5">
          <h1 className="font-heading text-xl font-bold text-foreground">File d'attente</h1>
          <p className="text-muted-foreground text-xs">
            Connecté en tant que <span className="text-primary font-semibold">@{discord}</span> · {queue.length} soumission(s)
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-4 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        {activeSub && (
          <div className="mb-5">
            <SubmissionActions
              sub={activeSub}
              discord={discord}
              onDone={() => { setActiveId(null); loadQueue(); }}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-16 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aucune soumission assignée pour l'instant</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((sub, i) => {
              const isActive = sub.id === activeId;
              const claimed = !!sub.admin_ip;
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className={`bg-card border rounded-2xl p-4 flex items-center justify-between gap-3 ${isActive ? "border-primary/40" : "border-border"}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Ghost className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                        <span className="text-sm font-semibold text-foreground truncate">{sub.snapchat}</span>
                        <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${operatorBadge[sub.operateur]}`}>
                          {sub.operateur}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{sub.telephone}</p>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-xs text-primary font-bold flex-shrink-0">En cours</span>
                  ) : claimed ? (
                    <button
                      onClick={() => setActiveId(sub.id)}
                      className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg flex-shrink-0"
                    >
                      Rouvrir
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClaim(sub.id)}
                      disabled={claimingId === sub.id}
                      className="bg-primary text-primary-foreground text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 flex-shrink-0 flex items-center gap-1.5"
                    >
                      {claimingId === sub.id && <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />}
                      Réclamer
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}