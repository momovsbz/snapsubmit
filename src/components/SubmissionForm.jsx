import { useState } from "react";
import { motion } from "framer-motion";

const operators = [
  {
    id: "SFR",
    label: "SFR",
    color: "from-red-500 to-red-700",
    border: "border-red-500/50",
    glow: "shadow-red-500/20",
    bg: "bg-red-500/10",
  },
  {
    id: "Bouygues",
    label: "Bouygues",
    color: "from-blue-500 to-blue-700",
    border: "border-blue-500/50",
    glow: "shadow-blue-500/20",
    bg: "bg-blue-500/10",
  },
  {
    id: "Orange",
    label: "Orange",
    color: "from-orange-400 to-orange-600",
    border: "border-orange-400/50",
    glow: "shadow-orange-400/20",
    bg: "bg-orange-400/10",
  },
];

export default function SubmissionForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ snapchat: "", telephone: "", operateur: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.snapchat.trim()) newErrors.snapchat = "Pseudo Snapchat requis";
    if (!form.telephone.trim()) newErrors.telephone = "Numéro de téléphone requis";
    else if (!/^[0-9+\s\-]{8,15}$/.test(form.telephone.replace(/\s/g, "")))
      newErrors.telephone = "Numéro invalide";
    if (!form.operateur) newErrors.operateur = "Choisis un opérateur";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 mb-5"
        >
          <span className="text-4xl">👻</span>
        </motion.div>
        <h1 className="font-heading text-4xl font-bold text-foreground tracking-tight">
          Snap<span className="text-primary">+</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm font-medium tracking-wide uppercase">
          Rejoins la communauté exclusive
        </p>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-black/40">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Snapchat */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80 tracking-wide flex items-center gap-2">
              <span className="text-lg">👻</span> Pseudo Snapchat
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="ton.pseudo"
                value={form.snapchat}
                onChange={(e) => {
                  setForm({ ...form, snapchat: e.target.value });
                  if (errors.snapchat) setErrors({ ...errors, snapchat: "" });
                }}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm"
              />
            </div>
            {errors.snapchat && (
              <p className="text-destructive text-xs font-medium">{errors.snapchat}</p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80 tracking-wide flex items-center gap-2">
              <span className="text-lg">📱</span> Numéro de téléphone
            </label>
            <input
              type="tel"
              placeholder="06 00 00 00 00"
              value={form.telephone}
              onChange={(e) => {
                setForm({ ...form, telephone: e.target.value });
                if (errors.telephone) setErrors({ ...errors, telephone: "" });
              }}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-sm"
            />
            {errors.telephone && (
              <p className="text-destructive text-xs font-medium">{errors.telephone}</p>
            )}
          </div>

          {/* Opérateur */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground/80 tracking-wide flex items-center gap-2">
              <span className="text-lg">📡</span> Opérateur
            </label>
            <div className="grid grid-cols-3 gap-3">
              {operators.map((op) => (
                <motion.button
                  key={op.id}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setForm({ ...form, operateur: op.id });
                    if (errors.operateur) setErrors({ ...errors, operateur: "" });
                  }}
                  className={`relative py-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 cursor-pointer
                    ${form.operateur === op.id
                      ? `${op.border} ${op.bg} ${op.glow} shadow-lg text-foreground`
                      : "border-border bg-muted text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                >
                  {form.operateur === op.id && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br block" />
                  )}
                  {op.label}
                </motion.button>
              ))}
            </div>
            {errors.operateur && (
              <p className="text-destructive text-xs font-medium">{errors.operateur}</p>
            )}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-sm tracking-wide uppercase transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-primary/40 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              "Soumettre 🚀"
            )}
          </motion.button>
        </form>
      </div>

      <p className="text-center text-muted-foreground/60 text-xs mt-6">
        Tes informations sont sécurisées et confidentielles
      </p>
    </motion.div>
  );
}