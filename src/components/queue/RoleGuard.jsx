import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function RoleGuard({ allowedRoles, children }) {
  const [state, setState] = useState({ loading: true, role: null });

  useEffect(() => {
    base44.auth.me()
      .then((u) => setState({ loading: false, role: u?.role || "user" }))
      .catch(() => setState({ loading: false, role: null }));
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!state.role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(state.role)) return <Navigate to="/queue/submit" replace />;

  return children;
}