"use client";

import { useState } from "react";

const EMOTIONS = [
  { value: "anger", label: "분노" },
  { value: "frustration", label: "답답함" },
  { value: "anxiety", label: "불안" },
  { value: "hurt", label: "상처" },
  { value: "humiliation", label: "수치심" },
  { value: "sadness", label: "슬픔" },
  { value: "confusion", label: "혼란" },
  { value: "overwhelmed", label: "버거움" },
];

const RELATIONSHIPS = [
  { value: "manager", label: "상사" },
  { value: "coworker", label: "동료" },
  { value: "subordinate", label: "부하직원" },
];

export interface ConflictFormValues {
  situation: string;
  relationship: string;
  emotion: string;
  intensity: number;
}

interface ConflictFormProps {
  onSubmit: (values: ConflictFormValues) => void;
}

export function ConflictForm({ onSubmit }: ConflictFormProps) {
  const [situation, setSituation] = useState("");
  const [relationship, setRelationship] = useState("");
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(5);

  const tooIntense = intensity >= 8;
  const canSubmit = situation.trim() && relationship && emotion;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ situation, relationship, emotion, intensity });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Situation */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          어떤 상황이었는지 편하게 들려주세요
        </label>
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="어떤 일이 있었나요? 편하게 적어 주세요."
          rows={5}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
        />
      </div>

      {/* Relationship */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          상대와의 관계
        </label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="" disabled>
            관계를 선택해 주세요
          </option>
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Emotion */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          지금 가장 크게 느껴지는 감정은 무엇인가요?
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => setEmotion(e.value)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                emotion === e.value
                  ? "border-gray-800 bg-gray-800 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            감정의 정도
          </label>
          <span
            className={`text-sm font-semibold tabular-nums ${
              tooIntense ? "text-red-500" : "text-gray-800"
            }`}
          >
            {intensity} / 10
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full accent-gray-800"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>차분함</span>
          <span>매우 강함</span>
        </div>

        {tooIntense && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            지금은 감정이 많이 올라와 있는 상태예요. 대화를 바로 시작하기보다 잠시 감정을 가라앉힌 후에 시작하는 것을 권해드려요. 그래도 지금 이 과정을 계속하셔도 됩니다.
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
      >
        상황 분석하기
      </button>
    </form>
  );
}
