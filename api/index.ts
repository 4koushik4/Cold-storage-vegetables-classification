import type { RequestHandler } from "express";
import { createServer } from "../server";

const app = createServer();

const handler: RequestHandler = (req, res, next) => app(req, res, next);

export default handler;
