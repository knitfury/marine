"use client";

import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader, LoadingSkeleton, ErrorState } from "@/components/shared";
import { InternalDashboard, DealerDashboard, CustomerDashboard } from "@/components/dashboard";
import { useRoleStore } from "@/stores/role-store";
import { getCurrentMockUser } from "@/lib/mock-api";

/**
 * Dashboard route entry point. Resolves the current mock user for the
 * active demo role, then hands off to a purpose-built, role-branched
 * dashboard component - each of which does its own data fetching scoped to
 * that role. This file only owns the top-level "do we have a user yet"
 * loading/error state; everything role-specific lives in
 * src/components/dashboard/*.
 */
export default function DashboardPage() {
  const role = useRoleStore((state) => state.role);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });

  const { data: user } = userQuery;

  if (userQuery.isError) {
    return (
      <PageContainer className="flex flex-col gap-8">
        <PageHeader title="Dashboard" description="Something went wrong loading your account." />
        <ErrorState
          heading="Couldn't load your dashboard"
          description="Something went wrong fetching your account."
          onRetry={() => userQuery.refetch()}
        />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className="flex flex-col gap-8">
        <PageHeader title="Dashboard" description="Loading your dashboard..." />
        <LoadingSkeleton variant="cards" count={6} />
        <LoadingSkeleton variant="list" count={3} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {user.role === "internal" && <InternalDashboard user={user} />}
      {user.role === "dealer" && <DealerDashboard user={user} />}
      {user.role === "customer" && <CustomerDashboard user={user} />}
    </PageContainer>
  );
}
