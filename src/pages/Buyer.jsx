import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { LogOut, ShoppingBag, CheckCircle2 } from "lucide-react";
import BuyerLogin from "@/components/buyer/BuyerLogin";
import BuyerQueue from "@/components/buyer/BuyerQueue";
import ClaimedActions from "@/components/buyer/ClaimedActions";

const TERMINAL = ["code_valid", "code_wrong", "code_expired"];

export default function Buyer() {
  const [session, setSession] = useState(() => {
    try {
      const s = sessionStorage.getItem("buyerSession");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const queryClient = useQueryClient();
  const [busyKey, setBusyKey] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState("");

  const { data: subs = [] } = useQuery({
    queryKey: ["buyer-subs", session?.buyerId],
    queryFn: () => base44.entities.Submission.filter({ assigned_buyer_id: session.buyerId }, "-created_date", 500),
    enabled: !!session,
    refetchInterval: 3000,
  });

  const handleLogin = (buyerId, username) => {
    const s = { buyerId, username };
    sessionStorage.setItem("buyerSession", JSON.stringify(s));
    setSession(s);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("buyerSession");
    setSession(null);
  };

  const handleClaim = async (submissionId) => {
    setClaimingId(submissionId);
    setError("");
    try {
      await base44.functions.invoke("claimSubmission", { submissionId, buyerId: session.buyerId });
      queryClient.invalidateQueries(["buyer-subs", session.buyerId]);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Erreur");
    }
    setClaimingId(null);
  };

  const handleAction = async (submissionId, action) => {
    setBusyKey(action);
    setError("");
    try {
      await base44.functions.invoke("sendCode", { submissionId, action, discord: session.username });
      queryClient.invalidateQueries(["buyer-subs", session.buyerId]);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Erreur");
    }
    setBusyKey(null);
  };

  const handleBlacklist = async (submissionId, ip) => {
    setBusyKey("blacklist");
    setError("");
    try {
      await base44.functions.invoke("blacklistUser", { submissionId, ip });
      queryClient.invalidateQueries(["buyer-subs", session.buyerId]);
    } catch (e) {
      setError(e?.response?.data?.error || "Erreur");
    }
    setBusyKey(null);
  };

  if (!session) return <BuyerLogin onLogin={handleLogin} />;

  const queue = subs
    .filter((s) => !s.claimed_by && !TERMINAL.includes(s.status))
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const claimed = subs.find((s) => s.claimed_by === session.buyerId && !TERMINAL.includes(s.status));
  const doneCount = subs.filter((s) => TERMINAL.includes(s.status)).length;

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-md mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-foreground leading-tight">
              {session.username}
            </h1>
            <p className="text-muted-foreground text-xs">{queue.length} en attente · {doneCount} terminée(s)</p>
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition-colors" title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </motion.div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 mb-4">
            <p className="text-destructive text-xs font-medium">{error}</p>
          </div>
        )}

        {claimed ? (
          <div className="mb-6">
            <ClaimedActions
              submission={claimed}
              onAction={(action) => handleAction(claimed.id, action)}
              onBlacklist={() => handleBlacklist(claimed.id, claimed.ip_address)}
              busyKey={busyKey}
            />
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 px-1">Votre file d'attente</h2>
            <BuyerQueue queue={queue} onClaim={handleClaim} busyId={claimingId} />
          </div>
        )}

        {doneCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mt-6">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            {doneCount} soumission(s) traitée(s) aujourd'hui
          </div>
        )}
      </div>
    </div>
  );
}