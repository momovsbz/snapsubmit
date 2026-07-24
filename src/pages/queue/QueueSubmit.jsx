import { useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, Send, CheckCircle2, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { nextQueueNumber, addLog, queueId } from "@/lib/queueHelpers";
import QueueNav from "@/components/queue/QueueNav";

export default function QueueSubmit() {
  const [form, setForm] = useState({ description: "", name: "", contact: "" });
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUploading(true);
    setError("");
    try {
      const res = await base44.integrations.Core.UploadFile({ file: f });
      setFileUrl(res?.file_url || "");
    } catch {
      setFileUrl("");
      setError("Échec de l'upload du fichier");
    }
    setUploading(false);
  };

  const removeFile = () => { setFile(null); setFileUrl(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.description.trim()) { setError("Description requise"); return; }
    setLoading(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch {}
      const num = await nextQueueNumber();
      const actorName = form.name.trim() || me?.full_name || "Anonyme";
      const sub = await base44.entities.QueueSubmission.create({
        queue_number: num,
        description: form.description.trim(),
        submitted_by_name: actorName,
        submitted_by_contact: form.contact.trim(),
        file_url: fileUrl,
        status: "waiting",
      });
      await addLog({
        submission_id: sub.id,
        queue_number: num,
        action: "created",
        actor_id: me?.id,
        actor_name: actorName,
        actor_role: "user",
      });
      setDone({ num, id: sub.id });
      setForm({ description: "", name: "", contact: "" });
      setFile(null); setFileUrl("");
    } catch (err) {
      setError(err?.message || "Erreur lors de la soumission");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <QueueNav />
      <div className="w-full max-w-xl mx-auto">
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
              Les buyers traitent les demandes dans l'ordre. Suivez l'état depuis le panel buyer.
            </p>
            <button
              onClick={() => setDone(null)}
              className="bg-secondary text-foreground font-semibold px-5 py-2.5 rounded-xl hover:bg-secondary/70 transition-colors"
            >
              Nouvelle demande
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-2xl"
          >
            <h1 className="font-heading text-2xl font-bold mb-1">Soumettre une demande</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Votre demande rejoint la file et sera traitée dans l'ordre d'arrivée.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Nom (optionnel)</label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Contact (optionnel)</label>
                <input
                  type="text"
                  placeholder="Email ou téléphone"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Décrivez votre demande..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Fichier / image (optionnel)</label>
                {file ? (
                  <div className="flex items-center justify-between bg-secondary/40 border border-border rounded-xl px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-foreground truncate">
                      <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
                      {file.name}
                    </span>
                    <button type="button" onClick={removeFile} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 bg-secondary/20 border-2 border-dashed border-border rounded-xl px-4 py-6 cursor-pointer hover:border-primary/40 hover:bg-secondary/30 transition-all">
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 text-primary animate-spin" /><span className="text-sm text-muted-foreground">Upload...</span></>
                    ) : (
                      <><Paperclip className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Cliquer pour ajouter un fichier</span></>
                    )}
                    <input type="file" className="hidden" onChange={handleFile} accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
                  </label>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Envoi...</>
                ) : (
                  <>Soumettre <Send className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}