import { NextRequest, NextResponse } from "next/server";

const CLINICAL_SYSTEM_PROMPT = `
직장 갈등 상황을 분석하고, 즉시 복사해서 쓸 수 있는 실전 대화문을 제공하세요.

[구조]

1. 상황 요약 (2문장)
- 핵심 갈등만. 배경 설명 금지.

2. 감정 분석
- 주요 감정 1개 명시
- 강도: 높음 / 중간 / 낮음 중 하나
- summary: 짧은 구 + 원인 한 줄. 완성된 문장 불필요. 예: "반복된 무시로 인한 분노 — 의견이 계속 묵살됨"

3. 갈등 분석
- 갈등 유형 1개 명시 (예: 책임 회피, 권위 남용, 소통 단절, 경계 침범, 역할 충돌 등)
- 이 패턴이 지금 어떻게 작동하는지 1~2문장. 정의나 일반론 금지.

4. 관계 유형
- 상사 / 동료 / 부하 중 하나만 명시

5. 바로 쓸 수 있는 대화 문장
- 부드러운 버전 3개: 관계를 유지하면서 핵심을 전달하는 문장
- 강경한 버전 3개: 선을 긋고 입장을 명확히 하는 문장
- 각 문장은 1~2문장. 실제 대화에서 그대로 말할 수 있는 수준.

6. 대화 스크립트
- 부드러운 버전 1개, 강경한 버전 1개
- 형식: 나 / 상대 (3~5턴)
- 실제 직장에서 벌어질 수 있는 흐름

7. 상대 반응별 즉각 대응
- 부인할 때: 바로 말할 수 있는 문장 2개
- 회피할 때: 바로 말할 수 있는 문장 2개
- 방어적일 때: 바로 말할 수 있는 문장 2개
→ 긴장된 상황에서도 실제로 쓸 수 있어야 한다

8. 행동 체크리스트
- 오늘 할 일 3개: 구체적 행동 (예: "오후 중 팀장에게 1:1 미팅 요청 메시지 전송")
- 이번 주 할 일 3개: 후속 조치 (예: "처리 결과를 이메일로 문서화")

9. 쓰면 안 되는 표현 3개
- 각 표현마다 왜 역효과인지 한 줄 이유 포함

────────────────────────

[톤 규칙]

상사:
- 부드러운: 질문형으로 상황을 물어보는 방식. 직접 지적 금지.
- 강경한: 요청이 아닌 사실 진술. 체면은 살리되 의사는 분명히.

동료:
- 부드러운: 감정 인정 + 입장 전달. 비난 없이.
- 강경한: 행동 기준을 직접 명시. "이건 안 됩니다"를 포장하지 말 것.

부하:
- 부드러운: 기대를 명확히. 존중 유지.
- 강경한: 결과와 책임을 사실로 전달. 협박이 아닌 기준 명시.

────────────────────────

[금지 조건]

- "이렇게 해보세요", "함께 논의해봅시다" 같은 막연한 표현 금지
- 도덕적 조언, 훈계, 공감 위로 문구 금지
- 추상적 행동 지침 금지 ("소통을 강화하세요" 등)

────────────────────────

[출력 형식]

순수 JSON만 출력. 마크다운 코드블록 금지. 문자열 안 줄바꿈 금지. 따옴표는 반드시 이스케이프(\") 처리.

{
  "situationSummary": "핵심 갈등 2문장. 배경 없이.",
  "emotionAnalysis": {
    "primary": "주요 감정 1개",
    "intensityLabel": "높음 | 중간 | 낮음",
    "summary": "이 감정이 이 상황에서 왜 나타나는지 2~3문장."
  },
  "conflictAnalysis": {
    "type": "갈등 유형",
    "summary": "이 패턴이 어떻게 작동하는지 2~3문장."
  },
  "relationshipType": "boss | peer | subordinate",
  "dialogue": {
    "sentencesSoft": ["부드러운 문장 1", "부드러운 문장 2", "부드러운 문장 3"],
    "sentencesAssertive": ["강경한 문장 1", "강경한 문장 2", "강경한 문장 3"],
    "scriptSoft": "부드러운 스크립트 (나/상대 형식 3~5턴)",
    "scriptAssertive": "강경한 스크립트 (나/상대 형식 3~5턴)",
    "responses": {
      "denial": ["부인 대응 1", "부인 대응 2"],
      "avoidance": ["회피 대응 1", "회피 대응 2"],
      "defensive": ["방어 대응 1", "방어 대응 2"]
    },
    "thingsToAvoid": ["표현 1 — 이유", "표현 2 — 이유", "표현 3 — 이유"]
  },
  "actionGuide": {
    "today": ["구체적 행동 1", "구체적 행동 2", "구체적 행동 3"],
    "thisWeek": ["구체적 행동 1", "구체적 행동 2", "구체적 행동 3"]
  }
}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { situation, relationship, emotion, intensity } = body;

    const EMOTION_LABELS_KO: Record<string, string> = {
      anger: "분노", frustration: "답답함", anxiety: "불안",
      hurt: "상처", humiliation: "수치심", sadness: "슬픔",
      confusion: "혼란", overwhelmed: "버거움",
    };

    const RELATIONSHIP_KO: Record<string, string> = {
      manager: "상사", coworker: "동료", subordinate: "부하직원",
    };

    const userMessage = `
