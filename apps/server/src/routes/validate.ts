import { validatePage } from "@certkraft/blocks";
import { Router } from "express";

export const validateRouter = Router();

// POST /api/validate
validateRouter.post("/validate", (req, res) => {
  let targetJson = req.body;

  if (targetJson && typeof targetJson === "object" && "json" in targetJson) {
    targetJson = targetJson.json;
  }

  if (typeof targetJson === "string") {
    try {
      targetJson = JSON.parse(targetJson);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({
        valid: false,
        errors: [{ path: "syntax", message: `Invalid JSON syntax: ${msg}` }],
      });
      return;
    }
  }

  if (!targetJson || typeof targetJson !== "object") {
    res.status(400).json({
      valid: false,
      errors: [{ path: "root", message: "Request body must contain valid page JSON object or string." }],
    });
    return;
  }

  const result = validatePage(targetJson);

  const formattedErrors = result.errors.map((e: { path?: string; message: string }) => ({
    path: e.path || "root",
    message: e.message,
  }));

  res.json({
    valid: result.valid,
    errors: formattedErrors,
    warnings: result.warnings,
  });
});
