import type { RequestHandler } from "express";

export const APPROVED_COLD_STORAGE_VEGETABLES = new Set([
  "Tomato", "Carrot", "Broccoli", "Potato", "Onion", "Cucumber", "Cabbage", "Mushroom",
  "Eggplant", "Lettuce", "Garlic", "Pepper", "Pumpkin", "Asparagus", "Beetroot", "Chilli",
  "Green Beans", "Green Pepper", "Red Cabbage", "Red Onion", "Red Pepper", "Yellow Pepper",
]);

const CONFIDENCE_THRESHOLD = 0.7;
const MODEL_ID = process.env.ROBOFLOW_MODEL_ID ?? "vegetable-classification-t6t4d/1";

type RoboflowPrediction = { class?: string; confidence?: number };

export const handleHealth: RequestHandler = (_req, res) => {
  res.json({ status: "ok", model: MODEL_ID });
};

export const handleVegetables: RequestHandler = (_req, res) => {
  res.json({ vegetables: [...APPROVED_COLD_STORAGE_VEGETABLES], confidenceThreshold: CONFIDENCE_THRESHOLD });
};

export const handleDetection: RequestHandler = async (req, res) => {
  const image = req.file as Express.Multer.File | undefined;
  if (!image) {
    res.status(400).json({ success: false, message: "An image is required." });
    return;
  }

  if (!process.env.ROBOFLOW_API_KEY) {
    res.status(503).json({ success: false, message: "Detection service is not configured." });
    return;
  }

  try {
    const body = new FormData();
    body.append("file", new Blob([image.buffer as unknown as ArrayBuffer], { type: image.mimetype }), image.originalname);
    const upstream = await fetch(`https://detect.roboflow.com/${MODEL_ID}?api_key=${encodeURIComponent(process.env.ROBOFLOW_API_KEY)}`, {
      method: "POST",
      body,
    });
    if (!upstream.ok) throw new Error(`Roboflow responded with ${upstream.status}`);
    const payload = (await upstream.json()) as { predictions?: RoboflowPrediction[] };
    const valid = (payload.predictions ?? [])
      .filter((prediction) => typeof prediction.class === "string" && APPROVED_COLD_STORAGE_VEGETABLES.has(prediction.class) && Number(prediction.confidence) >= CONFIDENCE_THRESHOLD)
      .sort((a, b) => Number(b.confidence) - Number(a.confidence))[0];

    if (!valid?.class) {
      res.json({ success: true, detected: false, vegetable: null, confidence: 0, message: "No supported vegetable detected.", reason: "INVALID_INPUT" });
      return;
    }
    res.json({ success: true, detected: true, vegetable: valid.class, confidence: Number(valid.confidence), coldStorageCrop: true });
  } catch (error) {
    console.error("Roboflow detection failed", error);
    res.status(502).json({ success: false, message: "Unable to analyze this image right now." });
  }
};
