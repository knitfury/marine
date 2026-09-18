"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Wrench, ClipboardText } from "@phosphor-icons/react";
import {
  PageHeader,
  MetricCard,
  ServiceRequestRow,
  EquipmentCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StaggerGrid,
  StaggerItem,
} from "@/components/shared";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import {
  getCustomerById,
  getDashboardSummary,
  getEquipment,
  getServiceRequests,
} from "@/lib/mock-api";
import { entityHref } from "@/lib/routes";
import { formatLongDate } from "@/lib/formatting/date";
import { OPEN_SERVICE_REQUEST_STATUSES } from "@/lib/constants";
import type { User } from "@/types";

const PREVIEW_COUNT = 5;

export interface CustomerDashboardProps {
  user: User;
}

/**
 * Customer dashboard: a deliberately light, simple view of the customer's
 * own equipment and service status - no operational status breakdown, no
 * company-wide data. Every query here is scoped to `user.organizationId`.
 */
export function CustomerDashboard({ user }: CustomerDashboardProps) {
  const customerId = user.organizationId;

  const customerQuery = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomerById(customerId),
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", "customer", user.id],
    queryFn: () => getDashboardSummary("customer", user),
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ["service-requests", "customer", customerId],
    queryFn: () => getServiceRequests({ customerId }),
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "customer", customerId],
    queryFn: () => getEquipment({ customerId }),
  });

  const customer = customerQuery.data;
  const summary = summaryQuery.data;
  const serviceRequests = serviceRequestsQuery.data ?? [];
  const equipment = equipmentQuery.data ?? [];

  const openRequests = serviceRequests
    .filter((request) => OPEN_SERVICE_REQUEST_STATUSES.includes(request.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description={`${formatLongDate()} — welcome back, ${user.name}. Here's what's happening with ${user.organizationName}'s equipment.`}
      />

      {customer && (
        <div className="flex items-center gap-2">
          <Link href={entityHref("customer", customer.id)} className="text-base font-semibold text-foreground hover:underline">
            {customer.organizationName ?? customer.name}
          </Link>
          <StatusBadge kind="customer" status={customer.status} />
        </div>
      )}

      <section aria-labelledby="dashboard-metrics-heading" className="flex flex-col gap-4">
        <h2 id="dashboard-metrics-heading" className="text-sm font-semibold text-muted-foreground">
          Overview
        </h2>

        {summaryQuery.isError ? (
          <ErrorState
            heading="Couldn't load your overview"
            description="Something went wrong fetching your summary."
            onRetry={() => summaryQuery.refetch()}
          />
        ) : (
          <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <StaggerItem>
              <MetricCard
                label="Your equipment"
                value={summary?.activeEquipment ?? 0}
                icon={Wrench}
                href="/equipment"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Open requests"
                value={summary?.openServiceRequests ?? 0}
                icon={ClipboardText}
                href="/service"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
          </StaggerGrid>
        )}
      </section>

      <DashboardSection title="Open service requests" viewAllHref="/service">
        {serviceRequestsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={3} />
        ) : serviceRequestsQuery.isError ? (
          <ErrorState
            heading="Couldn't load your service requests"
            description="Something went wrong fetching your service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : openRequests.length === 0 ? (
          <EmptyState
            heading="No open service requests"
            description="You're all set - nothing needs attention right now. New requests you submit will show up here."
          />
        ) : (
          <StaggerGrid className="flex flex-col gap-3">
            {openRequests.slice(0, PREVIEW_COUNT).map((request) => (
              <StaggerItem key={request.id}>
                <ServiceRequestRow request={request} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </DashboardSection>

      <DashboardSection title="Your equipment" viewAllHref="/equipment">
        {equipmentQuery.isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : equipmentQuery.isError ? (
          <ErrorState
            heading="Couldn't load your equipment"
            description="Something went wrong fetching your equipment."
            onRetry={() => equipmentQuery.refetch()}
          />
        ) : equipment.length === 0 ? (
          <EmptyState
            heading="No equipment on file"
            description="Equipment associated with your account will show up here."
          />
        ) : (
          <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.slice(0, PREVIEW_COUNT).map((item) => (
              <StaggerItem key={item.id}>
                <EquipmentCard equipment={item} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </DashboardSection>
    </div>
  );
}
