import { motion } from "framer-motion";

const operatorBadge = {
  SFR: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
  Bouygues: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
  Orange: "bg-[#d1f2ef] text-[#0e746a] border-[#0e746a]/20",
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
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 flex flex-col min-h-[60vh]">
      <h2 className="text-lg font-bold text-[#111827]">Live queue</h2>
      <p className="text-sm text-[#6b7280] mb-5">Numbers stay masked until you claim them</p>

      {queue.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-[#6b7280] text-sm">All numbers have been claimed for the moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] border-b border-[#e5e7eb]">
                <th className="py-2 pr-4 font-bold">User</th>
                <th className="py-2 pr-4 font-bold">Phone</th>
                <th className="py-2 pr-4 font-bold">Operator</th>
                <th className="py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((sub) => (
                <tr key={sub.id} className="border-b border-[#e5e7eb] last:border-0">
                  <td className="py-3 pr-4 text-sm font-medium text-[#111827] font-mono">{maskSnap(sub.snapchat)}</td>
                  <td className="py-3 pr-4 text-sm text-[#6b7280] font-mono">{maskPhone(sub.telephone)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${operatorBadge[sub.operateur]}`}>
                      {sub.operateur}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#e5e7eb] bg-gray-50 text-[#6b7280]">
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