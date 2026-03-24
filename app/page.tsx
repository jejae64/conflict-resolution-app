"use client";

import { useState } from "react";
import { ConflictForm, ConflictFormValues } from "@/components/conflict-form";
import { AnalysisResult } from "@/components/analysis-result";
import { ConflictAnalysisResult } from "@/types/conflict";

export default function Home() {
  const [result, setResult] = useState<ConflictAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ConflictFormValues) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "분석 중 오류가 발생했습니다.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "분석 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            직장 내 갈등 해결 가이드
          </h1>
          <p className="text-sm text-gray-500">
            {result
              ? "분석이 완료되었습니다. 대화를 시작하기 전에 각 항목을 천천히 읽어보세요."
              : "어떤 일이 있었는지 편하게 말씀해 주세요. 상황을 이해하고, 더 나은 대화를 준비할 수 있도록 도와드릴게요."}
          </p>
        </div>

        {loading && (
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center">
            <div className="mb-4 flex justify-center">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
            </div>
            <p className="text-sm text-gray-600">상황을 분석하고 있어요...</p>
            <p className="mt-1 text-xs text-gray-400">임상 프레임워크를 적용하는 중입니다</p>
          </div>
        )}

        {error && !loading && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="mt-2 text-xs text-red-500 underline">
              다시 시도하기
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {result ? (
              <AnalysisResult result={result} onReset={handleReset} />
            ) : (
              <ConflictForm onSubmit={handleSubmit} />
            )}
          </>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          이 도구는 누가 맞고 틀린지를 판단하지 않아요. 상황을 이해하고, 더 편하게 대화할 수 있도록 돕기 위한 거예요.
        </p>
      </div>
    </main>
  );
}
