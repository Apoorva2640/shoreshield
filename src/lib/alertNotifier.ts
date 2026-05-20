import emailjs from "@emailjs/browser";

export interface AlertPayload {
  clusterPlace: string;
  hazardType: string;
  confidence: number;
  reportCount: number;
  highCount: number;
  reason: string;
}

const ALREADY_ALERTED = new Set<string>();

function shouldAlert(
  confidence: number,
  hasHighRisk: boolean
): boolean {
  // Temporary easier threshold for testing
  return hasHighRisk && confidence >= 0.65;
}

function getAlertKey(
  place: string,
  hazardType: string
): string {
  const now = new Date();

  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;

  return `${place}::${hazardType}::${hourKey}`;
}

export async function fireAlertIfNeeded(
  payload: AlertPayload
): Promise<void> {
  const {
    clusterPlace,
    hazardType,
    confidence,
    reportCount,
    highCount,
    reason,
  } = payload;

  // Require at least 2 high severity reports
  const hasHighRisk = highCount >= 2;

  console.log("🔥 ALERT FUNCTION RUNNING");

  console.log({
    clusterPlace,
    hazardType,
    confidence,
    highCount,
    hasHighRisk,
  });

  // Check threshold
  if (!shouldAlert(confidence, hasHighRisk)) {
    console.log("❌ Alert conditions not met");
    return;
  }

  console.log("✅ Alert conditions passed");

  // Prevent duplicate alerts
  const key = getAlertKey(clusterPlace, hazardType);

  if (ALREADY_ALERTED.has(key)) {
    console.log("⚠️ Duplicate alert prevented:", key);
    return;
  }

  ALREADY_ALERTED.add(key);

  const templateParams = {
    cluster_place: clusterPlace,
    hazard_type: hazardType,
    confidence: Math.round(confidence * 100),
    report_count: reportCount,
    high_count: highCount,
    reason,
    time: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
  };

  console.log("📧 Attempting EmailJS send...");

  try {
    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
    );

    console.log("✅ EmailJS response:", response);

    console.log(
      "🚨 ShoreShield alert sent successfully:",
      clusterPlace
    );
  } catch (err) {
    console.error("❌ EmailJS failed:", err);
  }
}