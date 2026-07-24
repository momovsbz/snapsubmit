import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import BuyerLogin from "@/components/buyer/BuyerLogin";
import BuyerHeader from "@/components/buyer/BuyerHeader";
import BuyerTabs from "@/components/buyer/BuyerTabs";
import BuyerQueue from "@/components/buyer/BuyerQueue";
import ClaimedActions from "@/components/buyer/ClaimedActions";
import ClaimCard from "@/components/buyer/ClaimCard";
import BuyerHistory from "@/components/buyer/BuyerHistory";

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
  const [tab, setTab] = useState("queue");
  const [busyKey, setBusyKey] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [success, setSuccess] = useState("");

  const { data: buyer } = useQuery({
    queryKey: ["buyer", session?.buyerId],
    queryFn: () => base44.entities.Buyer.filter({ id: session.buyerId }).then((r) => r[0] || null),
    enabled: !!session,
    refetchInterval: 5000,
  });
  const active = !!buyer?.active;

  const { data: subs = [] } = useQuery({
    queryKey: ["buyer-subs", session?.buyerId],
    queryFn: () => base44.entities.Submission.list("-created_date", 500),
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

  const handleToggleQueue = async () => {
    setToggling(true);
    setError("");
    try {
      await base44.functions.invoke("setBuyerActive", { buyerId: session.buyerId, active: !active });
      queryClient.invalidateQueries(["buyer", session.buyerId]);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Erreur");
    }
    setToggling(false);
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

  const queue = subs
    .filter((s) => !s.claimed_by && !TERMINAL.includes(s.status))
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const claimed = subs.find((s) => s.claimed_by === session.buyerId && !TERMINAL.includes(s.status));
  const done = subs.filter((s) => TERMINAL.includes(s.status) && s.claimed_by === session.buyerId);

  const target = queue.find((s) => s.id === selectedId) || queue[0] || null;

  const handleAction = async (action) => {
    if (!claimed) return;
    setBusyKey(action);
    setError("");
    try {
      await base44.functions.invoke("sendCode", {
        submissionId: claimed.id,
        action,
        discord: session.username,
      });
      queryClient.invalidateQueries(["buyer-subs", session.buyerId]);
      setSuccess("Action effectuée");
      setTimeout(() => setSuccess(""), 2500);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Erreur");
    }
    setBusyKey(null);
  };

  const handleRemove = async (submissionId) => {
    setError("");
    try {
      await base44.functions.invoke("removeSubmission", { submissionId, buyerId: session.buyerId });
      queryClient.invalidateQueries(["buyer-subs", session.buyerId]);
      setSuccess("Supprimé de l'historique");
      setTimeout(() => setSuccess(""), 2500);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Erreur");
    }
  };

  const handleBlacklist = async () => {
    if (!claimed) return;
    setBusyKey("blacklist");
    setError("");
    try {
      await base44.functions.invoke("blacklistUser", {
        submissionId: claimed.id,
        ip: claimed.ip_address,
      });
      queryClient.invalidateQueries(["buyer-subs", session.buyerId]);
      setSuccess("Action effectuée");
      setTimeout(() => setSuccess(""), 2500);
    } catch (e) {
      setError(e?.response?.data?.error || "Erreur");
    }
    setBusyKey(null);
  };

  if (!session) return <BuyerLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BuyerHeader
        username={session.username}
        active={active}
        onToggleQueue={handleToggleQueue}
        toggling={toggling}
        onLogout={handleLogout}
      />
      <BuyerTabs tab={tab} setTab={setTab} />

      {success && (
        <div className="mx-6 mt-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5">
          <p className="text-green-400 text-xs font-medium">{success}</p>
        </div>
      )}

      <main className="flex-1 px-6 py-5">
        {tab === "queue" ? (
          <div className="grid md:grid-cols-[1.8fr_1fr] gap-5">
            <BuyerQueue queue={queue} selectedId={target?.id} onSelect={setSelectedId} />
            {claimed ? (
              <ClaimedActions
                submission={claimed}
                onAction={handleAction}
                onBlacklist={handleBlacklist}
                busyKey={busyKey}
              />
            ) : target ? (
              <ClaimCard submission={target} onClaim={handleClaim} busy={claimingId === target.id} active={active} />
            ) : (
              <div className="bg-card border border-border rounded-2xl flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground text-sm">No requests to claim right now.</p>
              </div>
            )}
          </div>
        ) : (
          <BuyerHistory items={done} onRemove={handleRemove} />
        )}
      </main>
    </div>
  );
}