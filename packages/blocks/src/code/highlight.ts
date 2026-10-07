import { createHighlighterCore } from "shiki/core";
import type { HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ThemedToken } from "shiki/types";

const THEME = "github-light";

/** Languages that can be highlighted. Each is loaded only when a page uses it. */
const LANGUAGE_LOADERS = {
  bash: () => import("shiki/langs/bash.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  csharp: () => import("shiki/langs/csharp.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  hcl: () => import("shiki/langs/hcl.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  powershell: () => import("shiki/langs/powershell.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
} as const;

type SupportedLanguage = keyof typeof LANGUAGE_LOADERS;

const ALIASES: Record<string, SupportedLanguage> = {
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  zsh: "bash",
  ps1: "powershell",
  pwsh: "powershell",
  js: "javascript",
  ts: "typescript",
  py: "python",
  yml: "yaml",
  terraform: "hcl",
  tf: "hcl",
  cs: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  golang: "go",
  htm: "html",
  rb: "ruby",
  docker: "dockerfile",
  conf: "ini",
};

/** The highlighter language for a `language` value from a code block, or null if there is none. */
export function resolveLanguage(language: string): SupportedLanguage | null {
  const key = language.trim().toLowerCase();
  if (key in LANGUAGE_LOADERS) return key as SupportedLanguage;
  return ALIASES[key] ?? null;
}

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [import("shiki/themes/github-light.mjs")],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return highlighter;
}

export type HighlightedLines = ThemedToken[][];

/** Colored tokens for each line, or null when the language is unknown (show plain text). */
export async function highlight(code: string, language: string): Promise<HighlightedLines | null> {
  const lang = resolveLanguage(language);
  if (!lang) return null;
  const instance = await getHighlighter();
  await instance.loadLanguage(LANGUAGE_LOADERS[lang]());
  return instance.codeToTokensBase(code, { lang, theme: THEME });
}
