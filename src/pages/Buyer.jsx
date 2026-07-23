import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn, LogOut, Clock, CheckCircle2, Smartphone, Hash, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/Logo";

export default function Buyer() {
  const [buyer, setBuyer] = useState(() => {
    try {
      const s = sessionStorage.getItem("buyer");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [status, setStatus] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!buyer?.id) return;
    try {
      const res = await base44.functions.invoke("buyerQueueStatus", { buyerId: buyer.id });
      setStatus(res?.data || null);
    } catch {}
  }, [buyer?.id]);

  useEffect(() => {
    if (!buyer?.id) return;
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => clearInterval(pollRef.current);
  }, [buyer?.id, fetchStatus]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.password) {
      setError("Champs requis");
      return;
    }
    setLoggingIn(true);
    try {
      const res = await base44.functions.invoke("buyerLogin", form);
      if (res?.data?.error) throw new Error(res.data.error);
      const b = res.data.buyer;
      sessionStorage.setItem("buyer", JSON.stringify(b));
      setBuyer(b);
      setForm({ username: "", password: "" });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Erreur");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleClaim = async () => {
    if (!status?.currentSubmission) return;
    setClaiming(true);
    setClaimError("");
    try {
      const res = await base44.functions.invoke("claimSubmission", {
        buyerId: buyer.id,
        submissionId: status.currentSubmission.id,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      fetchStatus();
    } catch (err) {
      setClaimError(err?.response?.data?.error || err.message || "Erreur");
      fetchStatus();
    } finally {
      setClaiming(false);
    }
  };

  const handleLogout = async () => {
    if (buyer?.id) {
      await base44.functions.invoke("leaveQueue", { buyerId: buyer.id }).catch(() => {});
    }
    sessionStorage.removeItem("buyer");
    setBuyer(null);
    setStatus(null);
  };

  // ---- Login screen ----
  if (!buyer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card border border-border rounded-3xl px-5 py-6 shadow-2xl">
            <div className="mb-5">
              <Logo />
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Espace buyer</h2>
            <p className="text-muted-foreground text-sm mb-4">Connecte-toi pour rejoindre la file</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground/70">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full mt-1 bg-secondary/30 border border-border rounded-xl px-3.5 py-3.5 text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="buyer_01"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/70">Mot de passe</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full mt-1 bg-secondary/30 border border-border rounded-xl px-3.5 py-3.5 text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="••••••"
                />
              </div>
              {error && <p className="text-destructive text-xs font-medium">{error}</p>}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Se connecter
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Logged in: queue view ----
  const inQueue = status?.inQueue;
  const isFront = status?.isFront;
  const position = status?.position;
  const sub = status?.currentSubmission;
  const claimed = status?.claimed;
  const claimedSub = status?.claimedSubmission;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
              {buyer.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">{buyer.username}</p>
              <p className="text-muted-foreground text-xs">Espace buyer</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Quitter
          </button>
        </div>

        {/* Claimed submission */}
        {claimed && claimedSub && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/40 rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">Soumission attribuée</h2>
            </div>
            <SubmissionCard sub={claimedSub} />
            <p className="text-muted-foreground text-xs mt-3 text-center">
              Tu as été servi. Reconnecte-toi pour recevoir une nouvelle soumission.
            </p>
          </motion.div>
        )}

        {/* In queue, waiting */}
        {inQueue && !isFront && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 text-center shadow-xl"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <Clock className="w-7 h-7 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-1">Tu es en position</p>
            <p className="font-heading text-5xl font-bold text-primary mb-3">#{position}</p>
            <p className="text-muted-foreground text-xs">
              Patiente, tu recevras une soumission dès que ce sera ton tour.
            </p>
          </motion.div>
        )}

        {/* In queue, front */}
        {inQueue && isFront && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/40 rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                C'EST TON TOUR
              </span>
            </div>
            {sub ? (
              <>
                <p className="text-muted-foreground text-xs mb-3 text-center">Nouvelle soumission disponible</p>
                <SubmissionCard sub={sub} />
                {claimError && <p className="text-destructive text-xs font-medium mt-2 text-center">{claimError}</p>}
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full mt-4 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Récupérer cette soumission
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">En attente d'une nouvelle soumission...</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SubmissionCard({ sub }) {
  const formatPhone = (tel) => {
    const d = String(tel).replace(/\D/g, "").slice(-10);
    return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  };
  const opColor = {
    SFR: "text-red-400 bg-red-500/10 border-red-500/30",
    Bouygues: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    Orange: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  };
  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-foreground font-semibold text-sm">@{sub.snapchat}</span>
      </div>
      <div className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${opColor[sub.operateur] || ""}`}>
        {sub.operateur}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Hash className="w-3.5 h-3.5" />
        {formatPhone(sub.telephone)}
      </div>
      {sub.country && sub.country !== "Inconnue" && (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Globe className="w-3.5 h-3.5" />
          {sub.country}
        </div>
      )}
    </div>
  );
}