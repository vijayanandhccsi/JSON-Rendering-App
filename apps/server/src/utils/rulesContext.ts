import fs from "node:fs";
import path from "node:path";

export function loadRulesSystemPrompt(): string {
  const rootDir = process.cwd();
  // Support running from root or from apps/server
  const rulesPath = fs.existsSync(path.resolve(rootDir, "docs/rules.md"))
    ? path.resolve(rootDir, "docs/rules.md")
    : path.resolve(rootDir, "../../docs/rules.md");

  const guidePath = fs.existsSync(path.resolve(rootDir, "docs/guide.md"))
    ? path.resolve(rootDir, "docs/guide.md")
    : path.resolve(rootDir, "../../docs/guide.md");

  if (!fs.existsSync(rulesPath)) {
    throw new Error(`System prompt error: rules.md not found at ${rulesPath}`);
  }

  if (!fs.existsSync(guidePath)) {
    throw new Error(`System prompt error: guide.md not found at ${guidePath}`);
  }

  const rulesText = fs.readFileSync(rulesPath, "utf8");
  const guideText = fs.readFileSync(guidePath, "utf8");

  return `${rulesText.trim()}\n\n---\n\n${guideText.trim()}`;
}
