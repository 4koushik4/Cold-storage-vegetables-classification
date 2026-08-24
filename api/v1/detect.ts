import type { Request, Response } from "express";
import multerModule from "multer";
import { handleDetection } from "../../server/routes/detection";

const multer = (multerModule as any).default ?? multerModule;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 }, storage: multer.memoryStorage() }).single("image");

export default async function handler(request: Request, response: Response) {
  try {
    await new Promise<void>((resolve, reject) => {
      upload(request, response, (error: unknown) => (error ? reject(error) : resolve()));
    });
    await handleDetection(request, response, () => undefined);
  } catch (error) {
    console.error("Vercel detection request failed", error);
    if (!response.headersSent) response.status(400).json({ success: false, message: "Unable to process this image upload." });
  }
}
