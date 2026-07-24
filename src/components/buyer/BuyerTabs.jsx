export default function BuyerTabs({ tab, setTab }) {
  const tabs = [
    { id: "queue", label: "Active queue" },
    { id: "history", label: "My history" },
  ];

  return (
    <div className="flex gap-2 px-6 pt-5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}