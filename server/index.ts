import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { handleDetection, handleHealth, handleVegetables } from "./routes/detection";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/v1/health", handleHealth);
  app.get("/api/v1/vegetables", handleVegetables);
  app.post("/api/v1/detect", multer({ limits: { fileSize: 10 * 1024 * 1024 }, storage: multer.memoryStorage() }).single("image"), handleDetection);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) return;
    console.error("API request failed", error);
    res.status(400).json({ success: false, message: "Unable to process this request." });
  });

  return app;
}
