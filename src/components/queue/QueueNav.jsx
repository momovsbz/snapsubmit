import { Link, useLocation } from "react-router-dom";
import { Send, ListOrdered, ShieldCheck, ArrowLeft } from "lucide-react";

export default function QueueNav({ role }) {
  const loc = useLocation();
  const links = [
    { to: "/queue/submit", label: "Soumettre", icon: Send, roles: ["user", "buyer", "admin"] },
    { to: "/queue/buyer", label: "File Buyer", icon: ListOrdered, roles: ["buyer", "admin"] },
    { to: "/queue/owner", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
  ].filter((l) => !role || l.roles.includes(role));

  return (
    <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 mb-6">
      <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Accueil
      </Link>
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1">
        {links.map((l) => {
          const active = loc.pathname.startsWith(l.to);
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}