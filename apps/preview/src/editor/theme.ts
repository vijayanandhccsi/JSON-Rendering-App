import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

// Colors come from the design tokens (CSS variables), so the editor follows tokens.css.
const theme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-ink)",
    fontSize: "var(--text-small)",
  },
  "&.cm-focused": { outline: "2px solid var(--color-primary)", outlineOffset: "-2px" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "var(--text-small--line-height)" },
  ".cm-content": { caretColor: "var(--color-ink)", padding: "calc(var(--spacing) * 2) 0" },
  ".cm-cursor": { borderLeftColor: "var(--color-ink)" },
  ".cm-gutters": {
    backgroundColor: "var(--color-bg)",
    color: "var(--color-ink-muted)",
    borderRight: "1px solid var(--color-border)",
  },
  ".cm-activeLine": { backgroundColor: "var(--color-bg)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--color-border)", color: "var(--color-ink)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--color-primary-tint)",
  },
  ".cm-selectionMatch": { backgroundColor: "var(--color-info-tint)" },
  ".cm-lintRange-error": {
    backgroundImage: "none",
    textDecoration: "underline wavy var(--color-danger)",
    textUnderlineOffset: "3px",
  },
  ".cm-lintRange-warning": {
    backgroundImage: "none",
    textDecoration: "underline wavy var(--color-warning)",
    textUnderlineOffset: "3px",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--color-surface)",
    color: "var(--color-ink)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-control)",
    fontFamily: "var(--font-sans)",
  },
  ".cm-diagnostic": {
    padding: "calc(var(--spacing) * 2) calc(var(--spacing) * 3)",
    whiteSpace: "pre-wrap",
  },
  ".cm-diagnostic-error": { borderLeft: "3px solid var(--color-danger)" },
  ".cm-diagnostic-warning": { borderLeft: "3px solid var(--color-warning)" },
  ".cm-diagnosticSource": { color: "var(--color-ink-muted)" },
});

const highlight = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--color-ink)" },
  { tag: tags.string, color: "var(--color-success-strong)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--color-primary-strong)" },
  {
    tag: [tags.punctuation, tags.separator, tags.squareBracket, tags.brace],
    color: "var(--color-ink-muted)",
  },
  { tag: tags.invalid, color: "var(--color-danger)" },
]);

export const editorTheme = [theme, syntaxHighlighting(highlight)];
