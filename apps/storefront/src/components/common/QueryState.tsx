import React from "react";
import type { UseQueryResult } from "@tanstack/react-query";

import { ErrorState } from "@/components/common/ErrorState";

/**
 * The subset of a TanStack Query result this wrapper needs.
 *
 * Structural rather than nominal, so any real `useQuery(...)` result satisfies
 * it as-is — including a query the caller has narrowed with `select`.
 */
type QueryStateInput<T> = Pick<UseQueryResult<T>, "isPending" | "isError" | "refetch" | "data" | "fetchStatus">;

interface QueryStateProps<T> {
  query: QueryStateInput<T>;
  /** Shown only on the first load, so a background refetch never blanks the section. */
  skeleton: React.ReactNode;
  /** Rendered when `isEmpty` matches. Omit to render the section's own nothing. */
  empty?: React.ReactNode | ((data: T) => React.ReactNode);
  isEmpty?: (data: T) => boolean;
  /** Replaces the default retry-able `ErrorState`. */
  error?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

/**
 * Routes a query result to loading / error / empty / content.
 *
 * Exists so a section opts into real states with one wrapper instead of three
 * hand-written branches, and so "is pending" is decided the same way everywhere:
 * `isPending` alone would treat a disabled query, and a `keepPreviousData`
 * placeholder, as loading. `fetchStatus === "idle"` rules out the first, and
 * `isPending` (not `isLoading`) rules out the second.
 */
export function QueryState<T>({
  query,
  skeleton,
  empty,
  isEmpty,
  error,
  children,
}: QueryStateProps<T>): React.JSX.Element {
  const { isPending, isError, refetch, data, fetchStatus } = query;

  if (isPending && fetchStatus !== "idle") {
    return <>{skeleton}</>;
  }

  if (isError) {
    return <>{error ?? <ErrorState onRetry={() => void refetch()} />}</>;
  }

  if (data === undefined) {
    return <>{typeof empty === "function" ? (empty as (value: T) => React.ReactNode)(data as T) : empty ?? null}</>;
  }

  if (isEmpty?.(data)) {
    return <>{typeof empty === "function" ? (empty as (value: T) => React.ReactNode)(data) : empty ?? null}</>;
  }

  return <>{children(data)}</>;
}

export type { QueryStateProps, QueryStateInput };
