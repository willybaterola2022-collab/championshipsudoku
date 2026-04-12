import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
          <p className="font-serif text-2xl text-primary">Algo salió mal</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Recargá la página o volvé al inicio. Si el problema sigue, probá más tarde.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Recargar
          </button>
          <Link to="/" className="mt-4 text-sm text-primary hover:underline">
            Ir al inicio
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
