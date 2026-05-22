import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CAPTURE_MODEL = "claude-sonnet-4-20250514";

/**
 * Strip ```json fences or surrounding prose, return the first JSON object found.
 */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf("{");
  const end   = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return candidate.slice(start, end + 1);
}
