"use client";

import { ConflictAnalysisResult, EmotionAnalysis, ConflictAnalysis } from "@/types/conflict";

interface Props {
  result: ConflictAnalysisResult;
  onReset: () => void;
}

const RELATIONSHIP_KO: Record<string, string> = {
  boss: "상사",
  peer: "동료",
  subordinate: "부하직원",
};

export function AnalysisResult({ result, onReset }: Props) {
  return (
    <div className="space-y-4">

      {/* 상황 요약 */}
      <Section label="상황 요약">
        <p className="text-sm leading-relaxed text-gray-700">{result.situationSummary}</p>
      </Section>

      {/* 감정 분석 */}
      <Section label="감정 분석">
        <EmotionAnalysisBlock data={result.emotionAnalysis} />
      </Section>

      {/* 갈등 분석 */}
      <Section label="갈등 분석">
        <ConflictAnalysisBlock data={result.conflictAnalysis} />
      </Section>

      {/* 관계 유형 */}
      <Section label="관계 유형">
        <span className="inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
          {RELATIONSHIP_KO[result.relationshipType] ?? result.relationshipType}
        </span>
      </Section>

      {/* 바로 쓸 수 있는 대화 문장 */}
      <Section label="바로 사용할 수 있는 대화 문장">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-blue-500">부드러운 버전</p>
            <ul className="space-y-2">
              {result.dialogue.sentencesSoft.map((s, i) => (
                <li key={i} className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 leading-relaxed">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-orange-500">강경한 버전</p>
            <ul className="space-y-2">
              {result.dialogue.sentencesAssertive.map((s, i) => (
                <li key={i} className="rounded-lg bg-orange-50 border border-orange-100 px-4 py-3 text-sm text-orange-900 leading-relaxed">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 대화 스크립트 */}
      <Section label="대화 스크립트">
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-100 px-4 py-3">
            <p className="text-xs font-semibold text-blue-400 mb-2">부드러운 버전</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{result.dialogue.scriptSoft}</p>
          </div>
          <div className="rounded-lg border border-orange-100 px-4 py-3">
            <p className="text-xs font-semibold text-orange-400 mb-2">강경한 버전</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{result.dialogue.scriptAssertive}</p>
          </div>
        </div>
      </Section>

      {/* 상대 반응별 대응 */}
      <Section label="상대 반응별 대응">
        <div className="space-y-4">
          <ResponseBlock label="부인할 때" items={result.dialogue.responses.denial} />
          <ResponseBlock label="회피할 때" items={result.dialogue.responses.avoidance} />
          <ResponseBlock label="방어적일 때" items={result.dialogue.responses.defensive} />
        </div>
      </Section>

      {/* 행동 가이드 */}
      <Section label="행동 가이드">
        <SubLabel>오늘 할 일</SubLabel>
        <ul className="mb-4 space-y-1.5">
          {result.actionGuide.immediate.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="mt-0.5 shrink-0 text-gray-400">{i + 1}.</span>{step}
            </li>
          ))}
        </ul>

        <SubLabel>이번 주 할 일</SubLabel>
        <ul className="space-y-1.5">
          {result.actionGuide.longTerm.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="mt-0.5 shrink-0 text-gray-400">{i + 1}.</span>{step}
            </li>
          ))}
        </ul>
      </Section>

      {/* 하지 말아야 할 표현 */}
      <Section label="하지 말아야 할 표현">
        <ul className="space-y-1.5">
          {result.dialogue.thingsToAvoid.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className="mt-0.5 text-red-300">×</span>{item}
            </li>
          ))}
        </ul>
      </Section>

      <button
        onClick={onReset}
        className="w-full rounded-lg border border-gray-200 px-6 py-3 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
      >
        다른 상황 분석하기
      </button>
    </div>
  );
}

function EmotionAnalysisBlock({ data }: { data: EmotionAnalysis }) {
  const intensityColor: Record<string, string> = {
    높음: "bg-red-100 text-red-700",
    중간: "bg-yellow-100 text-yellow-700",
    낮음: "bg-green-100 text-green-700",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">{data.primary}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${intensityColor[data.intensityLabel] ?? "bg-gray-100 text-gray-600"}`}>
          {data.intensityLabel}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-600">{data.summary}</p>
    </div>
  );
}

function ConflictAnalysisBlock({ data }: { data: ConflictAnalysis }) {
  return (
    <div className="space-y-2">
      <span className="inline-block rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-700">
        {data.type}
      </span>
      <p className="text-sm leading-relaxed text-gray-600">{data.description}</p>
    </div>
  );
}

function ResponseBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-2.5 text-sm text-amber-900 leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-medium text-gray-500">{children}</p>;
}
