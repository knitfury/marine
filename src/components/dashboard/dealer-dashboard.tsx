"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardText, CurrencyDollar, Warning, Wrench, Gear } from "@phosphor-icons/react";
import {
  PageHeader,
  MetricCard,
  ServiceRequestRow,
  EquipmentCard,
  StatusBadge,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  KeyValueList,
  StaggerGrid,
  StaggerItem,
} from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { ServiceStatusChart } from "@/components/dashboard/charts";
import {
  getDashboardSummary,
  getDealerById,
  getEquipment,
  getServiceRequests,
} from "@/lib/mock-api";
import { entityHref } from "@/lib/routes";
import { formatLongDate } from "@/lib/formatting/date";
import { formatCurrency } from "@/lib/formatting";
import type { User } from "@/types";

const RECENT_PREVIEW_COUNT = 5;

export interface DealerDashboardProps {
  user: User;
}

/**
 * Dealer dashboard: a focused view of the dealer's own organization only -
 * their equipment, their service requests, nothing company-wide. Every
 * query here is scoped to `user.organizationId`.
 */
export function DealerDashboard({ user }: DealerDashboardProps) {
  const dealerId = user.organizationId;

  const dealerQuery = useQuery({
    queryKey: ["dealer", dealerId],
    queryFn: () => getDealerById(dealerId),
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", "dealer", user.id],
    queryFn: () => getDashboardSummary("dealer", user),
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ["service-requests", "dealer", dealerId],
    queryFn: () => getServiceRequests({ dealerId }),
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "dealer", dealerId],
    queryFn: () => getEquipment({ dealerId }),
  });

  const dealer = dealerQuery.data;
  const summary = summaryQuery.data;
  const serviceRequests = serviceRequestsQuery.data ?? [];
  const equipment = equipmentQuery.data ?? [];

  const recentServiceRequests = [...serviceRequests].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description={`${formatLongDate()} — welcome back, ${user.name}. Here's how ${user.organizationName} is doing.`}
      />

      <section aria-labelledby="dashboard-profile-heading" className="flex flex-col gap-4">
        <h2 id="dashboard-profile-heading" className="text-sm font-semibold text-muted-foreground">
          Your dealership
        </h2>

        {dealerQuery.isLoading ? (
          <LoadingSkeleton variant="detail-header" />
        ) : dealerQuery.isError ? (
          <ErrorState
            heading="Couldn't load your dealer profile"
            description="Something went wrong fetching your dealership's details."
            onRetry={() => dealerQuery.refetch()}
          />
        ) : !dealer ? (
          <EmptyState
            heading="Dealer profile not found"
            description="We couldn't find a dealer record for your account."
          />
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <Link href={entityHref("dealer", dealer.id)} className="text-base font-semibold text-foreground hover:underline">
                {dealer.name}
              </Link>
              <StatusBadge kind="dealer" status={dealer.status} />
            </div>
            <KeyValueList
              items={[
                { label: "Region", value: dealer.region },
                { label: "Primary contact", value: dealer.primaryContactName },
                { label: "Customers", value: dealer.customerCount },
                { label: "Equipment", value: dealer.equipmentCount },
              ]}
            />
          </div>
        )}
      </section>

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
          <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StaggerItem>
              <MetricCard
                label="Revenue"
                value={formatCurrency(summary?.totalRevenue ?? 0)}
                icon={CurrencyDollar}
                href="/service"
                isLoading={summaryQuery.isLoading}
                className="ring-1 ring-success/30 bg-success/5"
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

      <DashboardSection
        title="Service requests by status"
        description="Your open and closed requests."
        viewAllHref="/service"
      >
        {serviceRequestsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={1} />
        ) : serviceRequestsQuery.isError ? (
          <ErrorState
            heading="Couldn't load service requests"
            description="Something went wrong fetching your service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : serviceRequests.length === 0 ? (
          <EmptyState
            heading="No service requests yet"
            description="Your service requests will show up here once submitted."
          />
        ) : (
          <Card>
            <CardContent className="pt-5">
              <ServiceStatusChart requests={serviceRequests} />
            </CardContent>
          </Card>
        )}
      </DashboardSection>

      <DashboardSection title="Recent service updates" viewAllHref="/service">
        {serviceRequestsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={3} />
        ) : serviceRequestsQuery.isError ? (
          <ErrorState
            heading="Couldn't load service requests"
            description="Something went wrong fetching your service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : recentServiceRequests.length === 0 ? (
          <EmptyState
            heading="No service requests yet"
            description="Your service requests will show up here once submitted."
          />
        ) : (
          <StaggerGrid className="flex flex-col gap-3">
            {recentServiceRequests.slice(0, RECENT_PREVIEW_COUNT).map((request) => (
              <StaggerItem key={request.id}>
                <ServiceRequestRow request={request} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </DashboardSection>

      <DashboardSection title="Equipment" viewAllHref="/equipment">
        {equipmentQuery.isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : equipmentQuery.isError ? (
          <ErrorState
            heading="Couldn't load equipment"
            description="Something went wrong fetching your equipment."
            onRetry={() => equipmentQuery.refetch()}
          />
        ) : equipment.length === 0 ? (
          <EmptyState
            heading="No equipment yet"
            description="Equipment associated with your dealership will show up here."
          />
        ) : (
          <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.slice(0, RECENT_PREVIEW_COUNT).map((item) => (
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
