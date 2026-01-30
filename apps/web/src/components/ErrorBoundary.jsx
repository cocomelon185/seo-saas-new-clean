import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      const msg =
        this.state.error?.message ||
        String(this.state.error || "Unknown error");
      const stack = this.state.error?.stack || "";
      const comp = this.state.info?.componentStack || "";
      return (
        <div className="mx-auto max-w-4xl p-6">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
            <div className="text-sm font-semibold">UI crashed while rendering this page</div>
            <div className="mt-2 text-sm opacity-90">{msg}</div>
          </div>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
{stack || comp || "No stack available."}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
