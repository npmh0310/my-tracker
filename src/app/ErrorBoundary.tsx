import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid h-screen place-items-center bg-zinc-100 p-6 text-zinc-950">
          <div className="max-w-xl rounded-3xl border border-rose-200 bg-white p-6 shadow-panel">
            <h1 className="text-xl font-extrabold">App render error</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              React gặp lỗi khi render. Reload app hoặc gửi lỗi này để debug tiếp.
            </p>
            <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-rose-50 p-4 text-xs text-rose-700">
              {this.state.error.message}
            </pre>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
