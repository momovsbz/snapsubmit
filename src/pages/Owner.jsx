import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, Users, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OwnerBuyers from "@/components/owner/OwnerBuyers";
import OwnerAssign from "@/components/owner/OwnerAssign";

function OwnerGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await base44.functions.invoke("verifyAdminPassword", { password: input });
      if (res?.data?.ok) {
        onUnlock(input);
      } else if (res?.data?.locked) {
        setError("Accès bloqué, réessayez plus tard");
        setInput("");
        setTimeout(() => setError(""), 3000);
      } else {
        setError("Mot de passe incorrect");
        setInput("");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.locked ? "Bloqué, réessayez plus tard" : "Mot de passe incorrect");
      setInput("");
      setTimeout(() => setError(""), 3000);
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
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Owner Panel</h1>
        <p className="text-muted-foreground text-sm mb-6">Entrez le mot de passe propriétaire</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Mot de passe"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm ${
              error ? "border-destructive ring-2 ring-destructive/40" : "border-border"
            }`}
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20"
          >
            Accéder
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function Owner() {
  const [ownerPassword, setOwnerPassword] = useState(
    () => sessionStorage.getItem("ownerPassword") || null
  );
  const [tab, setTab] = useState("assign");

  const unlock = (pw) => {
    sessionStorage.setItem("ownerPassword", pw);
    setOwnerPassword(pw);
  };

  if (!ownerPassword) return <OwnerGate onUnlock={unlock} />;

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Owner <span className="text-primary">Panel</span>
            </h1>
            <p className="text-muted-foreground text-xs">Gérez les buyers et assignez les soumissions</p>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("assign")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
              tab === "assign"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Inbox className="w-4 h-4" /> File d'attente
          </button>
          <button
            onClick={() => setTab("buyers")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
              tab === "buyers"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" /> Buyers
          </button>
        </div>

        {tab === "assign" ? (
          <OwnerAssign ownerPassword={ownerPassword} />
        ) : (
          <OwnerBuyers ownerPassword={ownerPassword} />
        )}
      </div>
    </div>
  );
}