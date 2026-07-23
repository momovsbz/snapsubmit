import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, ListOrdered, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/Logo";

export default function Owner() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [buyers, setBuyers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [b, q] = await Promise.all([
        base44.functions.invoke("listBuyers", {}),
        base44.functions.invoke("listQueue", {}),
      ]);
      setBuyers(b?.data?.buyers || []);
      setQueue(q?.data?.queue || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 3000);
    return () => clearInterval(i);
  }, [refresh]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.username.trim() || !form.password) {
      setError("Nom d'utilisateur et mot de passe requis");
      return;
    }
    setCreating(true);
    try {
      const res = await base44.functions.invoke("createBuyer", form);
      if (res?.data?.error) throw new Error(res.data.error);
      setSuccess(`Buyer « ${res.data.buyer.username} » créé`);
      setForm({ username: "", password: "" });
      refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Erreur");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Owner Panel</h1>
            <p className="text-muted-foreground text-sm">Création et gestion des buyers</p>
          </div>
          <Logo />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create buyer */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">Créer un buyer</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground/70">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full mt-1 bg-secondary/30 border border-border rounded-xl px-3.5 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="buyer_01"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground/70">Mot de passe</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full mt-1 bg-secondary/30 border border-border rounded-xl px-3.5 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="••••••"
                />
              </div>
              {error && <p className="text-destructive text-xs font-medium">{error}</p>}
              {success && <p className="text-primary text-xs font-medium">{success}</p>}
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Créer le buyer
              </button>
            </form>
            <div className="mt-4 flex items-center gap-1.5 text-muted-foreground/60 text-xs">
              <LinkIcon className="w-3.5 h-3.5" />
              Les buyers se connectent sur <span className="text-foreground/80 font-mono">/buyer</span>
            </div>
          </motion.div>

          {/* Queue live */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <ListOrdered className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">File d'attente</h2>
              <span className="ml-auto text-xs text-muted-foreground">{queue.length} en attente</span>
            </div>
            {queue.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Aucun buyer en file</p>
            ) : (
              <div className="space-y-2">
                {queue.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 border ${
                      q.position === 1
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-secondary/20"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        q.position === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {q.position}
                    </span>
                    <span className="text-foreground text-sm font-medium">{q.username}</span>
                    {q.position === 1 && (
                      <span className="ml-auto text-primary text-xs font-semibold">En tête →</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Buyers list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 mt-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Buyers créés</h2>
            <span className="ml-auto text-xs text-muted-foreground">{buyers.length}</span>
          </div>
          {loadingList ? (
            <p className="text-muted-foreground text-sm text-center py-6">Chargement...</p>
          ) : buyers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Aucun buyer pour le moment</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {buyers.map((b) => (
                <div key={b.id} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/20 px-3.5 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
                    {b.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-foreground text-sm font-medium truncate">{b.username}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}