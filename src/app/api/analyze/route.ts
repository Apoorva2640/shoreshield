import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function ruleBasedFallback(text: string) {
  const lower = text.toLowerCase();
  const hazard =
    lower.includes("tsunami") ? "tsunami" :
    lower.includes("flood") ? "flood" :
    lower.includes("wave") || lower.includes("rough") || lower.includes("swell") ? "rough_seas" :
    lower.includes("oil") || lower.includes("pollution") || lower.includes("sewage") || lower.includes("plastic") ? "pollution" :
    "other";

  const severity: "low" | "medium" | "high" =
    lower.includes("danger") || lower.includes("emergency") || lower.includes("tsunami") || lower.includes("evacuat") ? "high" :
    lower.includes("warning") || lower.includes("rough") || lower.includes("flood") || lower.includes("wave") ? "medium" :
    "low";

  return {
    hazard,
    severity,
    confidence: 0.45,
    location: "unknown",
    isSocialSignal: lower.includes("people saying") || lower.includes("posts") || lower.includes("tweet") || lower.includes("social"),
    reason: "Rule-based classification — AI unavailable. Manual review recommended.",
  };
}

export async function POST(req: Request) {
  let text = "";

  try {
    const body = await req.json();
    text = body.text || "";

    if (!text) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a coastal hazard analyst for INCOIS (Indian National Centre for Ocean Information Services).

Analyze the report below and return ONLY a JSON object — no explanation, no markdown, no extra text.

Classify hazard_type as exactly one of: "flood" | "tsunami" | "pollution" | "rough_seas" | "other"

Classify severity as exactly one of:
  "low"    — inconvenient, no immediate danger
  "medium" — significant risk to people or vessels
  "high"   — immediate threat to life or infrastructure

Set confidence (0.0 to 1.0):
  0.8–1.0 = clear hazard language, specific location, credible firsthand detail
  0.5–0.79 = vague, secondhand, or missing location
  0.0–0.49 = ambiguous, no clear hazard, likely noise

Set isSocialSignal = true if the text describes what others are saying, social media posts, rumors, or indirect observations.

Extract location: most specific place name mentioned. If none, return "unknown".

Return exactly this shape:
{
  "hazard": "...",
  "severity": "...",
  "confidence": 0.0,
  "location": "...",
  "isSocialSignal": false,
  "reason": "one sentence explaining why you classified it this way"
}

Report: "${text.slice(0, 500)}"`,
        },
      ],
    });

    const raw = response.content[0];
    if (raw.type !== "text") {
      return Response.json(ruleBasedFallback(text));
    }

    const cleaned = raw.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return Response.json({
      hazard: parsed.hazard ?? "other",
      severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "low",
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      location: parsed.location ?? "unknown",
      isSocialSignal: Boolean(parsed.isSocialSignal),
      reason: parsed.reason ?? "No reason provided.",
    });

  } catch (err) {
    console.error("analyze route error:", err);
    // Fallback so the app never fully breaks
    return Response.json(ruleBasedFallback(text));
  }
}