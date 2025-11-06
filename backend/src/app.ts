import express from "express";
import cors from "cors";
import { router as apiRouter } from "./routes"; // dein index.ts mit GET /api
import { errorHandler, notFound } from "./middlewares/error";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", apiRouter);
  app.get("/", (_req, res) => res.redirect(302, "/api"));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
