import React from "react";

import { ErrorFallback } from "@/components/common/ErrorFallback";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Replaces the default full-screen notice entirely. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches a render crash that no query state could have caught.
 *
 * The in-page states cover a *request* failing; this covers a component
 * throwing — a bad mapper, an undefined the types promised could not happen.
 * Without it React unmounts the whole tree and the customer gets a blank page,
 * which is the exact "no fallback at all" this work set out to remove.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // The only reporting channel available to the client; a real deployment
    // would forward this to the error tracker instead of the console.
    console.error("Unhandled render error:", error, info);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return <ErrorFallback />;
  }
}
