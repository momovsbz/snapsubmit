import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";

export default function DiscordPrompt({ onSubmit, onCancel, title, description }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = value.trim().replace(/^@+/, "");
    if (!cleaned) {
      setError("Please enter your Discord username");
      return;
    }
    onSubmit(cleaned);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card border border-border rounded-3xl px-6 py-8 shadow-2xl shadow-black/60 text-center">
        <div className="w-14 h-14 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <MessageCircle className="w-7 h-7 text-indigo-400" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
          {title || "Discord identification"}
        </h2>
        <p className="text-muted-foreground text-xs mb-6">
          {description || "Enter your Discord username to lock this request to your session."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="pseudo_discord"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            autoFocus
            className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400/40 transition-all text-sm text-center font-mono"
          />
          {error && <p className="text-destructive text-xs font-medium">{error}</p>}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-indigo-500/90 transition-colors shadow-lg shadow-indigo-500/30"
          >
            Lock <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}