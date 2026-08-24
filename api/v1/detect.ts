import type { Request, Response } from "express";
import multer from "multer";
import { handleDetection } from "../../server/routes/detection";

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 }, storage: multer.memoryStorage() }).single("image");

function parseUpload(request: Request, response: Response) {
  return new Promise<void>((resolve, reject) => {
    upload(request, response, (error) => (error ? reject(error) : resolve()));
  });
}

export default async function handler(request: Request, response: Response) {
  try {
    await parseUpload(request, response);
    await handleDetection(request, response, () => undefined);
  } catch (error) {
    console.error("Vercel detection request failed", error);
    if (!response.headersSent) response.status(400).json({ success: false, message: "Unable to process this image upload." });
  }
}
