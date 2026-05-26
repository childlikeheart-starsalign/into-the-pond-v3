export function suggestIntentionTrigger(
  momentWhat: string | null,
  momentFeeling: string | null,
): string {
  if (momentWhat === "bedtime") return "when bedtime gets chaotic";
  if (momentWhat === "transition") return "when transitions get hard";
  if (momentWhat === "whining") return "when whining shows up";
  if (momentFeeling === "urgency") return "when I feel urgency";
  if (momentFeeling === "frustration") return "when frustration rises";
  if (momentWhat) return `when ${momentWhat} shows up`;
  if (momentFeeling) return `when I feel ${momentFeeling}`;
  return "";
}
