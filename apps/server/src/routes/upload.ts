import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { config } from "../config.js";

export const uploadRouter = Router();

const storage = multer.memoryStorage();
const ALLOWED_EXTENSIONS = [".json", ".md", ".txt"];

// POST /api/upload
uploadRouter.post("/upload", (req, res) => {
  const upload = multer({
    storage,
    limits: {
      fileSize: config.maxUploadSize,
    },
  }).single("file");

  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const maxMb = Math.max(1, Math.round(config.maxUploadSize / (1024 * 1024)));
        res.status(400).json({ error: `File exceeds maximum allowed size of ${maxMb}MB.` });
        return;
      }
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    } else if (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: msg });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file attached in request field 'file'." });
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      res.status(400).json({
        error: `Unsupported file format '${ext}'. Allowed file formats: ${ALLOWED_EXTENSIONS.join(", ")}.`,
      });
      return;
    }

    try {
      const textContent = file.buffer.toString("utf8");
      res.json({
        filename: file.originalname,
        text: textContent,
        size: file.size,
      });
    } catch {
      res.status(400).json({ error: "Failed to read file as text." });
    }
  });
});