[상황 정보]
- 갈등 상대: ${RELATIONSHIP_KO[relationship] ?? relationship}
- 현재 감정: ${EMOTION_LABELS_KO[emotion] ?? emotion} (강도: ${intensity}/10)
- 상황 설명: "${situation}"

위 상황을 분석하고, 실제로 바로 사용할 수 있는 실전형 답변을 제공해주세요.
`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: CLINICAL_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Claude API 오류: ${response.status} - ${err}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.stop_reason === "max_tokens") {
      console.warn("⚠️ 응답이 토큰 한도로 잘렸습니다");
      throw new Error("응답이 너무 깁니다. max_tokens를 늘려주세요.");
    }

    const rawText = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const clean = rawText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim();

    let parsed: ReturnType<typeof JSON.parse>;
    try {
      parsed = JSON.parse(clean);
    } catch {
      try {
        const reEscaped = clean.replace(
          /"(?:[^"\\]|\\.)*"/g,
          (match: string) => match.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
        );
        parsed = JSON.parse(reEscaped);
      } catch (e2) {
        console.error("JSON parse failed. Raw response (first 500):", rawText.substring(0, 500));
        throw new Error(`JSON parse failed: ${(e2 as Error).message}`);
      }
    }

    const result = {
      situationSummary: parsed.situationSummary ?? "",
      emotionAnalysis: {
        primary: parsed.emotionAnalysis?.primary ?? "",
        intensityLabel: parsed.emotionAnalysis?.intensityLabel ?? "",
        summary: parsed.emotionAnalysis?.summary ?? "",
      },
      conflictAnalysis: {
        type: parsed.conflictAnalysis?.type ?? "",
        description: parsed.conflictAnalysis?.summary ?? "",
      },
      relationshipType: parsed.relationshipType ?? "peer",
      dialogue: {
        sentencesSoft: parsed.dialogue?.sentencesSoft ?? [],
        sentencesAssertive: parsed.dialogue?.sentencesAssertive ?? [],
        scriptSoft: parsed.dialogue?.scriptSoft ?? "",
        scriptAssertive: parsed.dialogue?.scriptAssertive ?? "",
        responses: {
          denial: parsed.dialogue?.responses?.denial ?? [],
          avoidance: parsed.dialogue?.responses?.avoidance ?? [],
          defensive: parsed.dialogue?.responses?.defensive ?? [],
        },
        thingsToAvoid: parsed.dialogue?.thingsToAvoid ?? [],
      },
      actionGuide: {
        immediate: parsed.actionGuide?.today ?? [],
        longTerm: parsed.actionGuide?.thisWeek ?? [],
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("분석 오류:", err);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
