export type RiskLevel = "low" | "medium" | "high";

const HIGH_KEYWORDS = [
  "suicide", "kill myself", "end my life", "want to die", "end it all",
  "no reason to live", "better off dead", "self harm", "self-harm", "cut myself",
];
const MEDIUM_KEYWORDS = [
  "hopeless", "worthless", "can't go on", "cant go on", "give up",
  "depressed", "depression", "panic", "anxiety attack", "alone", "lonely",
  "exhausted", "numb", "empty",
];

export function detectRisk(text: string): { level: RiskLevel; matches: string[] } {
  const lower = (text || "").toLowerCase();
  const high = HIGH_KEYWORDS.filter((k) => lower.includes(k));
  if (high.length > 0) return { level: "high", matches: high };
  const med = MEDIUM_KEYWORDS.filter((k) => lower.includes(k));
  if (med.length > 0) return { level: "medium", matches: med };
  return { level: "low", matches: [] };
}
