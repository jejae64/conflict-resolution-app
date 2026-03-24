import { ConflictAnalysisResult, ConflictType } from "@/types/conflict";
import { ConflictFormValues } from "@/components/conflict-form";

// ─── Helpers ────────────────────────────────────────────────────────────────

function intensityLabel(n: number): "low" | "moderate" | "high" | "very high" {
  if (n <= 3) return "low";
  if (n <= 5) return "moderate";
  if (n <= 7) return "high";
  return "very high";
}

function hasKeyword(text: string, ...words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

// Korean particle helpers — derived from Unicode jongseong offset
function wa(word: string): "와" | "과" {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "와";
  return (code - 0xac00) % 28 === 0 ? "와" : "과";
}

function eul(word: string): "을" | "를" {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "을";
  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

// ─── Emotion label (Korean) ──────────────────────────────────────────────────

const EMOTION_LABELS_KO: Record<string, string> = {
  anger: "분노",
  frustration: "답답함",
  anxiety: "불안",
  hurt: "상처",
  humiliation: "수치심",
  sadness: "슬픔",
  confusion: "혼란",
  overwhelmed: "버거움",
};

// ─── Conflict type ───────────────────────────────────────────────────────────

function classifyConflictType(situation: string): {
  type: ConflictType;
  typeLabel: string;
  description: string;
} {
  if (hasKeyword(situation, "비판", "비판받", "지적", "망신", "공개적", "criticism", "criticized", "blamed", "called out", "public")) {
    return {
      type: "power_dynamics",
      typeLabel: "위계 갈등",
      description:
        "직위나 권한의 차이가 이 갈등의 배경이 됩니다. 피드백이나 권위가 행사된 방식이 공정함이나 존중에 대한 기대와 어긋났을 수 있어요. 상대방이 의도적으로 상처를 주려 했다기보다, 서로 다른 기준과 기대가 부딪힌 경우일 가능성이 높습니다.",
    };
  }
  if (hasKeyword(situation, "무시", "무시당", "듣지 않", "안 들어", "간과", "ignored", "dismissed", "not listened", "not heard", "overlooked")) {
    return {
      type: "communication",
      typeLabel: "소통 단절",
      description:
        "내 말이 제대로 전달되지 않거나 충분히 들려지지 않는다는 느낌이 갈등의 핵심입니다. 서로가 듣고 인정받는 방식에서 차이가 생겼을 가능성이 높아요.",
    };
  }
  if (hasKeyword(situation, "회의", "발표", "앞에서", "공개", "meeting", "presentation", "said in front", "announced")) {
    return {
      type: "communication",
      typeLabel: "소통 단절",
      description:
        "무엇을 말했느냐보다 어떻게, 어디서, 언제 말했느냐가 갈등의 핵심인 것 같습니다. 내용보다 전달 방식이나 상황 선택에서 어긋남이 있었을 수 있어요.",
    };
  }
  if (hasKeyword(situation, "업무량", "야근", "과로", "마감", "초과", "workload", "overtime", "overwork", "too much work", "deadline", "capacity")) {
    return {
      type: "workload",
      typeLabel: "업무 과부하",
      description:
        "감당하기 어려운 업무량에 대한 기대가 이 갈등의 뿌리입니다. 업무 한계가 명확하지 않거나, 우선순위 조율이 잘 이루어지지 않거나, 일이 불균등하게 나뉘어 있는 것이 원인일 수 있어요.",
    };
  }
  if (hasKeyword(situation, "역할", "책임", "업무 범위", "해야 할", "role", "responsibility", "responsibilities", "job description", "supposed to")) {
    return {
      type: "role_clarity",
      typeLabel: "역할 혼선",
      description:
        "역할과 책임의 경계가 불분명한 것이 갈등의 원인으로 보입니다. 서로가 상대방의 역할을 다르게 이해하고 있을 가능성이 높아요.",
    };
  }
  if (hasKeyword(situation, "불공평", "가치관", "윤리", "원칙", "unfair", "values", "ethics", "wrong", "morally", "principle")) {
    return {
      type: "values",
      typeLabel: "가치관 충돌",
      description:
        "직장에서 무엇이 옳고, 공정하며, 적절한가에 대해 서로 다른 생각을 갖고 있는 상황입니다. 가치관의 차이는 쉽게 좁혀지지 않지만, 서로의 관점을 이해하는 것에서 시작할 수 있어요.",
    };
  }
  return {
    type: "communication",
    typeLabel: "소통 단절",
    description:
      "서로의 기대나 맥락이 충분히 공유되지 않아 생긴 소통의 간극이 이 갈등으로 이어진 것 같습니다. 의도보다 전달된 방식이 문제가 된 경우일 수 있어요.",
  };
}

// ─── Emotion analysis ────────────────────────────────────────────────────────
// 구조: (1) 공감적 인정 (2) 신호 설명 (3) 핵심 내적 믿음
//       (4) 방어기제/대상관계 패턴 (5) 관계적 판단

const EMOTION_SUMMARIES: Record<string, string> = {
  anger:
    "화가 많이 나셨겠어요. " +
    "분노는 내가 중요하게 여기는 경계가 침범당했을 때 작동하는 자기보호 신호입니다. 이 상황에서는 상대의 행동이 나를 '조율 가능한 존재'가 아니라 '통보받는 존재'로 취급했다는 신호를 받은 거예요. " +
    "그 안에는 '나는 마땅히 다르게 대우받았어야 했다'는 핵심 믿음이 있습니다. " +
    "심리적으로 이 반응은 억압(Repression)이 무너지며 표면화된 공격성입니다. 평소 참아온 것들이 임계점을 넘은 것이며, 분열(Splitting) 기제가 활성화되어 상대를 '완전히 나쁜 대상'으로 고정하기 시작한 상태일 수 있어요. " +
    "지금 이 반응의 핵심은 상대가 나를 의견을 가진 동등한 존재가 아니라, 결정을 수용해야 하는 위치에 배치하고 있다는 판단입니다.",

  frustration:
    "얼마나 답답하셨을지 느껴져요. " +
    "답답함은 내가 반복적으로 시도해도 관계나 상황이 달라지지 않는다는 무력감이 쌓일 때 나타납니다. 이 상황에서는 내 노력 자체가 상대에게 인식되지 않는다는 신호를 받은 거예요. " +
    "그 안에는 '내가 하는 일은 여기서 보이지 않는다'는 믿음이 자리잡혀 있습니다. " +
    "심리적으로 이 반응은 주지화(Intellectualization) 또는 수동적 저항의 형태로 자신을 보호하는 기제입니다. 전이적으로는 과거에 '아무리 해도 인정받지 못했던' 관계 패턴이 지금 이 상황에서 재활성화되고 있을 수 있어요. " +
    "지금 이 반응의 핵심은 내가 이 관계에서 영향력을 가진 구성원이 아니라, 결과에 반응만 하는 위치에 있다는 판단입니다.",

  anxiety:
    "많이 불안하셨겠어요. " +
    "불안은 결과를 예측할 수 없을 때 뇌가 먼저 위험을 감지하고 대비 상태로 전환하는 반응입니다. 이 상황에서는 상대의 행동 또는 관계의 방향이 내 통제 밖에 있다는 신호를 받은 거예요. " +
    "그 안에는 '이 상황이 나쁘게 끝날 수 있고, 나는 그것을 막을 수 없다'는 믿음이 깔려 있습니다. " +
    "심리적으로 이 반응은 과잉경계(Hypervigilance)와 예기불안이 결합된 상태입니다. 대상관계적으로는 예측 불가능한 초기 양육 환경에서 형성된 불안 애착 패턴이 현재의 관계 불확실성에 반응하는 것일 수 있어요. " +
    "지금 이 반응의 핵심은 이 관계에서 내 위치가 안정적으로 보장되어 있지 않다는 판단입니다.",

  hurt:
    "많이 아프셨겠어요. " +
    "상처는 내가 신뢰했던 관계에서 그 신뢰가 일방적이었다는 것을 확인했을 때 생깁니다. 이 상황에서는 상대가 나를 '배려의 대상'이 아닌 '처리할 사안'으로 다뤘다는 신호를 받은 거예요. " +
    "그 안에는 '나는 이 사람에게 내가 생각했던 만큼 중요하지 않았다'는 믿음이 자리합니다. " +
    "심리적으로 이 반응은 이상화(Idealization)가 붕괴되면서 나타나는 대상관계적 충격입니다. 신뢰하던 사람을 '좋은 대상'으로 유지하려는 내적 표상이 현실과 충돌하며 분열(Splitting)이 시작될 수 있어요. " +
    "지금 이 반응의 핵심은 이 사람이 내가 구축해온 신뢰의 표상과 실제로 동일한 사람인지에 대한 판단입니다.",

  humiliation:
    "많이 힘드셨겠어요, 특히 다른 사람들 앞에서였다면. " +
    "수치심은 내가 드러나고 평가받는 상황에서 그 평가가 부정적으로 인식될 때 발생하는 가장 강렬한 자기위협 감정입니다. 이 상황에서는 상대가 나를 공개적으로 '부족한 존재'로 위치시켰다는 신호를 받은 거예요. " +
    "그 안에는 '나는 그 자리에서 부족한 사람으로 보여졌다'는 믿음이 담겨 있습니다. " +
    "심리적으로 이 반응은 그 장면을 강박적으로 반복 재생하며 통제감을 되찾으려는 시도입니다. 자기-대상 경계가 취약할수록 타인의 시선이 자기 존재 전체에 대한 평가로 받아들여지며, 투사적 동일시(Projective Identification)가 작동해 '상대가 나를 무시한다'는 확신이 강화됩니다. " +
    "지금 이 반응의 핵심은 상대가 나를 교정이 필요한 대상으로 다른 사람들 앞에서 공개 지정했다는 판단입니다.",

  sadness:
    "많이 힘드셨겠어요. " +
    "슬픔은 중요하게 여기던 관계나 기대가 손상됐을 때 그 상실을 내면에서 처리하는 감정입니다. 이 상황에서는 내가 이 관계에 부여해온 의미가 상대에게는 다르게 존재했다는 신호를 받은 거예요. " +
    "그 안에는 '이 관계, 혹은 이 사람은 내가 생각했던 것과 달랐다'는 인식이 담겨 있습니다. " +
    "심리적으로 이 반응은 대상 상실(Object Loss)에 대한 애도 작업의 시작입니다. 분열 기제가 작동하지 않을 때 나타나는 성숙한 반응이지만, '좋은 대상'을 잃었다는 내적 공백감이 우울로 이어질 수 있어요. " +
    "지금 이 반응의 핵심은 이 관계를 지금까지 인식해온 방식대로 계속 유지할 수 있는지에 대한 판단입니다.",

  confusion:
    "상황이 잘 이해가 안 되는 느낌이 드셨겠어요. " +
    "혼란은 상황을 해석할 기준이 충돌하거나 상대의 의도를 읽을 수 없을 때 인지 체계가 과부하 상태에 빠지는 반응입니다. 이 상황에서는 상대의 행동이 기존에 내가 가진 관계 표상과 일치하지 않는다는 신호를 받은 거예요. " +
    "그 안에는 '내가 이 상황 또는 이 사람을 제대로 이해하고 있는지 모르겠다'는 인식론적 불안이 깔려 있습니다. " +
    "심리적으로 이 반응은 성급한 판단을 유보하는 심리적 안전장치입니다. 하지만 과거에 예측 불가능한 대상에 의해 반복적으로 혼란을 경험한 경우, 이 혼란 자체가 자동적 방어 패턴으로 굳어질 수 있어요. " +
    "지금 이 반응의 핵심은 상대가 신뢰 가능하게 일관된 사람인지, 아니면 상황에 따라 달라지는 사람인지에 대한 판단입니다.",

  overwhelmed:
    "지금 너무 많은 게 한꺼번에 쏟아지는 느낌이 드셨겠어요. " +
    "버거움은 처리해야 할 요구들이 자신의 감당 한계를 초과했을 때 내면이 보내는 경보입니다. 이 상황에서는 단순히 일이 많은 것이 아니라, 그 무게를 혼자 져야 한다는 구조 자체가 문제라는 신호예요. " +
    "그 안에는 '나는 이것을 혼자 감당해서는 안 되지만, 그렇게 할 수밖에 없다'는 믿음이 담겨 있습니다. " +
    "심리적으로 이 반응은 오랜 기간 쌓인 자기희생적 적응 패턴이 붕괴되는 신호입니다. 대상관계적으로는 '도움을 요청해도 받지 못했던' 초기 경험이 지금도 작동하며, 한계를 표현하는 것 자체에 무의식적 저항이 생길 수 있어요. " +
    "지금 이 반응의 핵심은 상대가 나의 한계를 인식하고도 계속 요구하는 사람인지, 아니면 내 한계를 애초에 고려하지 않는 관계 구조 안에 내가 있는지에 대한 판단입니다.",
};

function buildEmotionSummary(emotion: string, intensity: number): string {
  const base =
    EMOTION_SUMMARIES[emotion] ??
    "지금 느끼는 감정은 충분히 타당하며, 세심하게 살펴볼 가치가 있습니다.";
  if (intensity >= 8) {
    return (
      base +
      " 지금 감정의 강도가 매우 높은 상태예요. 이 상태에서 바로 대화를 시작하기보다 먼저 감정을 가라앉힐 시간을 갖는 것을 권해드립니다."
    );
  }
  return base;
}

// ─── Underlying needs ────────────────────────────────────────────────────────

const EMOTION_NEEDS: Record<string, string[]> = {
  anger:       ["존중", "공정함", "자율성"],
  frustration: ["인정", "진전", "명확한 방향"],
  anxiety:     ["안전감", "예측 가능성", "지지"],
  hurt:        ["연결감", "공감", "신뢰"],
  humiliation: ["존엄성", "존중", "심리적 안전감"],
  sadness:     ["연결감", "신뢰", "소속감"],
  confusion:   ["명확성", "투명성", "정보"],
  overwhelmed: ["지지", "균형", "경계"],
};

function buildNeeds(emotion: string, conflictType: ConflictType) {
  const emotionNeeds = EMOTION_NEEDS[emotion] ?? ["존중", "명확성"];
  const typeExtra: Partial<Record<ConflictType, string>> = {
    power_dynamics: "공정함",
    role_clarity:   "명확한 방향",
    workload:       "균형",
    values:         "진정성",
    communication:  "경청",
  };
  const extra = typeExtra[conflictType];
  const needs =
    extra && !emotionNeeds.includes(extra)
      ? [...emotionNeeds, extra]
      : emotionNeeds;

  return {
    needs,
    summary: `지금 가장 필요한 건 ${needs.slice(0, 2).join(", ")}입니다. 이런 마음은 누구나 느낄 수 있는 자연스러운 바람이에요. 이를 인식하고 표현하는 것이 더 나은 소통의 시작입니다.`,
  };
}

// ─── Situation summary ───────────────────────────────────────────────────────

function buildSituationSummary(
  situation: string,
  relationship: string,
  emotion: string
): string {
  const rel =
    relationship === "manager"
      ? "상사"
      : relationship === "subordinate"
      ? "부하직원"
      : "동료";
  const emotionKo = EMOTION_LABELS_KO[emotion] ?? emotion;
  const snippet =
    situation.length > 120
      ? situation.slice(0, 120).trimEnd() + "…"
      : situation;
  return `${rel}${wa(rel)}의 상황에서 ${emotionKo}${eul(emotionKo)} 느끼신 것 같아요. 아래 내용은 작성해 주신 상황을 바탕으로 정리했어요. "${snippet}"`;
}

// ─── Clinical Intervention: 타당화 → 즉시성 → 해석+행동요청 ──────────────────

type RelKey = "manager" | "coworker" | "subordinate";

// 1단계: 타당화 (Validation) — 저항 없이 수용, 보유 환경 조성
const VALIDATION: Record<RelKey, Record<string, string>> = {
  manager: {
    anger:       "직접 말씀드리기 어려운 상황이라는 거 알아요. 그 감정이 생긴 건 당연한 반응이에요.",
    frustration: "열심히 했는데 그게 인식이 안 됐을 때 얼마나 지치는지, 그 감각이 느껴져요.",
    anxiety:     "어떻게 될지 모르는 상황에서 그 불안을 혼자 감당해왔다는 게 보여요.",
    hurt:        "믿었던 만큼 더 크게 다가왔을 거예요. 그 마음이 틀린 게 아니에요.",
    humiliation: "그 자리에서 그런 일이 있었다면, 그 이후로 그 장면이 계속 떠올랐을 거예요.",
    sadness:     "뭔가 중요한 게 달라졌다는 걸 느끼는 건데, 그게 쉽게 정리되지 않는 게 당연해요.",
    confusion:   "상황이 이해가 안 된다는 건 내가 잘못 본 게 아니라, 실제로 일관성이 없었다는 뜻일 수 있어요.",
    overwhelmed: "지금 상태에서 그걸 계속 혼자 감당해왔다는 게, 오히려 더 무리였던 거예요.",
  },
  coworker: {
    anger:       "그 상황에서 화가 난 건 당연해. 참는 게 맞는 반응이 아니었어.",
    frustration: "아무리 해도 달라지지 않는 느낌, 그게 진짜 힘든 거야.",
    anxiety:     "모르는 상태로 버티는 게 얼마나 소진되는지 알아.",
    hurt:        "그렇게 됐을 때 상처받는 게 맞는 거야. 네가 예민한 게 아니야.",
    humiliation: "앞에서 그런 일이 있었다면 그게 쉽게 지나가지 않았을 것 같아.",
    sadness:     "뭔가 달라진 것 같다는 느낌, 그게 착각이 아닐 수 있어.",
    confusion:   "이해가 안 되는 게 네 문제가 아니야. 실제로 앞뒤가 안 맞는 거야.",
    overwhelmed: "지금 이 상태가 정상이 아닌 거 맞아. 버티는 게 답이 아니야.",
  },
  subordinate: {
    anger:       "그 상황에서 화가 난 건 타당한 반응이에요. 말하기 어려운 위치였다는 것도 알아요.",
    frustration: "반복이 되면 포기하는 게 아니라 지치는 거예요. 그 차이가 있어요.",
    anxiety:     "아랫사람 입장에서 모르는 상태로 있는 게 더 불안한 거예요. 당연한 반응이에요.",
    hurt:        "위치가 달라도 상처는 똑같이 느껴지는 거예요.",
    humiliation: "그 자리에서 그게 어떻게 들렸을지, 충분히 이해가 돼요.",
    sadness:     "뭔가 기대했던 것과 달라졌을 때 그 실망이 작지 않아요.",
    confusion:   "지시가 바뀌거나 일관성이 없을 때 혼란스러운 건 당연해요.",
    overwhelmed: "지금 감당 이상이 쌓인 거예요. 그걸 인식하는 게 먼저예요.",
  },
};

// 2단계: 즉시성 (Immediacy / Here-and-Now) — 지금 이 관계에서 무슨 일이 일어나고 있는지 직면
const IMMEDIACY: Record<ConflictType, Record<string, string>> = {
  power_dynamics: {
    anger:       "그 피드백이 전달된 방식이 지금 이 관계에서 뭔가를 바꿔놓은 것 같아요. 그 이후로 이 관계가 다르게 느껴지진 않나요?",
    frustration: "비판을 반복해서 받으면서도 그걸 말하지 못한 구조 자체가 지금 이 관계의 문제일 수 있어요.",
    humiliation: "그 자리에서 일어난 일이 두 사람 사이의 힘의 구조를 드러낸 순간이었을 수 있어요.",
    anxiety:     "이 관계에서 내 위치가 흔들릴 수 있다는 신호를 받은 거라면, 그게 불안의 진짜 이유일 수 있어요.",
    hurt:        "신뢰했던 사람에게서 그런 방식이 나왔을 때, 그 관계에 대한 기대 자체가 흔들리는 게 당연해요.",
    sadness:     "이 관계에서 뭔가 근본적인 게 달라졌다는 느낌이 드는 건, 실제로 그 변화가 일어났기 때문일 수 있어요.",
    confusion:   "상황이 이해가 안 된다는 건, 상대의 행동에 일관된 기준이 없다는 신호일 수 있어요.",
    overwhelmed: "이 관계에서 내가 계속 수용하는 역할을 맡아온 패턴이 지금 한계에 다다른 것일 수 있어요.",
  },
  communication: {
    anger:       "말이 전달됐는데 무시됐다는 느낌, 그게 지금 이 관계에서 패턴이 됐을 수 있어요.",
    frustration: "의사소통이 반복적으로 막히는 구조가 지금 이 관계에서 자리잡혀 있을 수 있어요.",
    anxiety:     "소통이 안 될 때마다 내 위치가 불안정하게 느껴졌다면, 그게 단순한 오해가 아닐 수 있어요.",
    hurt:        "말을 했는데 받아들여지지 않은 경험이 반복됐다면, 그게 상처로 쌓인 게 당연해요.",
    humiliation: "그 말이 그 자리에서 나온 방식 자체가 문제예요. 내용보다 구조가 잘못된 거예요.",
    sadness:     "소통이 계속 어긋나는 관계라면, 그 안에서 뭔가를 잃어가고 있다는 느낌이 드는 게 맞아요.",
    confusion:   "소통이 안 된 건지, 상대가 달라진 건지 구분이 안 된다면 먼저 그걸 짚어야 해요.",
    overwhelmed: "말이 안 통하는 상태에서 계속 일을 감당해왔다면, 그 피로가 지금 한꺼번에 터진 거예요.",
  },
  workload: {
    overwhelmed: "지금 요구받는 양이 감당 가능한 수준인지, 아니면 구조적으로 불가능한 상황인지를 짚어야 해요.",
    frustration: "노력한다고 해결되지 않는 상황이라면, 노력의 문제가 아닐 수 있어요.",
    anger:       "업무 구조가 불공정하다는 걸 알면서도 말을 못 했다면, 그 분노는 당연한 거예요.",
    anxiety:     "마감과 과부하가 반복되면 뇌가 항상 위험 상태로 있는 거예요. 그게 불안의 원인이에요.",
    hurt:        "내 한계를 알면서도 계속 요구받는다는 느낌이 있었다면, 그게 상처가 된 거예요.",
    sadness:     "이 일이 원래 좋았는데 지금은 버겁다면, 그 변화 자체가 상실이에요.",
    confusion:   "뭘 먼저 해야 하는지 모르는 상태가 됐다면, 우선순위가 정리되지 않은 구조 문제예요.",
    humiliation: "과부하 상태에서 실수가 나왔을 때 그게 공개됐다면, 구조의 문제가 개인의 실수로 보여진 거예요.",
  },
  role_clarity: {
    confusion:   "역할이 불분명한 채로 계속 일이 진행되고 있다면, 그 혼란은 내 문제가 아니라 구조의 문제예요.",
    frustration: "어디까지가 내 일인지 명확하지 않은 상태가 지금 이 관계에서 유지되고 있는 거예요.",
    anger:       "내 역할 밖의 일을 계속 요구받고 있다면, 그 분노는 경계가 침범당한 신호예요.",
    overwhelmed: "역할 경계가 없는 상태에서 모든 걸 감당해왔다면, 지금 버거운 게 당연해요.",
    anxiety:     "내가 뭘 해야 하는지 모르는 상태가 지속되면 불안이 쌓이는 게 당연해요.",
    hurt:        "내 역할에 대한 합의가 없는 상태에서 비난을 받았다면, 그 상처는 정당한 거예요.",
    sadness:     "역할이 계속 바뀌거나 명확하지 않았다면, 이 일에서 내 자리가 어딘지 모르는 느낌이 드는 게 당연해요.",
    humiliation: "역할이 불분명한 상황에서 책임 추궁을 받았다면, 그건 구조의 문제가 나에게 전가된 거예요.",
  },
  values: {
    anger:       "서로 다른 기준으로 움직이면서 충돌이 생긴 거예요. 그게 성격 차이가 아니라 가치관의 문제예요.",
    hurt:        "내가 중요하게 여기는 것이 상대에게는 그렇지 않다는 게 확인됐을 때 생기는 감정이에요.",
    frustration: "가치관이 다른 사람과 계속 같이 일하는 건 마찰이 생길 수밖에 없어요. 그 피로가 쌓인 거예요.",
    sadness:     "이 조직이나 관계가 내가 중요하게 여기는 것과 다르다는 걸 알게 됐을 때, 그 상실감은 진짜예요.",
    confusion:   "뭐가 맞는 건지 모르겠다는 혼란은, 상대의 기준이 자꾸 바뀌거나 일관성이 없어서일 수 있어요.",
    anxiety:     "내 가치관과 조직의 방향이 계속 충돌하면, 여기서 내 자리가 있는지에 대한 불안이 생기는 게 당연해요.",
    overwhelmed: "가치관이 다른 환경에서 버텨온 게 쌓여서 지금 한꺼번에 터진 것일 수 있어요.",
    humiliation: "내가 맞다고 생각하는 방식이 틀린 것처럼 공개적으로 취급됐다면, 그게 수치심의 진짜 원인이에요.",
  },
    role: {
    anger: "맡아야 할 역할과 기대가 어긋나면서 감정이 거칠어졌을 가능성이 있어요.",
    frustration: "내가 감당해야 할 몫과 상대가 기대하는 몫이 어긋난 채 반복되고 있는 것 같아요.",
    humiliation: "내 역할이 충분히 존중받지 못했다는 느낌이 지금 반응을 더 크게 만들었을 수 있어요.",
    anxiety: "내가 어디까지 책임져야 하는지 불분명해서 긴장이 커진 것 같아요.",
    hurt: "내가 맡은 자리와 기여가 가볍게 여겨졌다는 느낌이 남아 있을 수 있어요.",
    sadness: "서로의 역할 기대가 맞지 않으면서 관계의 온도도 같이 내려간 것 같아요.",
    confusion: "무엇이 내 책임이고 어디까지가 상대 역할인지 흐려져 있는 상태 같아요.",
    overwhelmed: "역할 경계가 흐려진 채 여러 요구가 겹쳐서 버거움이 커진 것 같아요.",
  },

  trust: {
    anger: "상대의 말이나 행동을 더는 곧이곧대로 믿기 어렵다는 감각이 지금 반응에 깔려 있는 것 같아요.",
    frustration: "예상했던 신뢰가 깨진 뒤에도 그 상태를 계속 감당해야 해서 지치는 흐름이 보입니다.",
    humiliation: "신뢰가 흔들린 상황에서 내가 가볍게 취급됐다는 감각이 남아 있을 수 있어요.",
    anxiety: "상대가 또 비슷하게 행동할지 모른다는 불안이 긴장을 키우는 것 같아요.",
    hurt: "기대했던 믿음이 깨진 데서 오는 상처가 아직 정리되지 않은 상태일 수 있어요.",
    sadness: "관계의 기본이던 신뢰가 약해졌다고 느끼면서 마음이 가라앉는 것 같아요.",
    confusion: "무엇을 믿어야 하는지 기준이 흔들려서 해석이 계속 어려워지는 상태 같아요.",
    overwhelmed: "신뢰가 흔들린 관계를 계속 관리해야 한다는 부담이 크게 쌓인 것 같아요.",
  },

  boundary: {
    anger: "내 선을 넘었다는 감각이 분명해서 감정이 즉각적으로 올라온 것 같아요.",
    frustration: "불편한 지점이 반복되는데도 경계가 조정되지 않아서 답답함이 누적된 흐름으로 보여요.",
    humiliation: "내 경계가 존중되지 않았다는 경험이 자존감을 건드렸을 수 있어요.",
    anxiety: "다시 선이 침범될 수 있다는 걱정이 경계심을 높이고 있는 것 같아요.",
    hurt: "가까워야 할 관계에서조차 내 기준이 존중되지 않았다는 상처가 느껴질 수 있어요.",
    sadness: "내 공간이나 기준이 지켜지지 않는 관계라는 인식이 마음을 무겁게 만든 것 같아요.",
    confusion: "어디까지 허용해야 하고 어디서 멈춰 세워야 하는지 기준이 흔들리고 있을 수 있어요.",
    overwhelmed: "계속 경계를 세우고 설명해야 하는 피로가 크게 쌓여 있는 것 같아요.",
  },
};

// 3단계: 해석 + 행동 요청 (Interpretation + Clear Behavioral Request)
// — 무의식적 기능을 드러내고 관계 역동을 바꾸는 구체적 요청
const INTERPRETATION_REQUEST: Record<ConflictType, Record<RelKey, string>> = {
  power_dynamics: {
    manager:     "지금 이 패턴이 계속되면, 저는 피드백을 받는 역할로만 고정돼요. 앞으로 피드백을 주실 때는 단둘이 있는 자리에서 해주세요. 그게 저한테는 존중의 방식이에요.",
    coworker:    "이 관계에서 내가 계속 수용하는 위치에 있으면 아무것도 안 바뀌어. 다음에 이런 상황이 생기면 그 자리에서 바로 말할 거야.",
    subordinate: "위계가 있어도 피드백 방식은 같이 정할 수 있어요. 앞으로는 이런 방식으로 전달해주셨으면 해요.",
  },
  communication: {
    manager:     "제가 말한 게 어떻게 받아들여졌는지 확인이 안 돼요. 중요한 사안은 서로 확인하는 방식으로 소통하고 싶어요.",
    coworker:    "말은 했는데 전달이 안 된 것 같아. 어떻게 소통하면 더 잘 될지 같이 정해보자.",
    subordinate: "전달했는데 제대로 전달이 안 된 게 반복되고 있어요. 소통 방식을 한 번 짚어봤으면 해요.",
  },
  workload: {
    manager:     "지금 수준은 지속이 안 돼요. 우선순위를 같이 정해주셨으면 해요.",
    coworker:    "이대로 계속하면 나도 무너져. 업무 분담을 다시 조정하자.",
    subordinate: "지금 제 상황을 말씀드릴게요. 조정이 필요한 것 같아요.",
  },
  role_clarity: {
    manager:     "제 역할 범위를 명확히 해주셨으면 해요. 지금은 어디까지가 제 일인지 모르는 상태예요.",
    coworker:    "서로 기대하는 게 다른 것 같아. 한 번 명확히 해두자.",
    subordinate: "업무 범위를 다시 확인하고 싶어요. 지금 기준이 명확하지 않아서요.",
  },
  values: {
    manager:     "제가 중요하게 여기는 방식이 있어요. 그게 어떻게 받아들여지는지 한 번은 말씀드리고 싶었어요.",
    coworker:    "우리가 다른 기준으로 움직이고 있는 것 같아. 그게 계속 충돌로 나오기 전에 얘기해두고 싶어.",
    subordinate: "제가 생각하는 방식과 다를 수 있는데, 그 차이를 한 번은 이야기해보고 싶어요.",
  },
    role: {
    manager: "지금 역할 기대가 계속 흐리면 저는 책임만 더 지고 기준은 못 받게 됩니다. 앞으로는 제가 맡을 일과 팀장님이 기대하는 범위를 먼저 분명히 맞춰 주세요.",
    coworker: "이 관계에서 역할이 흐린 채 넘어가면 항상 누가 더 많이 하는지만 남아요. 다음에는 시작 전에 서로 맡을 범위를 분명히 정했으면 좋겠어.",
    subordinate: "역할 기준이 불분명하면 서로 답답해지기만 합니다. 다음부터는 무엇을 누가 어디까지 맡는지 먼저 분명히 하고 진행합시다.",
  },

  trust: {
    manager: "지금처럼 신뢰가 흔들린 상태가 계속되면 저는 방어적으로 일하게 됩니다. 앞으로는 판단 전에 사실 확인부터 같이 해 주셨으면 합니다.",
    coworker: "이 관계에서 신뢰가 계속 흔들리면 나는 네 말을 편하게 받아들이기 어려워져. 다음에는 오해가 생기기 전에 사실부터 바로 맞추자.",
    subordinate: "신뢰가 흔들린 채로 일을 하면 작은 문제도 크게 번집니다. 다음부터는 추측보다 확인을 먼저 하는 방식으로 맞춰 갑시다.",
  },

  boundary: {
    manager: "지금처럼 제 경계가 계속 넘어와지면 저는 일에만 집중하기 어려워집니다. 앞으로는 어떤 방식과 범위까지 요청하시는지 선을 분명히 해 주셨으면 합니다.",
    coworker: "내 선이 계속 흐려지면 결국 감정부터 상하게 돼. 다음에는 어디까지는 괜찮고 어디부터는 어려운지 서로 분명히 말하자.",
    subordinate: "경계가 불분명하면 서로 불편만 커집니다. 다음부터는 가능한 범위와 어려운 범위를 먼저 분명히 하고 진행합시다.",
  },
};

// 소크라테스식 질문 — 자동적 신념 논박 (경험적/논리적/실용적/대안적)
const SOCRATIC_QUESTIONS: Record<string, string[]> = {
  anger: [
    "이 상황에서 상대가 의도적으로 나를 해치려 했다는 근거가 실제로 있나요? (경험적 논박)",
    "이 화를 지금 표현하면 이 관계가 어떻게 달라질 것 같나요? (실용적 논박)",
    "이 관계에서 내가 진짜 원하는 게 뭔지, 한 문장으로 말할 수 있나요? (대안적 논박)",
  ],
  frustration: [
    "내 노력이 인식되지 않는다는 게 사실인지, 구체적인 증거가 있나요? (경험적 논박)",
    "지금 방식이 계속 통하지 않는다면, 어떤 다른 방식이 가능할까요? (실용적 논박)",
    "이 관계에서 내가 실제로 바꿀 수 있는 게 있다면 뭘까요? (대안적 논박)",
  ],
  anxiety: [
    "내가 두려워하는 최악의 결과가 실제로 일어날 가능성이 얼마나 되나요? (경험적 논박)",
    "지금 불안이 나를 보호하고 있나요, 아니면 소진시키고 있나요? (실용적 논박)",
    "이 상황에서 내가 통제할 수 있는 것과 없는 것을 구분하면 어떻게 되나요? (대안적 논박)",
  ],
  hurt: [
    "상대가 나를 중요하지 않게 여긴다는 게 이번 한 번의 행동으로 확인된 건가요? (논리적 논박)",
    "이 관계에서 상처받지 않았던 순간도 있었나요? (경험적 논박)",
    "이 사람을 어떻게 대하는 게 나에게 가장 좋은 선택인지 생각해본 적 있나요? (대안적 논박)",
  ],
  humiliation: [
    "그 자리에서 실제로 일어난 일과, 내가 해석한 것을 분리하면 어떤가요? (논리적 논박)",
    "그 장면을 계속 재생하는 게 지금 나에게 어떤 도움이 되고 있나요? (실용적 논박)",
    "그 상황에서 내 행동 중 내가 괜찮다고 느끼는 부분이 하나라도 있나요? (대안적 논박)",
  ],
  sadness: [
    "이 관계나 기대가 완전히 사라진 건지, 아니면 달라진 건지 구분할 수 있나요? (논리적 논박)",
    "이 슬픔을 느끼면서도 계속 이 관계를 유지하려는 이유가 뭔가요? (실용적 논박)",
    "지금 이 관계에서 내가 원하는 게 뭔지 아직 알고 있나요? (대안적 논박)",
  ],
  confusion: [
    "상황이 이해가 안 되는 게 내 판단력의 문제인지, 아니면 실제로 일관성이 없는 건지 어떻게 확인할 수 있나요? (경험적 논박)",
    "지금 결론을 내리지 않고 있는 게 나를 보호하고 있나요, 아니면 더 불안하게 만들고 있나요? (실용적 논박)",
    "지금 가장 먼저 확인하고 싶은 게 하나라면 뭔가요? (대안적 논박)",
  ],
  overwhelmed: [
    "지금 내가 감당하는 것들 중 실제로 내 책임인 게 얼마나 되나요? (논리적 논박)",
    "한 가지를 내려놓는다면 어떤 일이 실제로 일어날까요? (경험적 논박)",
    "도움을 요청하는 것이 왜 어렵게 느껴지나요? 그 이유가 지금도 유효한가요? (대안적 논박)",
  ],
};

// ─── Dialogue builder ────────────────────────────────────────────────────────

function buildDialogue(
  relationship: string,
  emotion: string,
  conflictType: ConflictType,
  intensity: number
) {
  const relKey: RelKey =
    relationship === "manager" || relationship === "subordinate"
      ? relationship
      : "coworker";

  // 3단계 임상 개입 조합
  const validation =
    VALIDATION[relKey][emotion] ?? VALIDATION[relKey]["frustration"];
  const immediacyEntry = IMMEDIACY[conflictType];
  const immediacy =
    (immediacyEntry as Record<string, string>)[emotion] ??
    (immediacyEntry as Record<string, string>)["frustration"] ??
    "";
  const interpretationRequest =
    INTERPRETATION_REQUEST[conflictType][relKey];

  // 자연스러운 발화 흐름으로 조합
  const openingStatement = `${validation} ${immediacy} ${interpretationRequest}`;

  // keyPoints — 3단계 구조를 레이블과 함께 표시
  const keyPoints = [
    `[타당화] ${validation}`,
    `[즉시성] ${immediacy}`,
    `[해석·요청] ${interpretationRequest}`,
  ];

  const thingsToAvoidByRelationship: Record<string, string[]> = {
    manager: [
      "다른 사람이 있는 자리나 상대방이 바쁠 때 꺼내기",
      "대화가 아닌 일방적인 불만처럼 들릴 수 있는 방식으로 접근하기",
      "위협적인 표현이나 최후통첩 사용하기",
    ],
    coworker: [
      "일대일로 먼저 이야기하기 전에 다른 사람을 끌어들이기",
      "간접적인 불만 표현이나 회피하는 태도",
      "문제가 더 커질 때까지 방치하기",
    ],
    subordinate: [
      "직위를 내세워 대화를 일방적으로 마무리짓기",
      "상대방 말을 먼저 듣기보다 방어적으로 반응하기",
      "문제를 꺼내는 것 자체를 부담스럽게 만들기",
    ],
  };

  if (intensity >= 8) {
    keyPoints.unshift("⚠️ 감정이 충분히 가라앉은 뒤에 대화를 시작하세요");
  }

  return {
    openingStatement,
    keyPoints,
    thingsToAvoid:
      thingsToAvoidByRelationship[relationship] ??
      thingsToAvoidByRelationship["coworker"],
    socraticQuestions:
      SOCRATIC_QUESTIONS[emotion] ?? SOCRATIC_QUESTIONS["frustration"],
  };
}

// ─── Action guide ────────────────────────────────────────────────────────────

function buildActionGuide(relationship: string, intensity: number) {
  const immediate =
    intensity >= 8
      ? [
          "오늘 당장 대화를 시작하지 않아도 됩니다. 먼저 감정이 가라앉을 시간을 주세요",
          "지금 느끼는 것들을 판단 없이 솔직하게 적어보세요. 자신만을 위한 기록이에요",
          "짧게라도 몸을 움직여 보세요. 산책이나 호흡처럼 자신에게 맞는 방법이면 돼요",
          "마음이 좀 가라앉으면, 정말 하고 싶은 말과 그 이유를 차분히 정리해보세요",
        ]
      : [
          "대화 전에 전하고 싶은 말을 미리 적어두세요",
          "조용하고 편안한 분위기에서 대화할 시간을 잡으세요",
          "목표를 분명히 하세요. 이기는 것이 아니라 서로를 이해하는 것이에요",
        ];

  const longTermByRelationship: Record<string, string[]> = {
    manager: [
      "정기적인 일대일 대화 시간을 만들어두면 갑작스러운 피드백을 줄일 수 있어요",
      "먼저 피드백을 요청하는 습관을 들이면 덜 위협적으로 느껴질 수 있습니다",
      "중요한 대화 후에는 합의한 내용과 기대를 간단히 기록으로 남겨두세요",
    ],
    coworker: [
      "갈등과 무관한 상황에서도 관계에 신경 써보세요. 작은 긍정적인 교류들이 쌓이면 관계가 달라집니다",
      "문제가 커지기 전에 편하게 이야기 나눌 수 있는 분위기를 평소부터 만들어 두세요",
      "서로 균형 있게 느끼는지 가끔 확인해보세요",
    ],
    subordinate: [
      "본인이 먼저 피드백에 열린 태도를 보여주면 상대방도 더 편하게 이야기할 수 있어요",
      "대화 이후에도 업무 관계가 달라지지 않았다는 것을 행동으로 보여주세요",
      "비슷한 문제가 반복되지 않도록 팀 안의 소통 방식을 함께 점검해보세요",
    ],
  };

  return {
    immediate,
    longTerm:
      longTermByRelationship[relationship] ??
      longTermByRelationship["coworker"],
  };
}

// ─── Main generator ──────────────────────────────────────────────────────────

export function generateMockResult(input: ConflictFormValues): ConflictAnalysisResult {
  const { situation, relationship, emotion, intensity } = input;
  const conflict = classifyConflictType(situation);

  return {
    situationSummary: buildSituationSummary(situation, relationship, emotion),
    emotionAnalysis: {
      primary: EMOTION_LABELS_KO[emotion] ?? emotion,
      intensity,
      intensityLabel: intensityLabel(intensity),
      summary: buildEmotionSummary(emotion, intensity),
    },
    underlyingNeeds: buildNeeds(emotion, conflict.type),
    conflictAnalysis: conflict,
    dialogueSuggestion: buildDialogue(relationship, emotion, conflict.type, intensity),
    actionGuide: buildActionGuide(relationship, intensity),
  };
}
