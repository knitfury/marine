"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader, LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared";
import { useRoleStore } from "@/stores/role-store";
import { getCurrentMockUser } from "@/lib/mock-api";
import { entityHref } from "@/lib/routes";

/**
 * Stable "my dealer profile" route. Resolves the signed-in (demo) user and,
 * if they're a dealer-role user, redirects to their own dealer's detail
 * page. Anyone else hitting this route directly (e.g. an internal or
 * customer demo role) gets an explanatory empty state instead of a
 * confusing redirect.
 */
export default function DealerSelfProfilePage() {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });

  const user = userQuery.data;
  const willRedirect = user?.role === "dealer";

  React.useEffect(() => {
    if (user?.role === "dealer") {
      router.replace(entityHref("dealer", user.organizationId));
    }
  }, [user, router]);

  if (userQuery.isError) {
    return (
      <PageContainer>
        <PageHeader title="My Dealer Profile" />
        <ErrorState
          heading="Couldn't load your profile"
          description="Something went wrong fetching your account."
          onRetry={() => userQuery.refetch()}
        />
      </PageContainer>
    );
  }

  if (!user || willRedirect) {
    return (
      <PageContainer>
        <PageHeader title="My Dealer Profile" description="Loading your dealership..." />
        <LoadingSkeleton variant="detail-header" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="My Dealer Profile" />
      <EmptyState
        heading="No dealer profile for your account"
        description="This page shows your own dealer profile for dealer accounts. Switch to the dealer demo role to view it."
      />
    </PageContainer>
  );
}
