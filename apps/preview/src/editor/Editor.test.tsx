import { forEachDiagnostic } from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Editor } from "./Editor";
import type { EditorHandle } from "./Editor";

const text = '{\n  "a": 1,\n  "b": 2\n}';

function setup(
  props: { value?: string; diagnostics?: Diagnostic[]; onChange?: (text: string) => void } = {},
) {
  const ref = createRef<EditorHandle>();
  const onChange = props.onChange ?? vi.fn();
  const ui = (value: string, diagnostics: Diagnostic[]) => (
    <Editor ref={ref} value={value} onChange={onChange} diagnostics={diagnostics} />
  );
  const view = render(ui(props.value ?? text, props.diagnostics ?? []));
  return {
    ref,
    onChange,
    rerender: (value: string, diagnostics: Diagnostic[] = []) =>
      view.rerender(ui(value, diagnostics)),
  };
}

const found = (ref: React.RefObject<EditorHandle | null>) => {
  const list: { from: number; to: number; severity: string; message: string }[] = [];
  forEachDiagnostic(ref.current!.view()!.state, (d, from, to) =>
    list.push({ from, to, severity: d.severity, message: d.message }),
  );
  return list;
};

describe("Editor", () => {
  it("shows the text in a labelled editor with line numbers", () => {
    setup();
    expect(screen.getByRole("textbox", { name: "Page JSON" })).toBeInTheDocument();
    expect(document.querySelector(".cm-lineNumbers")).not.toBeNull();
    expect(document.querySelectorAll(".cm-line")).toHaveLength(4);
  });

  it("reports edits made in the editor", () => {
    const { ref, onChange } = setup();
    act(() => ref.current!.view()!.dispatch({ changes: { from: 0, insert: " " } }));
    expect(onChange).toHaveBeenCalledWith(` ${text}`);
  });

  it("replaces its text when the value changes from outside, without reporting it as an edit", () => {
    const { ref, onChange, rerender } = setup();
    rerender('{"new": true}');
    expect(ref.current!.view()!.state.doc.toString()).toBe('{"new": true}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks problems with their severity and message, and clears them", () => {
    const diagnostics: Diagnostic[] = [
      { from: 4, to: 7, severity: "error", message: "Wrong. Fix: change it." },
      { from: 12, to: 13, severity: "warning", message: "Careful." },
    ];
    const { ref, rerender } = setup({ diagnostics });
    expect(found(ref)).toEqual([
      { from: 4, to: 7, severity: "error", message: "Wrong. Fix: change it." },
      { from: 12, to: 13, severity: "warning", message: "Careful." },
    ]);
    rerender(text, []);
    expect(found(ref)).toEqual([]);
  });

  it("keeps markers inside the text when the text is shorter than the marker expects", () => {
    const { ref } = setup({
      value: "{}",
      diagnostics: [{ from: 50, to: 60, severity: "error", message: "Too far" }],
    });
    for (const d of found(ref)) expect(d.to).toBeLessThanOrEqual(2);
  });

  it("selects a range, scrolls to it and takes focus", () => {
    const { ref } = setup();
    act(() => ref.current!.select({ from: 4, to: 7 }));
    const selection = ref.current!.view()!.state.selection.main;
    expect([selection.from, selection.to]).toEqual([4, 7]);
    expect(document.activeElement).toHaveClass("cm-content");
  });

  it("does not select past the end of the text", () => {
    const { ref } = setup({ value: "{}" });
    act(() => ref.current!.select({ from: 10, to: 20 }));
    expect(ref.current!.view()!.state.selection.main.to).toBe(2);
  });

  it("takes its colors and font from the design tokens", () => {
    setup();
    const css = [...document.querySelectorAll("style")].map((el) => el.textContent).join("\n");
    expect(css).toContain("var(--font-mono)");
    expect(css).toContain("underline wavy var(--color-danger)");
    expect(css).toContain("underline wavy var(--color-warning)");
    expect(css).toContain("2px solid var(--color-primary)");
    expect(css).toContain("var(--color-success-strong)");
  });
});
