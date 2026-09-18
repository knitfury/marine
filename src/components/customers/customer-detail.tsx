"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DetailHeader,
  DetailSection,
  KeyValueList,
  StatusBadge,
  RelatedRecordCard,
  EquipmentCard,
  ServiceRequestRow,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/shared";
import { useRoleStore } from "@/stores/role-store";
import {
  getCurrentMockUser,
  getCustomerById,
  getDealerById,
  getEquipment,
  getServiceRequests,
} from "@/lib/mock-api";
import { canViewCustomer, canViewDealer } from "@/lib/permissions/can-view";
import { entityHref } from "@/lib/routes";

const PREVIEW_COUNT = 6;

export interface CustomerDetailProps {
  id: string;
}

/** Customer detail screen: profile, contact, dealer link, and previews of the customer's equipment/service requests. */
export function CustomerDetail({ id }: CustomerDetailProps) {
  const role = useRoleStore((state) => state.role);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });

  const customerQuery = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id),
  });

  const dealerId = customerQuery.data?.dealerId;

  const dealerQuery = useQuery({
    queryKey: ["customer-dealer", dealerId],
    queryFn: () => getDealerById(dealerId!),
    enabled: Boolean(dealerId),
  });

  const equipmentQuery = useQuery({
    queryKey: ["customer-equipment", id],
    queryFn: () => getEquipment({ customerId: id }),
    enabled: Boolean(customerQuery.data),
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ["customer-service-requests", id],
    queryFn: () => getServiceRequests({ customerId: id }),
    enabled: Boolean(customerQuery.data),
  });

  const user = userQuery.data;
  const customer = customerQuery.data;

  if (customerQuery.isLoading || userQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <LoadingSkeleton variant="detail-header" />
        <LoadingSkeleton variant="cards" count={2} />
      </div>
    );
  }

  if (customerQuery.isError || userQuery.isError) {
    return (
      <ErrorState
        heading="Couldn't load this customer"
        description="Something went wrong fetching the customer's details."
        onRetry={() => {
          customerQuery.refetch();
          userQuery.refetch();
        }}
      />
    );
  }

  if (!customer) {
    return <EmptyState heading="Customer not found" description="We couldn't find a customer with this id." />;
  }

  if (!user || !canViewCustomer(user, customer)) {
    return (
      <EmptyState
        heading="You don't have access to this customer"
        description="This customer's details aren't available for your account."
      />
    );
  }

  const equipment = equipmentQuery.data ?? [];
  const serviceRequests = serviceRequestsQuery.data ?? [];
  const dealer = dealerQuery.data;
  const canLinkToDealer = dealer ? canViewDealer(user, dealer) : false;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        title={customer.name}
        subtitle={customer.organizationName ?? customer.primaryContactName}
        badges={<StatusBadge kind="customer" status={customer.status} />}
      />

      <DetailSection title="Contact">
        <KeyValueList
          items={[
            { label: "Primary contact", value: customer.primaryContactName },
            { label: "Email", value: customer.primaryContactEmail },
          ]}
        />
      </DetailSection>

      {customer.dealerId && (
        <DetailSection title="Dealer">
          {dealerQuery.isLoading ? (
            <LoadingSkeleton variant="list" count={1} />
          ) : dealerQuery.isError ? (
            <ErrorState
              heading="Couldn't load the dealer"
              description="Something went wrong fetching this customer's dealer."
              onRetry={() => dealerQuery.refetch()}
            />
          ) : !dealer ? (
            <EmptyState heading="Dealer not found" description="We couldn't find this customer's dealer record." />
          ) : canLinkToDealer ? (
            <RelatedRecordCard href={entityHref("dealer", dealer.id)} title={dealer.name} subtitle={dealer.region} />
          ) : (
            <p className="text-sm text-foreground">{dealer.name}</p>
          )}
        </DetailSection>
      )}

      <DetailSection title="Equipment">
        {equipmentQuery.isLoading ? (
          <LoadingSkeleton variant="cards" count={3} />
        ) : equipmentQuery.isError ? (
          <ErrorState
            heading="Couldn't load equipment"
            description="Something went wrong fetching this customer's equipment."
            onRetry={() => equipmentQuery.refetch()}
          />
        ) : equipment.length === 0 ? (
          <EmptyState heading="No equipment yet" description="This customer doesn't have any associated equipment." />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.slice(0, PREVIEW_COUNT).map((item) => (
                <EquipmentCard key={item.id} equipment={item} />
              ))}
            </div>
            <Button asChild variant="link" size="sm" className="h-auto w-fit px-0">
              <Link href={`/equipment?customerId=${id}`}>View all equipment</Link>
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
            description="Something went wrong fetching this customer's service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : serviceRequests.length === 0 ? (
          <EmptyState
            heading="No service requests yet"
            description="This customer doesn't have any associated service requests."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {serviceRequests.slice(0, PREVIEW_COUNT).map((request) => (
              <ServiceRequestRow key={request.id} request={request} />
            ))}
            <Button asChild variant="link" size="sm" className="h-auto w-fit px-0">
              <Link href={`/service?customerId=${id}`}>View all service requests</Link>
            </Button>
          </div>
        )}
      </DetailSection>
    </div>
  );
}
