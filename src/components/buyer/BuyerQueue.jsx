const operatorBadge = {
  SFR: "bg-red-500/10 text-red-400 border-red-500/25",
  Bouygues: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  Orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
};

const maskSnap = (snap) => {
  const s = String(snap || "");
  if (s.length <= 1) return "@" + s + "•••";
  return "@" + s[0] + "•".repeat(Math.min(s.length - 1, 6));
};

const maskPhone = (tel) => {
  const t = String(tel || "").replace(/\D/g, "");
  if (t.length <= 4) return "•".repeat(4);
  return "•".repeat(t.length - 4) + t.slice(-4);
};

export default function BuyerQueue({ queue }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col min-h-[60vh]">
      <h2 className="text-lg font-bold text-foreground">Live queue</h2>
      <p className="text-sm text-muted-foreground mb-5">Numbers stay masked until you claim them</p>

      {queue.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-muted-foreground text-sm">All numbers have been claimed for the moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-bold">User</th>
                <th className="py-2 pr-4 font-bold">Phone</th>
                <th className="py-2 pr-4 font-bold">Operator</th>
                <th className="py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((sub) => (
                <tr key={sub.id} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 text-sm font-medium text-foreground font-mono">{maskSnap(sub.snapchat)}</td>
                  <td className="py-3 pr-4 text-sm text-muted-foreground font-mono">{maskPhone(sub.telephone)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${operatorBadge[sub.operateur]}`}>
                      {sub.operateur}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-border bg-secondary/40 text-muted-foreground">
                      Queued
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}