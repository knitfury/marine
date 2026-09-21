"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wrench } from "@phosphor-icons/react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  DetailHeader,
  DetailSection,
  KeyValueList,
  RelatedRecordCard,
  StatusBadge,
  ServiceRequestRow,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/shared";
import { RaiseRequestDialog } from "@/components/service/raise-request-dialog";
import {
  getCurrentMockUser,
  getCustomerById,
  getDealerById,
  getEquipmentById,
  getServiceRequests,
} from "@/lib/mock-api";
import { canViewCustomer, canViewDealer, canViewEquipment } from "@/lib/permissions/can-view";
import { formatEquipmentStatus } from "@/lib/formatting/status";
import { entityHref } from "@/lib/routes";
import { useRoleStore } from "@/stores/role-store";

const SERVICE_PREVIEW_COUNT = 3;

export interface EquipmentDetailProps {
  id: string;
}

export function EquipmentDetail({ id }: EquipmentDetailProps) {
  const role = useRoleStore((state) => state.role);
  const [imageFailed, setImageFailed] = React.useState(false);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });
  const user = userQuery.data;

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "detail", id],
    queryFn: () => getEquipmentById(id),
    enabled: !!user,
  });
  const equipment = equipmentQuery.data;

  const customerQuery = useQuery({
    queryKey: ["customer", equipment?.customerId],
    queryFn: () => getCustomerById(equipment!.customerId!),
    enabled: !!equipment?.customerId,
  });

  const dealerQuery = useQuery({
    queryKey: ["dealer", equipment?.dealerId],
    queryFn: () => getDealerById(equipment!.dealerId!),
    enabled: !!equipment?.dealerId,
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ["service-requests", "for-equipment", id],
    queryFn: () => getServiceRequests({ equipmentId: id }),
    enabled: !!equipment,
  });

  if (userQuery.isLoading || equipmentQuery.isLoading) {
    return (
      <PageContainer className="flex flex-col gap-6">
        <LoadingSkeleton variant="detail-header" />
        <LoadingSkeleton variant="list" count={3} />
      </PageContainer>
    );
  }

  if (userQuery.isError || equipmentQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          heading="Couldn't load this equipment record"
          description="Something went wrong fetching this record."
          onRetry={() => {
            userQuery.refetch();
            equipmentQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  if (!equipment) {
    return (
      <PageContainer>
        <EmptyState heading="Equipment not found" description="This equipment record doesn't exist." />
      </PageContainer>
    );
  }

  if (!user || !canViewEquipment(user, equipment)) {
    return (
      <PageContainer>
        <EmptyState heading="Access restricted" description="You don't have access to this record." />
      </PageContainer>
    );
  }

  const customer = customerQuery.data;
  const dealer = dealerQuery.data;
  const showCustomer = !!customer && canViewCustomer(user, customer);
  const showDealer = !!dealer && canViewDealer(user, dealer);
  const serviceRequests = serviceRequestsQuery.data ?? [];
  const showImage = Boolean(equipment.imageUrl) && !imageFailed;

  return (
    <PageContainer className="flex flex-col gap-6">
      <DetailHeader
        title={equipment.name}
        subtitle={`${equipment.equipmentType} · ${equipment.model}`}
        badges={<StatusBadge kind="equipment" status={equipment.currentStatus} />}
      />

      <div className="flex aspect-[16/7] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- external mock-catalogue photo, no next/image domain config needed
          <img
            src={equipment.imageUrl}
            alt={`${equipment.equipmentType} - ${equipment.model}`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Wrench className="size-12 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <DetailSection title="Identification">
        <KeyValueList
          items={[
            { label: "Equipment type", value: equipment.equipmentType },
            { label: "Model", value: equipment.model },
            { label: "Serial number", value: equipment.serialNumber },
            { label: "Current status", value: formatEquipmentStatus(equipment.currentStatus).label },
          ]}
        />
      </DetailSection>

      {equipment.customerId && showCustomer && customer && (
        <DetailSection title="Associated customer">
          <RelatedRecordCard
            href={entityHref("customer", customer.id)}
            title={customer.name}
            subtitle={customer.organizationName ?? customer.primaryContactName}
          />
        </DetailSection>
      )}

      {equipment.dealerId && showDealer && dealer && (
        <DetailSection title="Associated dealer">
          <RelatedRecordCard href={entityHref("dealer", dealer.id)} title={dealer.name} subtitle={dealer.region} />
        </DetailSection>
      )}

      <DetailSection
        title="Service requests"
        description="Recent requests for this equipment."
        action={
          <div className="flex items-center gap-3">
            {serviceRequests.length > 0 && (
              <Button asChild variant="link" size="sm" className="h-auto px-0">
                <Link href={`/service?equipmentId=${id}`}>View all</Link>
              </Button>
            )}
            <RaiseRequestDialog
              defaultEquipmentId={id}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  Raise request for this equipment
                </Button>
              }
            />
          </div>
        }
      >
        {serviceRequestsQuery.isLoading ? (
          <LoadingSkeleton variant="list" count={2} />
        ) : serviceRequestsQuery.isError ? (
          <ErrorState
            heading="Couldn't load service requests"
            description="Something went wrong fetching service requests."
            onRetry={() => serviceRequestsQuery.refetch()}
          />
        ) : serviceRequests.length === 0 ? (
          <EmptyState heading="No service requests" description="No service requests have been logged for this equipment." />
        ) : (
          <div className="flex flex-col gap-3">
            {serviceRequests.slice(0, SERVICE_PREVIEW_COUNT).map((request) => (
              <ServiceRequestRow key={request.id} request={request} />
            ))}
          </div>
        )}
      </DetailSection>
    </PageContainer>
  );
}
