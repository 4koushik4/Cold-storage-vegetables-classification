import type { RequestHandler } from "express";
import multer from "multer";
import { handleDetection } from "../../server/routes/detection";

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 }, storage: multer.memoryStorage() }).single("image");

const handler: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (error) return next(error);
    return handleDetection(req, res, next);
  });
};

export default handler;
