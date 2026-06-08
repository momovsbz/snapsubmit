import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
// Add page imports here
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [clientIP, setClientIP] = useState(null);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [isCheckingBlacklist, setIsCheckingBlacklist] = useState(true);

  // Check IP blacklist and VPN on app load
  useEffect(() => {
    const checkBlacklist = async () => {
      try {
        const res = await base44.functions.invoke("getClientIP", {});
        const ip = res?.data?.ip;
        const isVPN = res?.data?.isVPN;
        setClientIP(ip);

        // Block VPNs directly
        if (isVPN) {
          setIsBlacklisted(true);
          setIsCheckingBlacklist(false);
          return;
        }

        const saved = localStorage.getItem("snap_blacklist");
        const blacklist = saved ? JSON.parse(saved) : [];
        const blocked = blacklist.some(item => item.type === "ip" && item.value === ip);
        setIsBlacklisted(blocked);
      } catch (error) {
        console.error("Error checking blacklist:", error);
      } finally {
        setIsCheckingBlacklist(false);
      }
    };
    checkBlacklist();
  }, []);

  // Show loading spinner while checking blacklist or auth
  if (isCheckingBlacklist || isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Block blacklisted IPs
  if (isBlacklisted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-destructive/30 rounded-2xl px-6 py-10 shadow-xl">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="font-heading text-2xl font-bold text-destructive mb-2">Accès refusé</h1>
            <p className="text-muted-foreground text-sm mb-2">Votre adresse IP a été bloquée.</p>
            <p className="text-muted-foreground text-xs break-all">{clientIP}</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App