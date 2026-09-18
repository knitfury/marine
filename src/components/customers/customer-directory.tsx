"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  PageHeader,
  SearchInput,
  FilterBar,
  CustomerCard,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  type FilterDef,
} from "@/components/shared";
import { useRoleStore } from "@/stores/role-store";
import { getCustomers, getDealers } from "@/lib/mock-api";
import { formatCustomerStatus } from "@/lib/formatting/status";
import { CUSTOMER_STATUSES } from "@/lib/constants/status";
import type { CustomerStatus } from "@/types";

/**
 * Full customer directory - internal staff only (see the module-level
 * access model in the product spec). Supports arriving from a dealer detail
 * page's "View all" link via a `dealerId` query param, which pre-selects
 * the dealer filter.
 */
export function CustomerDirectory() {
  const role = useRoleStore((state) => state.role);
  const searchParams = useSearchParams();
  const dealerIdParam = searchParams.get("dealerId") ?? undefined;

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<CustomerStatus | undefined>(undefined);
  const [dealerId, setDealerId] = React.useState<string | undefined>(dealerIdParam);

  const dealersQuery = useQuery({
    queryKey: ["dealers", "all"],
    queryFn: () => getDealers(),
    enabled: role === "internal",
  });

  const customersQuery = useQuery({
    queryKey: ["customers", { search, status, dealerId }],
    queryFn: () => getCustomers({ search: search || undefined, status, dealerId }),
    enabled: role === "internal",
  });

  if (role !== "internal") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Customers" />
        <EmptyState
          heading="This directory isn't available for your role."
          description="The full customer directory is only visible to internal Marine Travelift staff."
        />
      </div>
    );
  }

  const dealerOptions = (dealersQuery.data ?? []).map((d) => ({ label: d.name, value: d.id }));

  const filters: FilterDef[] = [
    {
      key: "status",
      label: "Status",
      options: CUSTOMER_STATUSES.map((s) => ({ label: formatCustomerStatus(s).label, value: s })),
      value: status,
      onChange: (value) => setStatus(value as CustomerStatus | undefined),
    },
    {
      key: "dealer",
      label: "Dealer",
      options: dealerOptions,
      value: dealerId,
      onChange: (value) => setDealerId(value),
    },
  ];

  const customers = customersQuery.data ?? [];
  const filtersActive = Boolean(search || status || dealerId);
  const arrivedViaDealer = Boolean(dealerIdParam) && dealerId === dealerIdParam;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customers" description="Browse every customer in the network." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search customers..."
          aria-label="Search customers"
          className="sm:max-w-sm"
        />
        <FilterBar filters={filters} />
      </div>

      {customersQuery.isLoading ? (
        <LoadingSkeleton variant="list" count={5} />
      ) : customersQuery.isError ? (
        <ErrorState
          heading="Couldn't load customers"
          description="Something went wrong fetching the customer directory."
          onRetry={() => customersQuery.refetch()}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          heading={
            arrivedViaDealer
              ? "No customers for this dealer"
              : filtersActive
                ? "No customers match your filters"
                : "No customers yet"
          }
          description={
            arrivedViaDealer
              ? "This dealer doesn't have any associated customers yet."
              : filtersActive
                ? "Try adjusting your search or filters."
                : "Customers will show up here once they're added."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}
