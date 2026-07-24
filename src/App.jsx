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
import Suivi from "./pages/Suivi";
import Owner from "./pages/Owner";
import Buyer from "./pages/Buyer";

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
    const interval = setInterval(checkBlacklist, 30000);
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
    return (
      <div className="fixed inset-0 flex items-center justify-center px-4" style={{ backgroundColor: '#262626' }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="rounded-2xl px-8 py-12 shadow-2xl"
            style={{ backgroundColor: '#333333', border: '1px solid #5c2020' }}
          >
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{ background: 'radial-gradient(circle at 30% 30%, #ef5350, #d32f2f 55%, #b71c1c)' }}
              >
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.4)' }} />
                <div className="w-12 h-[6px] rounded-full relative z-10" style={{ backgroundColor: '#fff', transform: 'rotate(-45deg)' }} />
              </div>
            </div>
            <h1 className="font-heading text-2xl font-bold mb-3" style={{ color: '#e53935' }}>
              Accès refusé
            </h1>
            {isVPN ? (
              <p className="text-sm" style={{ color: '#e0e0e0' }}>
                Veuillez enlever votre VPN pour continuer.
              </p>
            ) : (
              <>
                <p className="text-sm mb-2" style={{ color: '#e0e0e0' }}>
                  Votre adresse IP a été bloquée.
                </p>
                <p className="text-xs break-all" style={{ color: '#9e9e9e' }}>{clientIP}</p>
              </>
            )}
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
      <Route path="/suivi" element={<Suivi />} />
      <Route path="/owner" element={<Owner />} />
      <Route path="/buyer" element={<Buyer />} />
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