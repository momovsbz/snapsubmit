import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl px-8 py-10 w-full max-w-sm shadow-2xl shadow-black/40 text-center"
      >
        <div className="w-14 h-14 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Accès Admin</h1>
        <p className="text-muted-foreground text-sm mb-6">Entrez le mot de passe pour continuer</p>
        {locked ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-5 text-center">
            <p className="text-destructive font-bold text-sm mb-1">🔒 Accès bloqué</p>
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
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors"
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
    queryFn: () => base44.entities.Submission.list("-created_date", 5000),
    enabled: unlocked,
  });

  const { data: blacklist = [] } = useQuery({
    queryKey: ["blacklist"],
    queryFn: () => base44.entities.BlacklistEntry.list(),
    enabled: unlocked,
  });

  useEffect(() => {
    if (!unlocked) return;
    
    // Load admin status
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl px-10 py-14 text-center shadow-2xl shadow-black/40 max-w-sm w-full"
      >
        <div className="text-6xl mb-5">✅</div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Action effectuée</h2>
        <p className="text-muted-foreground text-sm">Le statut de l'utilisateur a bien été mis à jour.</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex justify-between items-start gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Admin <span className="text-primary">Snap+</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Toutes les soumissions reçues</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleAdminStatus}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
                adminInactive
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30"
              }`}
            >
              {adminInactive ? "🔴 Absent" : "🟢 Actif"}
            </button>
            <button
              onClick={() => setShowBlacklist(!showBlacklist)}
              className="bg-destructive/20 text-destructive border border-destructive/40 px-4 py-2 rounded-lg text-xs font-bold hover:bg-destructive/30 transition-colors"
            >
              🚫 Blacklist ({blacklist.length})
            </button>
          </div>
        </div>

        {showBlacklist && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6"
          >
            <h3 className="text-sm font-bold text-destructive mb-3">Gérer la Blacklist</h3>
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
                className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-xs font-bold hover:bg-destructive/80"
              >
                Ajouter
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {blacklist.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-background p-2 rounded text-xs">
                  <span>{item.value} ({item.type === "phone" ? "📞" : "🌐"})</span>
                  <button
                    onClick={() => removeFromBlacklist(item.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total", value: stats.total, color: "text-primary" },
            { label: "SFR", value: stats.SFR, color: "text-red-400" },
            { label: "Bouygues", value: stats.Bouygues, color: "text-blue-400" },
            { label: "Orange", value: stats.Orange, color: "text-orange-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card border border-border rounded-xl p-5 text-center"
            >
              <div className={`font-heading text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-muted-foreground text-xs mt-1 font-medium uppercase tracking-wide">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-5xl block mb-4">👻</span>
              <p className="text-muted-foreground">Aucune soumission pour l'instant</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Snapchat</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Téléphone</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opérateur</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
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
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${blacklisted ? "bg-destructive/10 opacity-50" : ""}`}
                      >
                        <td className="px-6 py-4 text-muted-foreground text-sm font-mono">{i + 1}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground flex items-center gap-2">
                          <span className="text-base">👻</span> {sub.snapchat}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-mono">
                          {sub.telephone}
                          {blacklisted && <span className="ml-2 text-destructive text-xs">🚫</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${operatorBadge[sub.operateur]}`}>
                            {sub.operateur}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(sub.created_date).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          {isSent ? (
                            <span className="text-green-400 text-xs font-semibold">✅ Code envoyé</span>
                          ) : (
                            <button
                              onClick={() => handleSendCode(sub.id)}
                              disabled={isSending}
                              className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                            >
                              {isSending ? "Envoi..." : "📤 Envoyer le code"}
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
        </div>
      </div>
    </div>
  );
}