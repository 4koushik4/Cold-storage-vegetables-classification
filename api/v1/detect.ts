import type { Request, Response } from "express";

export default async function handler(request: Request, response: Response) {
  try {
    const multerModule = await import("multer");
    const multer = (multerModule.default ?? multerModule) as any;
    const { handleDetection } = await import("../../server/routes/detection");
    const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 }, storage: multer.memoryStorage() }).single("image");
    await new Promise<void>((resolve, reject) => {
      upload(request, response, (error) => (error ? reject(error) : resolve()));
    });
    await handleDetection(request, response, () => undefined);
  } catch (error) {
    console.error("Vercel detection request failed", error);
    if (!response.headersSent) response.status(400).json({ success: false, message: "Unable to process this image upload." });
  }
}
