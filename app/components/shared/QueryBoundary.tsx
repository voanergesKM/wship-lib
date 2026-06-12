"use client";

import React, { Suspense } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { PageLoader } from "./PageLoader";

interface QueryBoundaryProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: (props: FallbackProps) => React.ReactNode;
}


const DefaultErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
    <p className="font-semibold">Упс! Не вдалося завантажити дані.</p>
    <p className="text-xs opacity-80 mb-3">
      {/* @ts-ignore */}
      {error?.message || "Невідома помилка"}
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-1.5 bg-destructive text-white rounded hover:bg-destructive/90 text-sm font-medium transition-colors"
    >
      Спробувати знову
    </button>
  </div>
);

export const QueryBoundary = ({
  children,
  loadingFallback = <PageLoader size="sm" />,
  errorFallback,
}: QueryBoundaryProps) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={errorFallback || DefaultErrorFallback}
        >
          <Suspense fallback={loadingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
