import type { IncomingMessage, ServerResponse } from "node:http";

const APPROVED = [
  "Tomato", "Carrot", "Broccoli", "Potato", "Cucumber", "Cauliflower", "Cabbage", "Pumpkin",
  "Bean", "Bitter_Gourd", "Bottle_Gourd", "Brinjal", "Capsicum", "Radish",
];
const THRESHOLD = 0.7;
const ROBOFLOW_MODEL = process.env.ROBOFLOW_MODEL_ID ?? "vegetable-classification-t6t4d/1";
const GROQ_MODEL = "qwen/qwen3.6-27b";

type Prediction = { class?: string | null; confidence?: number };

const normalize = (value: string) => value.toLowerCase().replace(/[ _]/g, "");
const approvedClass = (value?: string | null) => value && APPROVED.find((item) => normalize(item) === normalize(value));

function result(prediction: Prediction) {
  const vegetable = approvedClass(prediction.class);
  const confidence = Number(prediction.confidence ?? 0);
  if (!vegetable || confidence < THRESHOLD) {
    return { success: true, detected: false, vegetable: null, confidence: 0, message: "NOT A COLD-STORAGE VEGETABLE", reason: "INVALID_INPUT" };
  }
  return { success: true, detected: true, vegetable, confidence, coldStorageCrop: true };
}

function readBody(request: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function parseMultipart(request: IncomingMessage) {
  const contentType = request.headers["content-type"] ?? "";
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[1] ?? contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[2];
  if (!boundary) throw new Error("Multipart boundary is missing.");
  const raw = (await readBody(request)).toString("latin1");
  const fields: Record<string, string> = {};
  let image: { bytes: Buffer; type: string; name: string } | undefined;
  for (const part of raw.split(`--${boundary}`)) {
    const separator = part.indexOf("\r\n\r\n");
    if (separator < 0) continue;
    const headers = part.slice(0, separator);
    let value = part.slice(separator + 4);
    if (value.endsWith("\r\n")) value = value.slice(0, -2);
    const name = headers.match(/name="([^"]+)"/i)?.[1];
    if (!name) continue;
    const filename = headers.match(/filename="([^"]*)"/i)?.[1];
    if (filename) {
      image = { bytes: Buffer.from(value, "latin1"), type: headers.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] ?? "application/octet-stream", name: filename };
    } else {
      fields[name] = Buffer.from(value, "latin1").toString("utf8");
    }
  }
  if (!image || (fields.source !== "photo" && fields.source !== "camera")) throw new Error("An image and source are required.");
  return { image, source: fields.source };
}

async function roboflow(image: { bytes: Buffer; type: string; name: string }) {
  if (!process.env.ROBOFLOW_API_KEY) throw new Error("Roboflow service is not configured.");
  const body = new FormData();
  body.append("file", new Blob([image.bytes as unknown as ArrayBuffer], { type: image.type }), image.name);
  const response = await fetch(`https://detect.roboflow.com/${ROBOFLOW_MODEL}?api_key=${encodeURIComponent(process.env.ROBOFLOW_API_KEY)}`, { method: "POST", body });
  if (!response.ok) throw new Error(`Roboflow responded with ${response.status}`);
  const payload = (await response.json()) as { predictions?: Prediction[]; top?: string; confidence?: number };
  const predictions = payload.predictions ?? (payload.top ? [{ class: payload.top, confidence: payload.confidence }] : []);
  return result(predictions.sort((a, b) => Number(b.confidence) - Number(a.confidence))[0] ?? {});
}

function parseGroq(content: string): Prediction {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(content.slice(start, end + 1)) as Prediction; } catch { return {}; }
  }
  const className = APPROVED.find((item) => normalize(content).includes(normalize(item)));
  const confidence = content.match(/(?:confidence|probability)[^0-9]*(0(?:\.\d+)?|1(?:\.0+)?)/i)?.[1];
  return { class: className, confidence: confidence ? Number(confidence) : 0 };
}

async function groq(image: { bytes: Buffer; type: string }) {
  if (!process.env.GROQ_API_KEY) throw new Error("Groq service is not configured.");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, temperature: 0, max_tokens: 80, messages: [{ role: "user", content: [
      { type: "text", text: "Identify the single most prominent vegetable. Return only JSON in this exact shape: {\"class\": \"Tomato\", \"confidence\": 0.96}. Use null and 0 if no clear vegetable is present." },
      { type: "image_url", image_url: { url: `data:${image.type};base64,${image.bytes.toString("base64")}` } },
    ] }] }),
  });
  if (!response.ok) throw new Error(`Groq responded with ${response.status}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return result(parseGroq(payload.choices?.[0]?.message?.content ?? ""));
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    const { image, source } = await parseMultipart(request);
    const payload = source === "camera" ? await groq(image) : await roboflow(image);
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(payload));
  } catch (error) {
    console.error("Vercel detection request failed", error);
    response.statusCode = 502;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ success: false, message: error instanceof Error ? error.message : "Unable to analyze this image right now." }));
  }
}
