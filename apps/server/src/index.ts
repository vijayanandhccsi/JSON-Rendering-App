import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { requireAuth } from "./auth/session.js";
import { config } from "./config.js";
import { getDb } from "./db/index.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { pagesRouter } from "./routes/pages.js";
import { uploadRouter } from "./routes/upload.js";
import { validateRouter } from "./routes/validate.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Initialize SQLite database on start
getDb();

// Public API endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth endpoints (login is public within authRouter)
app.use("/api", authRouter);

// Global middleware protecting all subsequent /api routes
app.use("/api/*", requireAuth);

// Protected routes (pages, chats, messages, models, upload, validate)
app.use("/api", pagesRouter);
app.use("/api", chatRouter);
app.use("/api", uploadRouter);
app.use("/api", validateRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
}

export default app;
