"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DetailHeader,
  DetailSection,
  KeyValueList,
  StatusBadge,
  CustomerCard,
  EquipmentCard,
  ServiceRequestRow,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/shared";
import { useRoleStore } from "@/stores/role-store";
import {
  getCurrentMockUser,
  getDealerById,
  getCustomers,
  getEquipment,
  getServiceRequests,
} from "@/lib/mock-api";
import { canViewDealer } from "@/lib/permissions/can-view";

const PREVIEW_COUNT = 6;

export interface DealerDetailProps {
  id: string;
}

/** Dealer detail screen: profile, contact, summary rollups, and previews of the dealer's customers/equipment/service requests. */
export function DealerDetail({ id }: DealerDetailProps) {
  const role = useRoleStore((state) => state.role);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });

  const dealerQuery = useQuery({
    queryKey: ["dealer", id],
    queryFn: () => getDealerById(id),
  });

  const customersQuery = useQuery({
    queryKey: ["dealer-customers", id],
    queryFn: () => getCustomers({ dealerId: id }),
    enabled: Boolean(dealerQuery.data),
  });

  const equipmentQuery = useQuery({
    queryKey: ["dealer-equipment", id],
    queryFn: () => getEquipment({ dealerId: id }),
    enabled: Boolean(dealerQuery.data),
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ["dealer-service-requests", id],
    queryFn: () => getServiceRequests({ dealerId: id }),
    enabled: Boolean(dealerQuery.data),
  });

  const user = userQuery.data;
  const dealer = dealerQuery.data;

  if (dealerQuery.isLoading || userQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSkeleton variant="detail-header" />
        <LoadingSkeleton variant="cards" count={2} />
      </div>
    );
  }

  if (dealerQuery.isError || userQuery.isError) {
    return (
      <ErrorState
        heading="Couldn't load this dealer"
        description="Something went wrong fetching the dealer's details."
        onRetry={() => {
          dealerQuery.refetch();
          userQuery.refetch();
        }}
      />
    );
  }

  if (!dealer) {
    return <EmptyState heading="Dealer not found" description="We couldn't find a dealer with this id." />;
  }

  if (!user || !canViewDealer(user, dealer)) {
    return (
      <EmptyState
        heading="You don't have access to this dealer"
        description="This dealer's details aren't available for your account."
      />
    );
  }

  const customers = customersQuery.data ?? [];
  const equipment = equipmentQuery.data ?? [];
  const serviceRequests = serviceRequestsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        title={dealer.name}
        subtitle={dealer.region}
        badges={<StatusBadge kind="dealer" status={dealer.status} />}
      />

      <DetailSection title="Contact">
        <KeyValueList
          items={[
            { label: "Primary contact", value: dealer.primaryContactName },
            { label: "Email", value: dealer.primaryContactEmail },
          ]}
        />
      </DetailSection>

      <DetailSection title="Summary">
        <KeyValueList
          items={[
            { label: "Customers", value: dealer.customerCount },
            { label: "Equipment", value: dealer.equipmentCount },
            { label: "Open service requests", value: dealer.openServiceRequestCount },
          ]}
        />
      </DetailSection>

      <DetailSection title="Customers">
        {customersQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={3} />
        ) : customersQuery.isError ? (
          <ErrorState
            heading="Couldn't load customers"
            description="Something went wrong fetching this dealer's customers."
            onRetry={() => customersQuery.refetch()}
          />
        ) : customers.length === 0 ? (
          <EmptyState heading="No customers yet" description="This dealer doesn't have any associated customers." />
        ) : (
          <div className="flex flex-col gap-3">
            {customers.slice(0, PREVIEW_COUNT).map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
            {user.role === "internal" && (
              <Button asChild variant="link" size="sm" className="h-auto w-fit px-0">
                <Link href={`/customers?dealerId=${id}`}>View all customers</Link>
              </Button>
            )}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Equipment">
        {equipmentQuery.isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : equipmentQuery.isError ? (
          <ErrorState
            heading="Couldn't load equipment"
            description="Something went wrong fetching this dealer's equipment."
            onRetry={() => equipmentQuery.refetch()}
          />
        ) : equipment.length === 0 ? (
          <EmptyState heading="No equipment yet" description="This dealer doesn't have any associated equipment." />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.slice(0, PREVIEW_COUNT).map((item) => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
            <Button asChild variant="link" size="sm" className="h-auto w-fit px-0">
              <Link href={`/equipment?dealerId=${id}`}>View all equipment</Link>
            </Button>
          </div>
        )}
      </DetailSection>

      <DetailSection title="Service requests">
        {serviceRequestsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={3} />
        ) : serviceRequestsQuery.isError ? (
          <ErrorState
            heading="Couldn't load service requests"
            description="Something went wrong fetching this dealer's service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : serviceRequests.length === 0 ? (
          <EmptyState
            heading="No service requests yet"
            description="This dealer doesn't have any associated service requests."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {serviceRequests.slice(0, PREVIEW_COUNT).map((request) => (
              <ServiceRequestRow key={request.id} request={request} />
            ))}
            <Button asChild variant="link" size="sm" className="h-auto w-fit px-0">
              <Link href={`/service?dealerId=${id}`}>View all service requests</Link>
            </Button>
          </div>
        )}
      </DetailSection>
    </div>
  );
}
