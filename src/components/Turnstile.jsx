import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

export default function Turnstile({ onVerify, onExpire, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [siteKey, setSiteKey] = useState("");

  // Load the public site key from the backend
  useEffect(() => {
    let cancelled = false;
    base44.functions.invoke("getTurnstileSiteKey", {})
      .then((res) => {
        if (!cancelled) setSiteKey(res?.data?.siteKey || "");
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Inject the Turnstile script once
  useEffect(() => {
    if (window.turnstile) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Render the widget once the script + site key are ready
  useEffect(() => {
    if (!loaded || !siteKey || !containerRef.current || !window.turnstile) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token) => onVerify?.(token),
      "expired-callback": () => onExpire?.(),
      "error-callback": () => onError?.(),
    });
    return () => {
      if (widgetIdRef.current !== null) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [loaded, siteKey]);

  return <div ref={containerRef} className="min-h-[70px] flex items-center justify-center" />;
}