import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Lock, ChevronRight } from "lucide-react";
import BuyerLogin from "@/components/buyer/BuyerLogin";
import BuyerHeader from "@/components/buyer/BuyerHeader";
import BuyerTabs from "@/components/buyer/BuyerTabs";
import BuyerQueue from "@/components/buyer/BuyerQueue";
import ClaimedActions from "@/components/buyer/ClaimedActions";
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

  const queue = subs
    .filter((s) => !s.claimed_by && !TERMINAL.includes(s.status))
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const claimed = subs.find((s) => s.claimed_by === session.buyerId && !TERMINAL.includes(s.status));
  const done = subs.filter((s) => TERMINAL.includes(s.status));

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
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Erreur");
    }
    setBusyKey(null);
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
    } catch (e) {
      setError(e?.response?.data?.error || "Erreur");
    }
    setBusyKey(null);
  };

  if (!session) return <BuyerLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col">
      <BuyerHeader username={session.username} onLogout={handleLogout} />
      <BuyerTabs tab={tab} setTab={setTab} />

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <p className="text-red-600 text-xs font-medium">{error}</p>
        </div>
      )}

      <main className="flex-1 px-6 py-5">
        {tab === "queue" ? (
          <div className="grid md:grid-cols-2 gap-5">
            <BuyerQueue queue={queue} onClaim={handleClaim} busyId={claimingId} />
            {claimed ? (
              <ClaimedActions
                submission={claimed}
                onAction={handleAction}
                onBlacklist={handleBlacklist}
                busyKey={busyKey}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-400 text-sm">Select a request to manage it.</p>
              </div>
            )}
          </div>
        ) : (
          <BuyerHistory items={done} />
        )}
      </main>
    </div>
  );
}