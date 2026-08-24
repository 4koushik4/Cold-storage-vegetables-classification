import type { RequestHandler } from "express";

export const APPROVED_COLD_STORAGE_VEGETABLES = new Set([
  "Tomato", "Carrot", "Broccoli", "Potato", "Cucumber", "Cauliflower", "Cabbage", "Pumpkin",
  "Bean", "Bitter_Gourd", "Bottle_Gourd", "Brinjal", "Capsicum", "Radish",
]);

const CONFIDENCE_THRESHOLD = 0.7;
const MODEL_ID = process.env.ROBOFLOW_MODEL_ID ?? "vegetable-classification-t6t4d/1";
const GROQ_MODEL_ID = "qwen/qwen3.6-27b";

type Prediction = { class?: string; confidence?: number };
type NormalizedResult = { success: true; detected: boolean; vegetable: string | null; confidence: number; coldStorageCrop?: true; message?: string; reason?: string };

const normalizeClassName = (value: string) => value.toLowerCase().replace(/[ _]/g, "");

function normalizePrediction(prediction?: Prediction): NormalizedResult {
  const className = prediction?.class;
  const approved = className && [...APPROVED_COLD_STORAGE_VEGETABLES].find((item) => normalizeClassName(item) === normalizeClassName(className));
  const confidence = Number(prediction?.confidence ?? 0);
  if (!approved || confidence < CONFIDENCE_THRESHOLD) {
    return { success: true, detected: false, vegetable: null, confidence: 0, message: "NOT A COLD-STORAGE VEGETABLE", reason: "INVALID_INPUT" };
  }
  return { success: true, detected: true, vegetable: approved, confidence, coldStorageCrop: true };
}

export const handleHealth: RequestHandler = (_req, res) => {
  res.json({
    status: "ok",
    model: MODEL_ID,
    cameraProvider: GROQ_MODEL_ID,
    roboflowConfigured: Boolean(process.env.ROBOFLOW_API_KEY),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
  });
};

export const handleVegetables: RequestHandler = (_req, res) => {
  res.json({ vegetables: [...APPROVED_COLD_STORAGE_VEGETABLES], confidenceThreshold: CONFIDENCE_THRESHOLD });
};

async function detectWithRoboflow(image: Express.Multer.File): Promise<NormalizedResult> {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) throw new Error("Roboflow service is not configured.");
  const body = new FormData();
  body.append("file", new Blob([image.buffer as unknown as ArrayBuffer], { type: image.mimetype }), image.originalname);
  const response = await fetch(`https://detect.roboflow.com/${MODEL_ID}?api_key=${encodeURIComponent(apiKey)}`, { method: "POST", body });
  if (!response.ok) throw new Error(`Roboflow responded with ${response.status}`);
  const payload = (await response.json()) as { predictions?: Prediction[]; top?: string; confidence?: number };
  const predictions = payload.predictions ?? (payload.top ? [{ class: payload.top, confidence: payload.confidence }] : []);
  return normalizePrediction(predictions.sort((a, b) => Number(b.confidence) - Number(a.confidence))[0]);
}

function parseGroqPrediction(content: string): Prediction {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(content.slice(start, end + 1)) as Prediction;
    } catch {
      return {};
    }
  }
  const detectedClass = [...APPROVED_COLD_STORAGE_VEGETABLES].find((item) => normalizeClassName(content).includes(normalizeClassName(item)));
  const confidence = content.match(/(?:confidence|probability)[^0-9]*(0(?:\.\d+)?|1(?:\.0+)?)/i)?.[1];
  return { class: detectedClass, confidence: confidence ? Number(confidence) : 0 };
}

async function detectWithGroq(image: Express.Multer.File): Promise<NormalizedResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq service is not configured.");
  const imageData = `data:${image.mimetype};base64,${image.buffer.toString("base64")}`;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL_ID,
      temperature: 0,
      max_tokens: 80,
      messages: [{ role: "user", content: [
        { type: "text", text: "Identify the single most prominent vegetable in this image. Return JSON only: {\"class\": string|null, \"confidence\": number}. Use the visible class name and a confidence from 0 to 1. If it is not clearly a vegetable, return null and 0." },
        { type: "image_url", image_url: { url: imageData } },
      ] }],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq responded with ${response.status}: ${detail.slice(0, 240)}`);
  }
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  return normalizePrediction(parseGroqPrediction(content));
}

export const handleDetection: RequestHandler = async (req, res) => {
  const image = req.file as Express.Multer.File | undefined;
  const source = req.body?.source;
  if (!image || (source !== "photo" && source !== "camera")) {
    res.status(400).json({ success: false, message: "An image and source are required." });
    return;
  }
  try {
    const result = source === "camera" ? await detectWithGroq(image) : await detectWithRoboflow(image);
    res.json(result);
  } catch (error) {
    console.error(`${source} detection failed`, error);
    const message = error instanceof Error && (error.message === "Roboflow service is not configured." || error.message === "Groq service is not configured.")
      ? error.message
      : "Unable to analyze this image right now.";
    res.status(502).json({ success: false, message });
  }
};
