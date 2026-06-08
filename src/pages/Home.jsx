import { useState } from "react";
import { base44 } from "@/api/base44Client";
import SubmissionForm from "@/components/SubmissionForm";
import SuccessScreen from "@/components/SuccessScreen";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleSubmit = async (data) => {
    setLoading(true);
    await base44.entities.Submission.create(data);
    await base44.functions.invoke("notifyDiscord", data).catch(() => {});
    setSubmittedData(data);
    setSubmitted(true);
    setLoading(false);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmittedData(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {submitted ? (
          <SuccessScreen data={submittedData} onReset={handleReset} />
        ) : (
          <SubmissionForm onSubmit={handleSubmit} loading={loading} />
        )}
      </div>
    </div>
  );
}