import { useState } from "react";
import { Moon, Bell, LogOut, ChevronDown, LogIn } from "lucide-react";

export default function BuyerHeader({ username, active, onToggleQueue, toggling, onLogout }) {
  const [notif, setNotif] = useState(true);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          English <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <Moon className="w-4 h-4 text-muted-foreground" />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">SNAPCHAT+ OPS</span>
          <h1 className="text-lg font-bold text-foreground">Client workspace</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setNotif((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            notif ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-orange-400" />
          {notif ? "On" : "Off"}
        </button>

        <div className="flex flex-col text-right leading-tight">
          <span className="text-sm font-bold text-foreground">{username}</span>
          <span className="text-[11px] text-muted-foreground">{active ? "In queue" : "Off queue"}</span>
        </div>

        <button
          onClick={onToggleQueue}
          disabled={toggling}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
            active
              ? "bg-secondary text-muted-foreground hover:bg-secondary/70"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {toggling ? (
            <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <LogIn className="w-3.5 h-3.5" />
          )}
          {active ? "Leave queue" : "Enter queue"}
        </button>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}