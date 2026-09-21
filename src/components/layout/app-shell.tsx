"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { PageTransition } from "@/components/shared/page-transition";
import { ResponsiveSidebar } from "@/components/layout/responsive-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopBar } from "@/components/layout/top-bar";
import { ChatbotLauncher } from "@/components/chatbot/chatbot-launcher";
import { useRoleStore } from "@/stores/role-store";
import { getCurrentMockUser } from "@/lib/mock-api";

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Top-level authenticated-app layout: sidebar (desktop) + mobile bottom nav
 * + top bar + content area + toast region. Resolves the current mock user
 * for the active demo role via TanStack Query so the rest of the shell
 * (UserMenu, dashboards, permission checks) has a real `User` object to
 * work with instead of just a role string.
 */
export function AppShell({ children }: AppShellProps) {
  const role = useRoleStore((state) => state.role);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh bg-background">
        <ResponsiveSidebar role={role} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar role={role} user={user} isUserLoading={isUserLoading} />

          <main className="flex-1 pb-20 lg:pb-0">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        <MobileNav role={role} />
      </div>

      <Toaster />
      <ChatbotLauncher />
    </TooltipProvider>
  );
}
