import { TriangleAlert } from "lucide-react";
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  /** When this changes, the boundary tries again. */
  resetKey: unknown;
  children: ReactNode;
}

interface State {
  error: Error | null;
  key: unknown;
}

/** If a block crashes while drawing, show what happened instead of a blank preview. */
export class PreviewBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("The preview could not draw this page.", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex gap-3 rounded-card bg-danger-tint p-5">
        <TriangleAlert
          size={20}
          strokeWidth={1.75}
          aria-hidden
          className="mt-0.5 shrink-0 text-danger"
        />
        <div>
          <p className="font-semibold">The preview could not draw this page.</p>
          <p className="text-small">{this.state.error.message}</p>
          <p className="text-small text-ink-muted">
            Check the JSON against guide.md, or send this message to the AI.
          </p>
        </div>
      </div>
    );
  }
}
