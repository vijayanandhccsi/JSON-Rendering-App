import { json } from "@codemirror/lang-json";
import { setDiagnostics } from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";
import { Annotation } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Range } from "./jsonPositions";
import { editorTheme } from "./theme";

/** Marks changes that came from outside the editor, so they are not reported back as typing. */
const fromOutside = Annotation.define<boolean>();

export interface EditorHandle {
  /** Selects a range, scrolls it into view and moves focus to the editor. */
  select: (range: Range) => void;
  focus: () => void;
  /** The underlying CodeMirror view. For tests. */
  view: () => EditorView | null;
}

interface EditorProps {
  value: string;
  onChange: (text: string) => void;
  diagnostics: Diagnostic[];
}

/** The JSON editor: CodeMirror 6 with highlighting, line numbers and inline error markers. */
export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { value, onChange, diagnostics },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      doc: value,
      parent: host.current,
      extensions: [
        basicSetup,
        json(),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": "Page JSON", spellcheck: "false" }),
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !update.transactions.some((tr) => tr.annotation(fromOutside))) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // The editor is created once; later value changes are applied by the effect below.
  }, []);

  // Text replaced from outside (paste, upload, sample, clear, restore). It can be undone with Ctrl+Z.
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
        annotations: fromOutside.of(true),
      });
    }
  }, [value]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const length = editor.state.doc.length;
    editor.dispatch(
      setDiagnostics(
        editor.state,
        diagnostics.map((d) => ({
          ...d,
          from: Math.min(d.from, length),
          to: Math.min(d.to, length),
        })),
      ),
    );
  }, [diagnostics, value]);

  useImperativeHandle(ref, () => ({
    select(range) {
      const editor = view.current;
      if (!editor) return;
      const length = editor.state.doc.length;
      editor.dispatch({
        selection: { anchor: Math.min(range.from, length), head: Math.min(range.to, length) },
        effects: EditorView.scrollIntoView(Math.min(range.from, length), { y: "center" }),
      });
      editor.focus();
    },
    focus: () => view.current?.focus(),
    view: () => view.current,
  }));

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />;
});
