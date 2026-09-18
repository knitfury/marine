"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PageHeader,
  SearchInput,
  FilterBar,
  DealerCard,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  type FilterDef,
} from "@/components/shared";
import { useRoleStore } from "@/stores/role-store";
import { getDealers } from "@/lib/mock-api";
import { formatDealerStatus } from "@/lib/formatting/status";
import { DEALER_STATUSES } from "@/lib/constants/status";
import type { DealerStatus } from "@/types";

/**
 * Full dealer directory - internal staff only (see the module-level access
 * model in the product spec). Dealer/customer roles get a plain
 * "not available" state instead of a 404 or a silently empty list.
 */
export function DealerDirectory() {
  const role = useRoleStore((state) => state.role);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<DealerStatus | undefined>(undefined);
  const [region, setRegion] = React.useState<string | undefined>(undefined);

  // Unfiltered fetch used only to derive the region filter's option list, so
  // the available regions don't shrink as other filters are applied.
  const allDealersQuery = useQuery({
    queryKey: ["dealers", "all"],
    queryFn: () => getDealers(),
    enabled: role === "internal",
  });

  const dealersQuery = useQuery({
    queryKey: ["dealers", { search, status, region }],
    queryFn: () => getDealers({ search: search || undefined, status, region }),
    enabled: role === "internal",
  });

  if (role !== "internal") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dealers" />
        <EmptyState
          heading="This directory isn't available for your role."
          description="The full dealer directory is only visible to internal Marine Travelift staff."
        />
      </div>
    );
  }

  const regionOptions = Array.from(
    new Set((allDealersQuery.data ?? []).map((d) => d.region))
  ).sort();

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Status",
      options: DEALER_STATUSES.map((s) => ({ label: formatDealerStatus(s).label, value: s })),
      value: status,
      onChange: (value) => setStatus(value as DealerStatus | undefined),
    },
    {
      key: "region",
      label: "Region",
      options: regionOptions.map((r) => ({ label: r, value: r })),
      value: region,
      onChange: (value) => setRegion(value),
    },
  ];

  const dealers = dealersQuery.data ?? [];
  const filtersActive = Boolean(search || status || region);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dealers" description="Browse every dealer in the network." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search dealers..."
          aria-label="Search dealers"
          className="sm:max-w-sm"
        />
        <FilterBar filters={filters} />
      </div>

      {dealersQuery.isLoading ? (
        <LoadingSkeleton variant="list" count={5} />
      ) : dealersQuery.isError ? (
        <ErrorState
          heading="Couldn't load dealers"
          description="Something went wrong fetching the dealer directory."
          onRetry={() => dealersQuery.refetch()}
        />
      ) : dealers.length === 0 ? (
        <EmptyState
          heading={filtersActive ? "No dealers match your filters" : "No dealers yet"}
          description={
            filtersActive
              ? "Try adjusting your search or filters."
              : "Dealers will show up here once they're added."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {dealers.map((dealer) => (
            <DealerCard key={dealer.id} dealer={dealer} />
          ))}
        </div>
      )}
    </div>
  );
}
