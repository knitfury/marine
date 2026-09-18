"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardText,
  Warning,
  Storefront,
  UsersThree,
  Wrench,
  Gear,
} from "@phosphor-icons/react";
import {
  PageHeader,
  MetricCard,
  AttentionCard,
  DealerCard,
  CustomerCard,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StaggerGrid,
  StaggerItem,
} from "@/components/shared";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { ServiceStatusSummary } from "@/components/dashboard/service-status-summary";
import {
  getDashboardInsights,
  getDashboardSummary,
  getDealers,
  getCustomers,
  getServiceRequests,
} from "@/lib/mock-api";
import { formatLongDate } from "@/lib/formatting/date";
import type { User } from "@/types";

const RECENT_PREVIEW_COUNT = 4;

export interface InternalDashboardProps {
  user: User;
}

/**
 * Internal (Marine Travelift staff) dashboard: a company-wide operational
 * rollup - what needs attention right now, a status breakdown across every
 * open service request, and recent dealer/customer previews. Every list
 * query here is intentionally unfiltered (internal staff see everything).
 */
export function InternalDashboard({ user }: InternalDashboardProps) {
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", "internal", user.id],
    queryFn: () => getDashboardSummary("internal", user),
  });

  const insightsQuery = useQuery({
    queryKey: ["dashboard-insights", "internal", user.id],
    queryFn: () => getDashboardInsights("internal", user),
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ["service-requests", "all"],
    queryFn: () => getServiceRequests(),
  });

  const dealersQuery = useQuery({
    queryKey: ["dealers", "recent"],
    queryFn: () => getDealers(),
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "recent"],
    queryFn: () => getCustomers(),
  });

  const summary = summaryQuery.data;
  const insights = insightsQuery.data ?? [];
  const serviceRequests = serviceRequestsQuery.data ?? [];
  const dealers = dealersQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description={`${formatLongDate()} — welcome back, ${user.name}. Here's what needs your attention across Marine Travelift today.`}
      />

      <section aria-labelledby="dashboard-metrics-heading" className="flex flex-col gap-4">
        <h2 id="dashboard-metrics-heading" className="text-sm font-semibold text-muted-foreground">
          Overview
        </h2>

        {summaryQuery.isError ? (
          <ErrorState
            heading="Couldn't load dashboard metrics"
            description="Something went wrong fetching the summary."
            onRetry={() => summaryQuery.refetch()}
          />
        ) : (
          <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StaggerItem>
              <MetricCard
                label="Open requests"
                value={summary?.openServiceRequests ?? 0}
                icon={ClipboardText}
                href="/service"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="High priority"
                value={summary?.highPriorityRequests ?? 0}
                icon={Warning}
                href="/service"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Active dealers"
                value={summary?.activeDealers ?? 0}
                icon={Storefront}
                href="/dealers"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Active customers"
                value={summary?.activeCustomers ?? 0}
                icon={UsersThree}
                href="/customers"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Active equipment"
                value={summary?.activeEquipment ?? 0}
                icon={Wrench}
                href="/equipment"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="In maintenance"
                value={summary?.equipmentInMaintenance ?? 0}
                icon={Gear}
                href="/equipment"
                isLoading={summaryQuery.isLoading}
              />
            </StaggerItem>
          </StaggerGrid>
        )}
      </section>

      <DashboardSection title="Needs attention">
        {insightsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={3} />
        ) : insightsQuery.isError ? (
          <ErrorState
            heading="Couldn't load insights"
            description="Something went wrong fetching insights."
            onRetry={() => insightsQuery.refetch()}
          />
        ) : insights.length === 0 ? (
          <EmptyState
            heading="Nothing needs attention right now"
            description="You're all caught up - new insights will show up here as they come in."
          />
        ) : (
          <StaggerGrid className="flex flex-col gap-3">
            {insights.map((insight) => (
              <StaggerItem key={insight.id}>
                <AttentionCard insight={insight} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </DashboardSection>

      <DashboardSection
        title="Service requests by status"
        description="Every open and closed request, company-wide."
        viewAllHref="/service"
      >
        {serviceRequestsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={1} />
        ) : serviceRequestsQuery.isError ? (
          <ErrorState
            heading="Couldn't load service requests"
            description="Something went wrong fetching service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : serviceRequests.length === 0 ? (
          <EmptyState
            heading="No service requests yet"
            description="Service requests will show up here as dealers and customers submit them."
          />
        ) : (
          <ServiceStatusSummary requests={serviceRequests} />
        )}
      </DashboardSection>

      <DashboardSection title="Dealers" viewAllHref="/dealers">
        {dealersQuery.isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : dealersQuery.isError ? (
          <ErrorState
            heading="Couldn't load dealers"
            description="Something went wrong fetching dealers."
            onRetry={() => dealersQuery.refetch()}
          />
        ) : dealers.length === 0 ? (
          <EmptyState
            heading="No dealers yet"
            description="Dealers will show up here once they're added."
          />
        ) : (
          <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.slice(0, RECENT_PREVIEW_COUNT).map((dealer) => (
              <StaggerItem key={dealer.id}>
                <DealerCard dealer={dealer} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </DashboardSection>

      <DashboardSection title="Customers" viewAllHref="/customers">
        {customersQuery.isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : customersQuery.isError ? (
          <ErrorState
            heading="Couldn't load customers"
            description="Something went wrong fetching customers."
            onRetry={() => customersQuery.refetch()}
          />
        ) : customers.length === 0 ? (
          <EmptyState
            heading="No customers yet"
            description="Customers will show up here once they're added."
          />
        ) : (
          <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customers.slice(0, RECENT_PREVIEW_COUNT).map((customer) => (
              <StaggerItem key={customer.id}>
                <CustomerCard customer={customer} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </DashboardSection>
    </div>
  );
}
