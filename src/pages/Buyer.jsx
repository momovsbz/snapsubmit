import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Ghost, LogOut, Inbox, History, Lock, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BuyerLogin from "@/components/buyer/BuyerLogin";
import SubmissionActions from "@/components/buyer/SubmissionActions";
import BuyerHistory from "@/components/buyer/BuyerHistory";
import { t, getStoredLang, setStoredLang } from "@/components/buyer/i18n";

const opPill = {
  SFR: "bg-red-500/15 text-red-400 border border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border border-orange-400/30",
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
  const [lang, setLang] = useState(getStoredLang());
  const [queue, setQueue] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [tab, setTab] = useState("file");
  const pollRef = useRef(null);

  const switchLang = (l) => { setLang(l); setStoredLang(l); };

  const loadQueue = async (silent = false) => {
    if (!buyerId) return;
    if (document.hidden) return;
    try {
      const res = await base44.functions.invoke("getBuyerQueue", { buyerId });
      if (res?.data?.ok) {
        setQueue(res.data.queue || []);
        setMine(res.data.mine || []);
        if (!silent) setError("");
      } else {
        const msg = res?.data?.error || "Erreur";
        if (msg === "Subscription expired") {
          handleLogout();
          return;
        }
        if (!silent) setError(msg === "Subscription expired" ? t(lang, "expiredErr") : msg);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Erreur de chargement";
      if (msg === "Subscription expired") { handleLogout(); return; }
      if (!silent) setError(msg);
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
    if (activeSub) return <SubmissionActions sub={activeSub} discord={discord} lang={lang} buyerId={buyerId} onDone={() => { setActiveId(null); loadQueue(true); }} />;
    if (selectedSub) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-xl shadow-black/40"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {t(lang, "queued")}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${opPill[selectedSub.operateur] || opPill.Bouygues}`}>
              {selectedSub.operateur}
            </span>
          </div>
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2">
              <Ghost className="w-4 h-4 text-muted-foreground" />
              <span className="text-base font-bold tracking-wide text-foreground">@{selectedSub.snapchat}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-mono text-foreground">{maskPhone(selectedSub.telephone)}</span>
            </div>
          </div>
          <button
            onClick={() => handleClaim(selectedSub.id)}
            disabled={claimingId === selectedSub.id}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {claimingId === selectedSub.id ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {t(lang, "claimLock")}
          </button>
          <p className="text-[11px] text-center text-muted-foreground mt-3">{t(lang, "revealHint")}</p>
        </motion.div>
      );
    }
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{t(lang, "selectHint")}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:py-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              SNAPCHAT+ <span className="text-primary">OPS</span>
            </h1>
            <p className="text-xs text-muted-foreground">{t(lang, "workspace")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-secondary/40 border border-border rounded-lg overflow-hidden text-[11px] font-bold">
              <button onClick={() => switchLang("en")} className={`px-2.5 py-1.5 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
              <button onClick={() => switchLang("fr")} className={`px-2.5 py-1.5 ${lang === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>FR</button>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {t(lang, "on")}
            </div>
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30">
              {t(lang, "customer")} @{discord}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border text-foreground bg-card hover:bg-secondary/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> {t(lang, "logOut")}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("file")}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              tab === "file" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <Inbox className="w-4 h-4" /> {t(lang, "activeQueue")}
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              tab === "history" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <History className="w-4 h-4" /> {t(lang, "myHistory")} ({mine.length})
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-4 text-destructive text-xs font-medium">{error}</div>
        )}

        {tab === "file" ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/40">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">{t(lang, "liveQueue")}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t(lang, "maskedHint")}</p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
                </div>
              ) : queue.length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <p className="text-sm text-muted-foreground">{t(lang, "emptyQueue")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {[t(lang, "user"), t(lang, "phone"), t(lang, "operator"), t(lang, "status")].map((h) => (
                          <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map((sub) => {
                        const isSel = sub.id === selectedId;
                        return (
                          <tr
                            key={sub.id}
                            onClick={() => setSelectedId(sub.id)}
                            className="cursor-pointer transition-colors hover:bg-secondary/30"
                            style={{ borderBottom: "1px solid hsl(var(--border))", background: isSel ? "hsl(var(--primary) / 0.12)" : "transparent" }}
                          >
                            <td className="px-5 py-3 font-medium text-foreground">@{sub.snapchat}</td>
                            <td className="px-5 py-3 font-mono text-foreground">{maskPhone(sub.telephone)}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${opPill[sub.operateur] || opPill.Bouygues}`}>
                                {sub.operateur}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                {t(lang, "queued")}
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
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-6">{renderRightCard()}</div>
            </div>
          </div>
        ) : (
          <BuyerHistory mine={mine} lang={lang} />
        )}
      </div>
    </div>
  );
}