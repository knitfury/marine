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
 * Stable "my profile" route. Resolves the signed-in (demo) user and, if
 * they're a customer-role user, redirects to their own customer detail
 * page. Anyone else hitting this route directly gets an explanatory empty
 * state instead of a confusing redirect.
 */
export default function CustomerSelfProfilePage() {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });

  const user = userQuery.data;
  const willRedirect = user?.role === "customer";

  React.useEffect(() => {
    if (user?.role === "customer") {
      router.replace(entityHref("customer", user.organizationId));
    }
  }, [user, router]);

  if (userQuery.isError) {
    return (
      <PageContainer>
        <PageHeader title="My Profile" />
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
        <PageHeader title="My Profile" description="Loading your profile..." />
        <LoadingSkeleton variant="detail-header" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="My Profile" />
      <EmptyState
        heading="No customer profile for your account"
        description="This page shows your own customer profile for customer accounts. Switch to the customer demo role to view it."
      />
    </PageContainer>
  );
}
