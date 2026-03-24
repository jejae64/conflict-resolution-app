export type Emotion =
  | "anger"
  | "frustration"
  | "anxiety"
  | "hurt"
  | "humiliation"
  | "sadness"
  | "confusion"
  | "overwhelmed";

export type RelationshipType = "boss" | "peer" | "subordinate";

export type ConflictType =
  | "communication"
  | "role"
  | "trust"
  | "workload"
  | "boundary"
  | "values"
  | "power_dynamics"
  | "role_clarity";

export interface ConflictInput {
  situation: string;
  relationship: string;
  emotion: string;
  intensity: number;
}

export interface EmotionAnalysis {
  primary: string;
  intensityLabel: string;
  summary: string;
}

export interface ConflictAnalysis {
  type: ConflictType;
  description: string;
}

export interface DialogueResponses {
  denial: string[];
  avoidance: string[];
  defensive: string[];
}

export interface Dialogue {
  sentencesSoft: string[];
  sentencesAssertive: string[];
  scriptSoft: string;
  scriptAssertive: string;
  responses: DialogueResponses;
  thingsToAvoid: string[];
}

export interface ActionGuide {
  immediate: string[];
  longTerm: string[];
}

export interface ConflictAnalysisResult {
  emotionAnalysis: EmotionAnalysis;
  underlyingNeeds: string[];
  conflictAnalysis: ConflictAnalysis;
  situationSummary: string;
  relationshipType: RelationshipType;
  dialogue: Dialogue;
  actionGuide: ActionGuide;
}
