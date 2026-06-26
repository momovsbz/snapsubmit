import { useEffect, useState } from "react";
import { apiInvoke } from "@/lib/api";
import { motion } from "framer-motion";

export default function Action() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const trigger = p.get("trigger");
    const action = p.get("action");
    const id = p.get("id");
    const ip = p.get("ip");

    const run = async () => {
      if (trigger) {
        await apiInvoke("sendCode", { submissionId: trigger, action: "code_ready" }).catch(() => {});
      } else if (action === "blacklist" && id) {
        await apiInvoke("blacklistUser", { submissionId: id, ip }).catch(() => {});
      } else if (action && id) {
        await apiInvoke("sendCode", { submissionId: id, action }).catch(() => {});
      }
      setDone(true);
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl px-10 py-14 text-center shadow-2xl shadow-black/40 max-w-sm w-full"
      >
        {done ? (
          <>
            <div className="text-6xl mb-5">✅</div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Action effectuée</h2>
            <p className="text-muted-foreground text-sm">Le statut de l'utilisateur a bien été mis à jour.</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-5" />
            <p className="text-muted-foreground text-sm">Traitement en cours...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}