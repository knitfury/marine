"use client";

/**
 * TanStack Query provider. Wraps the app in a QueryClientProvider using a
 * client instance created once per browser session (React.useState lazy
 * initializer, the standard App Router pattern - avoids sharing a client
 * across requests on the server and avoids recreating it on every render
 * on the client).
 *
 * Defaults are tuned for a mock-API Phase 1 app: a short staleTime avoids
 * redundant refetches while still feeling "live" once real data lands.
 */

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
