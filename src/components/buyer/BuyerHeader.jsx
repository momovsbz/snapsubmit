import { useState } from "react";
import { Moon, Bell, LogOut, ChevronDown } from "lucide-react";

export default function BuyerHeader({ username, onLogout }) {
  const [notif, setNotif] = useState(true);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          English <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <Moon className="w-4 h-4 text-gray-400" />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">SNAPCHAT+ OPS</span>
          <h1 className="text-lg font-bold text-gray-900">Client workspace</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setNotif((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            notif ? "bg-[#e0f2f1] text-[#00695c]" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-orange-500" />
          {notif ? "On" : "Off"}
        </button>

        <div className="flex flex-col text-right leading-tight">
          <span className="text-sm font-bold text-gray-900">{username}</span>
          <span className="text-[11px] text-gray-400">Session active</span>
        </div>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}