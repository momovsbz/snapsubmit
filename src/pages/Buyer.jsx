import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Ghost, LogOut, Inbox, History, Lock, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BuyerLogin from "@/components/buyer/BuyerLogin";
import SubmissionActions from "@/components/buyer/SubmissionActions";
import BuyerHistory from "@/components/buyer/BuyerHistory";

const opPill = {
  SFR: { bg: "#FDECEA", fg: "#C0392B" },
  Bouygues: { bg: "#CDE8F0", fg: "#0869A6" },
  Orange: { bg: "#FDEBD0", fg: "#B9770E" },
};

const maskSnap = (s) => {
  if (!s) return "";
  const c = String(s).replace(/^@/, "");
  if (c.length <= 1) return "@" + c;
  return "@" + c[0] + "•".repeat(Math.min(c.length - 1, 6));
};

const maskPhone = (tel) => {
  const d = String(tel || "").replace(/\D/g, "");
  if (d.length < 6) return "••••••";
  return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ****`;
};

export default function Buyer() {
  const [buyerId, setBuyerId] = useState(() => sessionStorage.getItem("buyerId"));
  const [discord, setDiscord] = useState(() => sessionStorage.getItem("buyerDiscord"));
  const [queue, setQueue] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [tab, setTab] = useState("file");
  const pollRef = useRef(null);

  const loadQueue = async (silent = false) => {
    if (!buyerId) return;
    if (document.hidden) return;
    try {
      const res = await base44.functions.invoke("getBuyerQueue", { buyerId });
      if (res?.data?.ok) {
        setQueue(res.data.queue || []);
        setMine(res.data.mine || []);
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
    const onVisible = () => {
      if (!document.hidden) loadQueue(true);
    };
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
        setSelectedId(null);
        await loadQueue(true);
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
    setMine([]);
    setActiveId(null);
    setSelectedId(null);
  };

  if (!buyerId) {
    return <BuyerLogin onSuccess={(id, d) => { setBuyerId(id); setDiscord(d); setLoading(true); }} />;
  }

  const activeSub = mine.find((s) => s.id === activeId);
  const selectedSub = queue.find((s) => s.id === selectedId);

  const renderRightCard = () => {
    if (activeSub) return <SubmissionActions sub={activeSub} discord={discord} onDone={() => { setActiveId(null); loadQueue(true); }} />;
    if (selectedSub) {
      const op = opPill[selectedSub.operateur] || opPill.Bouygues;
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border"
          style={{ borderColor: "#DFE6E9" }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#CDE8F0", color: "#0869A6" }}>
              En file
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold" style={{ background: op.bg, color: op.fg }}>
              {selectedSub.operateur}
            </span>
          </div>
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2">
              <Ghost className="w-4 h-4" style={{ color: "#636E72" }} />
              <span className="text-base font-bold tracking-wide" style={{ color: "#2D3436" }}>{maskSnap(selectedSub.snapchat)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-mono" style={{ color: "#2D3436" }}>{maskPhone(selectedSub.telephone)}</span>
            </div>
          </div>
          <button
            onClick={() => handleClaim(selectedSub.id)}
            disabled={claimingId === selectedSub.id}
            className="w-full font-bold py-3.5 rounded-xl text-sm text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#0D7061" }}
          >
            {claimingId === selectedSub.id ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Claim & lock for me
          </button>
          <p className="text-[11px] text-center mt-3" style={{ color: "#636E72" }}>
            Le numéro et le pseudo seront dévoilés après réclamation.
          </p>
        </motion.div>
      );
    }
    return (
      <div className="bg-white rounded-2xl p-8 text-center border" style={{ borderColor: "#DFE6E9" }}>
        <Inbox className="w-10 h-10 mx-auto mb-3" style={{ color: "#B2BEC3" }} />
        <p className="text-sm" style={{ color: "#636E72" }}>Sélectionnez un numéro dans la file pour le réclamer.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-8" style={{ background: "#F9F9FB" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight" style={{ color: "#2D3436" }}>
              SNAPCHAT+ <span style={{ color: "#0D7061" }}>OPS</span>
            </h1>
            <p className="text-xs" style={{ color: "#636E72" }}>Client workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#636E72" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#0D7061" }} />
              On
            </div>
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: "#E6F2EF", color: "#0D7061" }}>
              customer @{discord}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
              style={{ borderColor: "#DFE6E9", color: "#2D3436", background: "#fff" }}
            >
              <LogOut className="w-3.5 h-3.5" /> Log out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("file")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={tab === "file" ? { background: "#0D7061", color: "#fff" } : { background: "#fff", color: "#636E72", border: "1px solid #DFE6E9" }}
          >
            <Inbox className="w-4 h-4" /> Active queue
          </button>
          <button
            onClick={() => setTab("history")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={tab === "history" ? { background: "#0D7061", color: "#fff" } : { background: "#fff", color: "#636E72", border: "1px solid #DFE6E9" }}
          >
            <History className="w-4 h-4" /> My history ({mine.length})
          </button>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-xs font-medium" style={{ background: "#FDECEA", color: "#C0392B", border: "1px solid #F5C6CB" }}>
            {error}
          </div>
        )}

        {tab === "file" ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Live queue table */}
            <div className="lg:col-span-3 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#DFE6E9" }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: "#DFE6E9" }}>
                <h3 className="text-sm font-bold" style={{ color: "#2D3436" }}>Live queue</h3>
                <p className="text-[11px] mt-0.5" style={{ color: "#636E72" }}>Numbers stay masked until you claim them.</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "#DFE6E9", borderTopColor: "#0D7061" }} />
                </div>
              ) : queue.length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#0D7061" }} />
                  <p className="text-sm" style={{ color: "#636E72" }}>File vide — aucune soumission à réclamer.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #DFE6E9" }}>
                        {["USER", "PHONE", "OPERATOR", "STATUS"].map((h) => (
                          <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#636E72" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map((sub) => {
                        const op = opPill[sub.operateur] || opPill.Bouygues;
                        const isSel = sub.id === selectedId;
                        return (
                          <tr
                            key={sub.id}
                            onClick={() => setSelectedId(sub.id)}
                            className="cursor-pointer transition-colors"
                            style={{
                              borderBottom: "1px solid #F2F4F4",
                              background: isSel ? "#EAF4F1" : "transparent",
                            }}
                          >
                            <td className="px-5 py-3 font-medium" style={{ color: "#2D3436" }}>{maskSnap(sub.snapchat)}</td>
                            <td className="px-5 py-3 font-mono" style={{ color: "#2D3436" }}>{maskPhone(sub.telephone)}</td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: op.bg, color: op.fg }}>
                                {sub.operateur}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: "#CDE8F0", color: "#0869A6" }}>
                                Queued
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right action card */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-6">{renderRightCard()}</div>
            </div>
          </div>
        ) : (
          <BuyerHistory mine={mine} />
        )}
      </div>
    </div>
  );
}