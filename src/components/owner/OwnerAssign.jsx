import { useState } from "react";
import { Ghost, Inbox, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const operatorBadge = {
  SFR: "bg-red-500/15 text-red-400 border-red-500/30",
  Bouygues: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Orange: "bg-orange-400/15 text-orange-400 border-orange-400/30",
};

export default function OwnerAssign({ ownerPassword }) {
  const queryClient = useQueryClient();
  const [assigning, setAssigning] = useState(null);

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions-owner"],
    queryFn: () => base44.entities.Submission.list("-created_date", 500),
  });
  const { data: buyers = [] } = useQuery({
    queryKey: ["buyers"],
    queryFn: () => base44.entities.Buyer.list(),
  });

  const buyerName = (id) => buyers.find((b) => b.id === id)?.discord;

  const handleAssign = async (subId, buyerId) => {
    if (!buyerId) return;
    setAssigning(subId);
    try {
      await base44.functions.invoke("assignSubmission", { ownerPassword, submissionId: subId, buyerId });
      queryClient.invalidateQueries({ queryKey: ["submissions-owner"] });
    } catch {
      /* ignore */
    }
    setAssigning(null);
  };

  const unassigned = submissions.filter((s) => !s.assigned_buyer_id);
  const assigned = submissions.filter((s) => s.assigned_buyer_id);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary" /> À assigner ({unassigned.length})
        </h3>
        {unassigned.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-4 bg-card border border-border rounded-2xl">
            Toutes les soumissions sont assignées
          </p>
        ) : (
          <div className="space-y-2">
            {unassigned.map((s) => (
              <AssignRow key={s.id} sub={s} buyers={buyers} assigning={assigning === s.id} onAssign={handleAssign} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-green-400" /> Assignées ({assigned.length})
        </h3>
        {assigned.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center py-4 bg-card border border-border rounded-2xl">Aucune</p>
        ) : (
          <div className="space-y-2">
            {assigned.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Ghost className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{s.snapchat}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${operatorBadge[s.operateur]}`}>
                      {s.operateur}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{s.telephone}</p>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-lg flex-shrink-0">
                  @{buyerName(s.assigned_buyer_id) || "?"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssignRow({ sub, buyers, assigning, onAssign }) {
  const [sel, setSel] = useState("");
  return (
    <div className="bg-card border border-border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Ghost className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">{sub.snapchat}</span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${operatorBadge[sub.operateur]}`}>
            {sub.operateur}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{sub.telephone}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 max-w-[140px]"
        >
          <option value="">Choisir un buyer…</option>
          {buyers
            .filter((b) => b.is_active !== false)
            .map((b) => (
              <option key={b.id} value={b.id}>
                @{b.discord}
              </option>
            ))}
        </select>
        <button
          onClick={() => onAssign(sub.id, sel)}
          disabled={!sel || assigning}
          className="bg-primary text-primary-foreground text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {assigning && <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />}
          Assigner
        </button>
      </div>
    </div>
  );
}