import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Lock, Shield, Users } from "lucide-react";
import AddBuyerForm from "@/components/owner/AddBuyerForm";
import BuyersList from "@/components/owner/BuyersList";

function OwnerGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await base44.functions.invoke("verifyAdminPassword", { password: input });
      if (res?.data?.ok) {
        onUnlock(input);
      } else {
        setError("Mot de passe incorrect");
        setInput("");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Mot de passe incorrect");
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
        className="relative z-10 bg-card border border-border rounded-3xl px-8 py-10 w-full max-w-sm shadow-2xl shadow-black/50 text-center"
      >
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Accès Owner</h1>
        <p className="text-muted-foreground text-sm mb-6">Entrez le mot de passe owner pour gérer les acheteurs</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Mot de passe owner"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`w-full bg-background border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-destructive ring-2 ring-destructive/40" : "border-border"}`}
            autoFocus
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20">
            Accéder au panel owner
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function Owner() {
  const [ownerPassword, setOwnerPassword] = useState(null);
  const queryClient = useQueryClient();

  const { data: buyers = [], isLoading } = useQuery({
    queryKey: ["buyers"],
    queryFn: () => base44.entities.Buyer.list(),
    enabled: !!ownerPassword,
  });

  if (!ownerPassword) return <OwnerGate onUnlock={setOwnerPassword} />;

  const activeCount = buyers.filter((b) => b.active).length;

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Panel <span className="text-primary">Owner</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
              Gérez les acheteurs — {activeCount} actif(s) sur {buyers.length}
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          <AddBuyerForm ownerPassword={ownerPassword} onCreated={() => queryClient.invalidateQueries(["buyers"])} />
          <BuyersList buyers={buyers} onChanged={() => queryClient.invalidateQueries(["buyers"])} />
        </div>

        <div className="mt-6 bg-card border border-border rounded-2xl p-4">
          <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-primary" /> Comment ça marche
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Chaque nouvelle soumission est automatiquement assignée au premier acheteur de la file, qui passe ensuite en fin de file (rotation). L'acheteur la réclame sur <span className="text-foreground font-semibold">/buyer</span> puis accède à toutes les actions Discord (envoi de code, validation, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}