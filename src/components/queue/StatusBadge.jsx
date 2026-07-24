import { STATUS_META } from "@/lib/queueHelpers";

export default function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.waiting;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.bg} ${m.border} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}