# MVP Architecture — Workplace Conflict Resolution App

## 1. Folder Structure

```
conflict-resolution-app/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Step 1: conflict input form
│   │   ├── analysis/
│   │   │   └── page.tsx            # Step 2: analysis results
│   │   ├── layout.tsx
│   │   └── api/
│   │       └── analyze/
│   │           └── route.ts        # POST /api/analyze
│   ├── components/
│   │   ├── ConflictForm/
│   │   │   ├── index.tsx           # Form container (orchestrates sub-components)
│   │   │   ├── SituationInput.tsx  # Textarea for conflict description
│   │   │   ├── EmotionSelector.tsx # Emotion picker (buttons/chips)
│   │   │   └── IntensitySlider.tsx # Intensity 1–10 slider
│   │   ├── AnalysisResult/
│   │   │   ├── index.tsx           # Result container
│   │   │   ├── EmotionCard.tsx     # Detected emotion + intensity
│   │   │   ├── NeedsCard.tsx       # Underlying needs
│   │   │   ├── ConflictTypeCard.tsx
│   │   │   ├── DialogueSuggestion.tsx
│   │   │   └── ActionGuide.tsx
│   │   └── shared/
│   │       └── HighIntensityWarning.tsx  # Shown when intensity >= 8
│   ├── lib/
│   │   ├── analysis/               # Pure analysis logic (no UI, no fetch)
│   │   │   ├── emotionAnalysis.ts  # Determine tooHighToConverse, label intensity
│   │   │   ├── needsAnalysis.ts    # Map emotion + situation → underlying needs
│   │   │   └── conflictClassifier.ts  # Classify conflict type
│   │   ├── prompts/                # Prompt construction logic (no API calls here)
│   │   │   ├── buildAnalysisPrompt.ts
│   │   │   └── buildDialoguePrompt.ts
│   │   └── mock/
│   │       └── sampleAnalysis.ts   # Static mock response for development
│   └── types/
│       └── conflict.ts             # All shared types (see Section 5)
├── docs/
│   ├── product.md
│   └── architecture.md
└── public/
```

---

## 2. Component Structure

```
app/page.tsx
└── ConflictForm
    ├── SituationInput          ← free-text textarea
    ├── EmotionSelector         ← pick one primary emotion
    ├── IntensitySlider         ← 1–10
    └── [Submit button]

app/analysis/page.tsx
├── HighIntensityWarning        ← rendered only when intensity >= 8
└── AnalysisResult
    ├── EmotionCard             ← primary emotion, intensity, intensity label
    ├── NeedsCard               ← list of underlying needs
    ├── ConflictTypeCard        ← conflict type + short description
    ├── DialogueSuggestion      ← opening statement, key points, things to avoid
    └── ActionGuide             ← immediate steps + long-term steps
```

**Routing strategy:** After form submit, the input is stored in `sessionStorage` and the user is navigated to `/analysis`. The analysis page reads the input on mount, calls `/api/analyze`, and renders the result. This keeps the URL clean and avoids large query strings.

---

## 3. Data Flow

```
[User fills ConflictForm]
        │
        ▼
[sessionStorage.setItem('conflictInput', JSON)]
        │
        ▼
[router.push('/analysis')]
        │
        ▼
[analysis/page.tsx — useEffect on mount]
        │  reads sessionStorage
        ▼
[POST /api/analyze  { situation, emotion, intensity }]
        │
        ├─ (dev)  → lib/mock/sampleAnalysis.ts  ← returns immediately
        │
        └─ (prod) → lib/prompts/buildAnalysisPrompt.ts
                         │
                         ▼
                    Claude API call
                         │
                         ▼
                    lib/analysis/*.ts  ← post-process / validate response
        │
        ▼
[ConflictAnalysisResult JSON]
        │
        ▼
[AnalysisResult components render]
```

**Intensity gate:** The gate lives purely on the client inside `ConflictForm`. If `intensity >= 8`, the form shows `HighIntensityWarning` and disables submission until the user explicitly acknowledges ("I understand, continue anyway").

---

## 4. API Design

### `POST /api/analyze`

**Request body**
```json
{
  "situation": "My manager criticized my work in front of the whole team...",
  "emotion": "humiliation",
  "intensity": 7
}
```

**Success response — 200**
```json
{
  "emotionAnalysis": { ... },
  "underlyingNeeds": { ... },
  "conflictAnalysis": { ... },
  "dialogueSuggestion": { ... },
  "actionGuide": { ... }
}
```

**Error response — 400 / 500**
```json
{ "error": "situation is required" }
```

**Notes**
- In MVP, the route uses the mock when `process.env.USE_MOCK === 'true'` (default in dev).
- No auth headers required.
- No rate limiting in MVP.

---

## 5. Types / Schema for Conflict Analysis Result

```typescript
// src/types/conflict.ts

export type Emotion =
  | 'anger'
  | 'frustration'
  | 'sadness'
  | 'anxiety'
  | 'humiliation'
  | 'hurt'
  | 'confusion'
  | 'overwhelmed'

export type ConflictType =
  | 'communication'       // misunderstanding, tone, unclear expectations
  | 'values'              // different work ethics or priorities
  | 'role_clarity'        // unclear responsibilities
  | 'power_dynamics'      // manager/subordinate tension
  | 'workload'            // unequal or excessive load

export interface ConflictInput {
  situation: string       // raw user text
  emotion: Emotion        // selected primary emotion
  intensity: number       // 1–10
}

export interface EmotionAnalysis {
  primary: Emotion
  intensity: number
  intensityLabel: 'low' | 'moderate' | 'high' | 'very_high'
  tooHighToConverse: boolean  // true when intensity >= 8
  summary: string             // 1–2 sentence human-readable summary
}

export interface UnderlyingNeeds {
  needs: string[]   // e.g. ["respect", "autonomy", "clarity"]
  summary: string   // 1–2 sentences explaining the needs in context
}

export interface ConflictAnalysis {
  type: ConflictType
  description: string   // why this type fits the situation
}

export interface DialogueSuggestion {
  openingStatement: string   // ready-to-use first sentence
  keyPoints: string[]        // 2–4 things to communicate
  thingsToAvoid: string[]    // 2–3 pitfalls
}

export interface ActionGuide {
  immediate: string[]    // things to do before the conversation
  longTerm: string[]     // habits or follow-ups after resolution
}

export interface ConflictAnalysisResult {
  emotionAnalysis: EmotionAnalysis
  underlyingNeeds: UnderlyingNeeds
  conflictAnalysis: ConflictAnalysis
  dialogueSuggestion: DialogueSuggestion
  actionGuide: ActionGuide
}
```

---

## Separation of Concerns

| Layer | Location | Responsibility |
|---|---|---|
| UI | `src/components/` | Render, user interaction, layout |
| Analysis logic | `src/lib/analysis/` | Intensity gating, need mapping, type classification |
| Prompt logic | `src/lib/prompts/` | Build prompt strings from input; no API calls |
| API boundary | `src/app/api/analyze/` | Call Claude (or mock), validate, return typed result |
| Types | `src/types/conflict.ts` | Shared schema across all layers |

Mock data in `src/lib/mock/` lets all UI and analysis logic be built and tested without an active Claude API key.
