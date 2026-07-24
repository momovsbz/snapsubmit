import { useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Phone, Paperclip, Send, CheckCircle2, Loader2, X, ChevronRight, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { queueId } from "@/lib/queueHelpers";
import QueueNav from "@/components/queue/QueueNav";
import Turnstile from "@/components/Turnstile";

const operators = [
  { id: "SFR", label: "SFR", color: "text-red-400", activeBorder: "border-red-500/60", activeBg: "bg-red-500/10" },
  { id: "Bouygues", label: "Bouygues", color: "text-blue-400", activeBorder: "border-blue-500/60", activeBg: "bg-blue-500/10" },
  { id: "Orange", label: "Orange", color: "text-orange-400", activeBorder: "border-orange-400/60", activeBg: "bg-orange-400/10" },
];

const formatTel = (digits) => digits.match(/.{1,2}/g)?.join(" ") || "";

export default function QueueSubmit() {
  const [form, setForm] = useState({ snapchat: "", telephone: "", operateur: "", description: "" });
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const validate = () => {
    const e = {};
    if (!form.snapchat.trim()) e.snapchat = "Nom d'utilisateur requis";
    const tel = form.telephone.replace(/\s/g, "");
    if (!tel) e.telephone = "Numéro requis";
    else if (!/^(06|07)\d{8}$/.test(tel)) e.telephone = "06/07 + 10 chiffres";
    if (!form.operateur) e.operateur = "Choisis un opérateur";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file: f });
      setFileUrl(res?.file_url || "");
    } catch {
      setFileUrl("");
      setError("Échec de l'upload du fichier");
    }
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    if (!turnstileToken) { setError("Vérification anti-bot requise"); return; }
    setLoading(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch {}
      const res = await base44.functions.invoke("createQueueSubmission", {
        snapchat: form.snapchat.trim(),
        telephone: form.telephone.replace(/\s/g, ""),
        operateur: form.operateur,
        turnstileToken,
        description: form.description.trim(),
        file_url: fileUrl,
        submitted_by_name: me?.full_name || "",
      });
      if (res?.error) { setError(res.error); setLoading(false); return; }
      setDone({ num: res?.data?.queueNumber || res?.queueNumber });
      setForm({ snapchat: "", telephone: "", operateur: "", description: "" });
      setFile(null); setFileUrl("");
      setTurnstileToken("");
    } catch (err) {
      setError(err?.message || "Erreur lors de la soumission");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <QueueNav />
      <div className="w-full max-w-md mx-auto">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="font-heading text-2xl font-bold mb-2">Demande enregistrée</h2>
            <p className="text-muted-foreground text-sm mb-4">Votre numéro dans la file est :</p>
            <div className="font-heading text-5xl font-black text-primary mb-6">{queueId(done.num)}</div>
            <p className="text-muted-foreground text-xs mb-6">
              Un buyer va traiter votre demande. Vous serez contacté sur Snapchat.
            </p>
            <button onClick={() => setDone(null)}
              className="bg-secondary text-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-secondary/70 transition-colors">
              Nouvelle demande
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-2xl"
          >
            <h1 className="font-heading text-2xl font-bold mb-1">Snapchat+ — File d'attente</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Soumettez vos infos, un buyer activera votre Snapchat+ gratuitement.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Nom d'utilisateur Snapchat</label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text" placeholder="votre_snap" value={form.snapchat}
                    onChange={(e) => setForm({ ...form, snapchat: e.target.value.replace(/\s/g, "") })}
                    autoComplete="off" className="w-full bg-secondary/30 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  />
                </div>
                {errors.snapchat && <p className="text-destructive text-xs font-medium">{errors.snapchat}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Opérateur mobile</label>
                <div className="grid grid-cols-3 gap-2">
                  {operators.map((op) => (
                    <button key={op.id} type="button"
                      onClick={() => setForm({ ...form, operateur: op.id })}
                      className={`py-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                        form.operateur === op.id
                          ? `${op.activeBorder} ${op.activeBg} ${op.color}`
                          : "border-border bg-secondary/20 text-muted-foreground hover:text-foreground"
                      }`}>
                      {op.label}
                    </button>
                  ))}
                </div>
                {errors.operateur && <p className="text-destructive text-xs font-medium">{errors.operateur}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Numéro de téléphone</label>
                <div className="flex items-center bg-secondary/30 border border-border rounded-xl px-3.5 gap-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-lg flex-shrink-0">🇫🇷</span>
                  <span className="text-muted-foreground text-sm font-medium flex-shrink-0">+33</span>
                  <div className="w-px h-5 bg-border flex-shrink-0" />
                  <input type="tel" placeholder="Votre numéro" value={formatTel(form.telephone)}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
                      if (val.length >= 2 && !val.startsWith("06") && !val.startsWith("07")) return;
                      setForm({ ...form, telephone: val });
                    }}
                    autoComplete="tel" inputMode="numeric"
                    className="flex-1 bg-transparent py-3 text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0" />
                </div>
                {errors.telephone && <p className="text-destructive text-xs font-medium">{errors.telephone}</p>}
                <p className="text-muted-foreground/60 text-xs">Uniquement les numéros commençant par 06 ou 07</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Note (optionnel)</label>
                <textarea rows={2} placeholder="Une précision pour le buyer..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Capture / fichier (optionnel)</label>
                {file ? (
                  <div className="flex items-center justify-between bg-secondary/40 border border-border rounded-xl px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-foreground truncate">
                      <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />{file.name}
                    </span>
                    <button type="button" onClick={() => { setFile(null); setFileUrl(""); }} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 bg-secondary/20 border-2 border-dashed border-border rounded-xl px-4 py-5 cursor-pointer hover:border-primary/40 hover:bg-secondary/30 transition-all">
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 text-primary animate-spin" /><span className="text-sm text-muted-foreground">Upload...</span></>
                    ) : (
                      <><Paperclip className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Ajouter un fichier</span></>
                    )}
                    <input type="file" className="hidden" onChange={handleFile} accept="image/*,.pdf" />
                  </label>
                )}
              </div>

              <p className="text-muted-foreground/70 text-xs text-center">Vérification anti-bot 🤖</p>
              <Turnstile
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
                onError={() => setTurnstileToken("")}
              />

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 text-sm text-destructive flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}

              <button type="submit" disabled={loading || uploading}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Envoi...</>
                ) : (
                  <>Soumettre <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}