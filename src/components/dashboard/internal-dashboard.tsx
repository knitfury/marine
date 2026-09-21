"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardText,
  CurrencyDollar,
  Warning,
  Storefront,
  UsersThree,
  Wrench,
  Gear,
  Timer,
  Target,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import {
  ServiceStatusChart,
  ServicePriorityChart,
  ServiceTrendChart,
  RevenueTrendChart,
  EquipmentStatusChart,
} from "@/components/dashboard/charts";
import { TrendMetricCard } from "@/components/dashboard/trend-metric-card";
import { SegmentedBar, TONE_BG_CLASS } from "@/components/dashboard/segmented-bar";
import { CategoryBarList } from "@/components/dashboard/category-bar-list";
import {
  computeOpenRequestsTrend,
  computeResolutionTimeTrend,
  computeSlaComplianceTrend,
  computeRepeatServiceRate,
  aggregateOpenRequestsByPriority,
  aggregateEquipmentCategoryBreakdown,
} from "@/lib/analytics/service-metrics";
import {
  getDashboardInsights,
  getDashboardSummary,
  getDealers,
  getCustomers,
  getEquipment,
  getServiceRequests,
} from "@/lib/mock-api";
import { formatLongDate } from "@/lib/formatting/date";
import { formatCurrency } from "@/lib/formatting";
import { cn } from "@/lib/utils";
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
 *
 * Section order is deliberate: the charts/analytics-heavy content (Service
 * performance, Needs attention, Request volume/Revenue/Status breakdown,
 * Open work by priority, Repeat service, Equipment category breakdown) leads
 * the page, with the plain-number Overview strip placed further down as a
 * secondary at-a-glance summary rather than the page's first impression.
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

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "all"],
    queryFn: () => getEquipment(),
  });

  const summary = summaryQuery.data;
  const insights = insightsQuery.data ?? [];
  // Memoized (rather than a plain `?? []`) so the analytics useMemos below
  // - which take this as a dependency - don't recompute on every render
  // while the query is loading (each `?? []` would otherwise be a fresh
  // array reference every render).
  const serviceRequests = useMemo(() => serviceRequestsQuery.data ?? [], [serviceRequestsQuery.data]);
  const dealers = dealersQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const equipment = useMemo(() => equipmentQuery.data ?? [], [equipmentQuery.data]);

  const openTrend = useMemo(() => computeOpenRequestsTrend(serviceRequests), [serviceRequests]);
  const resolutionTrend = useMemo(
    () => computeResolutionTimeTrend(serviceRequests),
    [serviceRequests]
  );
  const slaTrend = useMemo(() => computeSlaComplianceTrend(serviceRequests), [serviceRequests]);
  const priorityBreakdown = useMemo(
    () => aggregateOpenRequestsByPriority(serviceRequests),
    [serviceRequests]
  );
  const repeatService = useMemo(() => computeRepeatServiceRate(serviceRequests), [serviceRequests]);
  const categoryBreakdown = useMemo(
    () => aggregateEquipmentCategoryBreakdown(serviceRequests, equipment),
    [serviceRequests, equipment]
  );

  // Open requests: more opened this month is attention-worthy (not
  // necessarily bad), fewer is a clear win.
  const openDeltaLabel =
    openTrend.deltaPct === null
      ? "Not enough data yet"
      : `${openTrend.deltaPct >= 0 ? "+" : ""}${Math.round(openTrend.deltaPct)}% vs last month`;
  const openDeltaTone =
    openTrend.deltaPct === null || openTrend.deltaPct === 0
      ? "neutral"
      : openTrend.deltaPct > 0
        ? "warning"
        : "success";
  const openDeltaDirection =
    openTrend.deltaPct === null || openTrend.deltaPct === 0
      ? undefined
      : openTrend.deltaPct > 0
        ? "up"
        : "down";

  // Avg time to resolution: lower is faster (good), higher is slower (bad).
  const resolutionValue =
    resolutionTrend.avgDaysThisPeriod === null
      ? "—"
      : `${resolutionTrend.avgDaysThisPeriod.toFixed(1)} days avg`;
  const resolutionDeltaLabel =
    resolutionTrend.deltaPct === null
      ? "Not enough data yet"
      : `${Math.abs(Math.round(resolutionTrend.deltaPct))}% ${
          resolutionTrend.deltaPct < 0 ? "faster" : "slower"
        } than last month`;
  const resolutionDeltaTone =
    resolutionTrend.deltaPct === null || resolutionTrend.deltaPct === 0
      ? "neutral"
      : resolutionTrend.deltaPct < 0
        ? "success"
        : "danger";
  const resolutionDeltaDirection =
    resolutionTrend.deltaPct === null || resolutionTrend.deltaPct === 0
      ? undefined
      : resolutionTrend.deltaPct > 0
        ? "up"
        : "down";

  // SLA compliance: higher percentage met is good, lower is bad.
  const slaValue = slaTrend.pctThisPeriod === null ? "—" : `${Math.round(slaTrend.pctThisPeriod)}%`;
  const slaDeltaLabel =
    slaTrend.deltaPoints === null
      ? "Not enough data yet"
      : `${slaTrend.deltaPoints >= 0 ? "+" : "-"}${Math.abs(Math.round(slaTrend.deltaPoints))} pts vs last month`;
  const slaDeltaTone =
    slaTrend.deltaPoints === null || slaTrend.deltaPoints === 0
      ? "neutral"
      : slaTrend.deltaPoints > 0
        ? "success"
        : "danger";
  const slaDeltaDirection =
    slaTrend.deltaPoints === null || slaTrend.deltaPoints === 0
      ? undefined
      : slaTrend.deltaPoints > 0
        ? "up"
        : "down";
  const slaCaption = `${slaTrend.metCount} of ${slaTrend.totalCount} closures · urgent 24h · high 48h · medium 5d · low 10d`;

  const categoryBarListEntries = categoryBreakdown.map((entry) => ({
    key: entry.category,
    label: entry.category,
    primaryValue: entry.requestCount,
    primaryUnitLabel: entry.requestCount === 1 ? "request" : "requests",
    secondaryLabel: `${entry.unitCount} unit${entry.unitCount === 1 ? "" : "s"} fielded`,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description={`${formatLongDate()} — welcome back, ${user.name}. Here's what needs your attention across Marine Travelift today.`}
      />

      <DashboardSection
        title="Service performance"
        description="Measured this month, against the same point last month."
      >
        {serviceRequestsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={1} />
        ) : serviceRequestsQuery.isError ? (
          <ErrorState
            heading="Couldn't load service performance"
            description="Something went wrong fetching service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : (
          <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StaggerItem>
              <TrendMetricCard
                label="Open requests"
                value={String(openTrend.openNow)}
                icon={ClipboardText}
                deltaLabel={openDeltaLabel}
                deltaTone={openDeltaTone}
                deltaDirection={openDeltaDirection}
                sparklineValues={openTrend.weeklySparkline}
              />
            </StaggerItem>
            <StaggerItem>
              <TrendMetricCard
                label="Avg time to resolution"
                value={resolutionValue}
                icon={Timer}
                deltaLabel={resolutionDeltaLabel}
                deltaTone={resolutionDeltaTone}
                deltaDirection={resolutionDeltaDirection}
                sparklineValues={resolutionTrend.weeklySparkline}
              />
            </StaggerItem>
            <StaggerItem>
              <TrendMetricCard
                label="SLA compliance"
                value={slaValue}
                icon={Target}
                deltaLabel={slaDeltaLabel}
                deltaTone={slaDeltaTone}
                deltaDirection={slaDeltaDirection}
                caption={slaCaption}
                sparklineValues={slaTrend.weeklySparkline}
              />
            </StaggerItem>
          </StaggerGrid>
        )}
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
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

        <div className="flex flex-col gap-6">
          <DashboardSection
            title="Request volume"
            description="Weekly service request volume, company-wide."
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
              <Card>
                <CardContent className="pt-5">
                  <ServiceTrendChart requests={serviceRequests} />
                </CardContent>
              </Card>
            )}
          </DashboardSection>

          <DashboardSection
            title="Revenue trend"
            description="Estimated value of requests logged weekly, company-wide."
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
              <Card>
                <CardContent className="pt-5">
                  <RevenueTrendChart requests={serviceRequests} />
                </CardContent>
              </Card>
            )}
          </DashboardSection>

          <DashboardSection
            title="Status breakdown"
            description="Service requests and equipment, company-wide."
            viewAllHref="/service"
          >
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">By request status</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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
                    <ServiceStatusChart requests={serviceRequests} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">By priority</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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
                    <ServicePriorityChart requests={serviceRequests} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">By equipment status</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {equipmentQuery.isLoading ? (
                    <LoadingSkeleton variant="list" count={1} />
                  ) : equipmentQuery.isError ? (
                    <ErrorState
                      heading="Couldn't load equipment"
                      description="Something went wrong fetching equipment."
                      onRetry={() => equipmentQuery.refetch()}
                    />
                  ) : equipment.length === 0 ? (
                    <EmptyState
                      heading="No equipment yet"
                      description="Equipment will show up here once it's added."
                    />
                  ) : (
                    <EquipmentStatusChart equipment={equipment} />
                  )}
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Open work by priority"
          description="Where the current queue is weighted, company-wide."
        >
          {serviceRequestsQuery.isLoading ? (
            <LoadingSkeleton variant="list" count={1} />
          ) : serviceRequestsQuery.isError ? (
            <ErrorState
              heading="Couldn't load open work by priority"
              description="Something went wrong fetching service requests."
              onRetry={() => serviceRequestsQuery.refetch()}
            />
          ) : openTrend.openNow === 0 ? (
            <EmptyState
              heading="No open work right now"
              description="Open service requests will be weighted by priority here as they come in."
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-4 pt-5">
                <SegmentedBar segments={priorityBreakdown} />
                <ul className="flex flex-col gap-2">
                  {priorityBreakdown.map((entry) => (
                    <li key={entry.key} className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden="true"
                        className={cn("size-2 shrink-0 rounded-full", TONE_BG_CLASS[entry.tone])}
                      />
                      <span className="text-foreground">{entry.label}</span>
                      <span className="ml-auto font-semibold tabular-nums text-foreground">
                        {entry.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </DashboardSection>

        <DashboardSection
          title="Repeat service"
          description="Equipment units serviced more than once within 90 days."
        >
          {serviceRequestsQuery.isLoading ? (
            <LoadingSkeleton variant="list" count={1} />
          ) : serviceRequestsQuery.isError ? (
            <ErrorState
              heading="Couldn't load repeat service rate"
              description="Something went wrong fetching service requests."
              onRetry={() => serviceRequestsQuery.refetch()}
            />
          ) : repeatService.totalUnitCount === 0 ? (
            <EmptyState
              heading="No serviced equipment yet"
              description="Once requests are linked to equipment, the repeat-service rate will show up here."
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-2 pt-5">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {Math.round(repeatService.pct ?? 0)}%
                </span>
                <p className="text-sm text-muted-foreground">
                  {repeatService.repeatUnitCount} of {repeatService.totalUnitCount} serviced units
                  needed a second visit.
                </p>
              </CardContent>
            </Card>
          )}
        </DashboardSection>
      </div>

      <DashboardSection
        title="Equipment category breakdown"
        description="Service volume and units fielded by equipment type, company-wide."
      >
        {serviceRequestsQuery.isLoading || equipmentQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={1} />
        ) : serviceRequestsQuery.isError || equipmentQuery.isError ? (
          <ErrorState
            heading="Couldn't load equipment category breakdown"
            description="Something went wrong fetching service requests or equipment."
            onRetry={() => {
              serviceRequestsQuery.refetch();
              equipmentQuery.refetch();
            }}
          />
        ) : equipment.length === 0 ? (
          <EmptyState
            heading="No equipment yet"
            description="Equipment will show up here once it's added."
          />
        ) : (
          <Card>
            <CardContent className="pt-5">
              <CategoryBarList entries={categoryBarListEntries} />
            </CardContent>
          </Card>
        )}
      </DashboardSection>

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
          <StaggerGrid className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
