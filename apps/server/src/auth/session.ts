import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { getDb } from "../db/index.js";

export interface User {
  id: string;
  email: string;
  role: string;
  created_at?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const COOKIE_NAME = "certkraft_session";

function signToken(userId: string): string {
  const payload = JSON.stringify({ userId, iat: Date.now() });
  const base64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", config.sessionSecret)
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

function verifyToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const base64Payload = parts[0];
    const signature = parts[1];

    if (!base64Payload || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", config.sessionSecret)
      .update(base64Payload)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payloadStr = Buffer.from(base64Payload, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    return payload.userId || null;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, userId: string): void {
  const token = signToken(userId);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function getUserIdFromReq(req: Request): string | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || typeof token !== "string") return null;
  return verifyToken(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDb();
  const user = db.prepare("SELECT id, email, role, created_at FROM users WHERE id = ?").get(userId) as User | undefined;

  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ error: "User not found or session invalid" });
    return;
  }

  req.user = user;
  next();
}
