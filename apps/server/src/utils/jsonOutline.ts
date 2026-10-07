export interface OutlineSection {
  title: string;
  plannedBlocks?: string[];
}

export interface OutlinePayload {
  type: "outline";
  chapter: string;
  title: string;
  summary: string;
  estimatedMinutes?: number;
  sections: OutlineSection[];
}

export function isOutlinePayload(json: unknown): json is OutlinePayload {
  if (!json || typeof json !== "object") return false;
  const obj = json as Record<string, unknown>;
  return (
    obj.type === "outline" &&
    typeof obj.chapter === "string" &&
    typeof obj.title === "string" &&
    Array.isArray(obj.sections) &&
    obj.sections.length > 0
  );
}
