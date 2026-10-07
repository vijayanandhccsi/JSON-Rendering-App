import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { clearSessionCookie, requireAuth, setSessionCookie } from "../auth/session.js";
import { getDb } from "../db/index.js";

export const authRouter = Router();

// Login rate limiter: max 5 login attempts per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV === "test",
});

// POST /api/login
authRouter.post("/login", loginRateLimiter, (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email) as
    | { id: string; email: string; password_hash: string; role: string }
    | undefined;

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const passwordMatch = bcrypt.compareSync(password, user.password_hash);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  setSessionCookie(res, user.id);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

// POST /api/logout
authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// GET /api/me
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
