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
  const [isVPN, setIsVPN] = useState(false);
  const [isCheckingBlacklist, setIsCheckingBlacklist] = useState(true);

  // Check IP blacklist and VPN on app load + poll periodically for real-time blacklist
  useEffect(() => {
    const checkBlacklist = async () => {
      try {
        const res = await base44.functions.invoke("getClientIP", {});
        const ip = res?.data?.ip;
        const vpn = res?.data?.isVPN;
        const blacklisted = res?.data?.isBlacklisted;
        setClientIP(ip);

        // Block VPNs or blacklisted IPs
        if (vpn) {
          setIsVPN(true);
          setIsBlacklisted(true);
        } else if (blacklisted) {
          setIsBlacklisted(true);
        }
      } catch (error) {
        console.error("Error checking blacklist:", error);
      } finally {
        setIsCheckingBlacklist(false);
      }
    };
    checkBlacklist();
    // Poll every 10 seconds so blacklist takes effect immediately (no reload needed)
    const interval = setInterval(checkBlacklist, 10000);
    return () => clearInterval(interval);
  }, []);

  // Show loading spinner while checking blacklist or auth
  if (isCheckingBlacklist || isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Block blacklisted IPs and VPNs
  if (isBlacklisted) {
    if (isVPN) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#262626] px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-[#1c1c1c] border border-[#7f1d1d] rounded-2xl px-8 py-12 shadow-2xl">
              {/* Prohibited icon */}
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 shadow-lg shadow-red-900/50" />
                <div className="absolute inset-[6px] rounded-full bg-gradient-to-tr from-red-700/40 to-red-900/40" />
                <div className="absolute left-1/2 top-[10px] bottom-[10px] w-[6px] -translate-x-1/2 bg-gradient-to-b from-red-200 via-white to-red-200 rounded-full shadow-md" style={{ transform: 'translateX(-50%) rotate(45deg)' }} />
              </div>
              <h1 className="font-heading text-3xl font-bold text-red-500 mb-3">Accès refusé</h1>
              <p className="text-gray-300 text-sm">Veuillez enlever votre VPN pour continuer.</p>
              <p className="text-gray-600 text-xs mt-4">Votre connexion a été identifiée comme VPN / proxy.</p>
            </div>
          </div>
        </div>
      );
    }
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