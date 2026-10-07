import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../../.env");
const serverEnvPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath });

export const config = {
  get port(): number {
    return parseInt(process.env.PORT || "3001", 10);
  },
  get dbPath(): string {
    return process.env.DATABASE_PATH || "./data/certkraft.db";
  },
  get sessionSecret(): string {
    return process.env.SESSION_SECRET || "dev-session-secret-change-in-production";
  },
  get anthropicApiKey(): string {
    return process.env.ANTHROPIC_API_KEY || "";
  },
  get geminiApiKey(): string {
    return process.env.GEMINI_API_KEY || "";
  },
  get maxUploadSize(): number {
    const mbVal = process.env.MAX_UPLOAD_MB;
    if (mbVal) {
      const parsed = parseInt(mbVal, 10);
      if (!isNaN(parsed)) return parsed * 1024 * 1024;
    }
    const bytesVal = process.env.MAX_UPLOAD_SIZE_BYTES;
    if (bytesVal) {
      const parsed = parseInt(bytesVal, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 1 * 1024 * 1024; // 1 MB default
  },
};
