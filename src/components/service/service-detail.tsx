"use client";

import { useQuery } from "@tanstack/react-query";
import { Info } from "@phosphor-icons/react";
import { PageContainer } from "@/components/layout/page-container";
import {
  DetailHeader,
  DetailSection,
  KeyValueList,
  RelatedRecordCard,
  StatusBadge,
  PriorityBadge,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/shared";
import { StatusTimeline } from "@/components/service/status-timeline";
import { ServiceStatusControl } from "@/components/service/service-status-control";
import {
  getCurrentMockUser,
  getCustomerById,
  getDealerById,
  getEquipmentById,
  getServiceRequestById,
} from "@/lib/mock-api";
import {
  canViewCustomer,
  canViewDealer,
  canViewEquipment,
  canViewServiceRequest,
} from "@/lib/permissions/can-view";
import { formatDate } from "@/lib/formatting/date";
import { entityHref } from "@/lib/routes";
import { useRoleStore } from "@/stores/role-store";

export interface ServiceDetailProps {
  id: string;
}

export function ServiceDetail({ id }: ServiceDetailProps) {
  const role = useRoleStore((state) => state.role);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });
  const user = userQuery.data;

  const requestQuery = useQuery({
    queryKey: ["service-request", "detail", id],
    queryFn: () => getServiceRequestById(id),
    enabled: !!user,
  });
  const request = requestQuery.data;

  const equipmentQuery = useQuery({
    queryKey: ["equipment", request?.equipmentId],
    queryFn: () => getEquipmentById(request!.equipmentId!),
    enabled: !!request?.equipmentId,
  });

  const customerQuery = useQuery({
    queryKey: ["customer", request?.customerId],
    queryFn: () => getCustomerById(request!.customerId!),
    enabled: !!request?.customerId,
  });

  const dealerQuery = useQuery({
    queryKey: ["dealer", request?.dealerId],
    queryFn: () => getDealerById(request!.dealerId!),
    enabled: !!request?.dealerId,
  });

  if (userQuery.isLoading || requestQuery.isLoading) {
    return (
      <PageContainer className="flex flex-col gap-6">
        <LoadingSkeleton variant="detail-header" />
        <LoadingSkeleton variant="list" count={3} />
      </PageContainer>
    );
  }

  if (userQuery.isError || requestQuery.isError) {
    return (
      <PageContainer>
        <ErrorState
          heading="Couldn't load this service request"
          description="Something went wrong fetching this record."
          onRetry={() => {
            userQuery.refetch();
            requestQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <EmptyState heading="Service request not found" description="This service request doesn't exist." />
      </PageContainer>
    );
  }

  if (!user || !canViewServiceRequest(user, request)) {
    return (
      <PageContainer>
        <EmptyState heading="Access restricted" description="You don't have access to this record." />
      </PageContainer>
    );
  }

  const equipment = equipmentQuery.data;
  const customer = customerQuery.data;
  const dealer = dealerQuery.data;
  const showEquipment = !!equipment && canViewEquipment(user, equipment);
  const showCustomer = !!customer && canViewCustomer(user, customer);
  const showDealer = !!dealer && canViewDealer(user, dealer);
  const isInternal = user.role === "internal";

  return (
    <PageContainer className="flex flex-col gap-6">
      <DetailHeader
        title={request.subject}
        subtitle={request.referenceNumber}
        badges={
          <>
            <StatusBadge kind="service-request" status={request.status} />
            <PriorityBadge priority={request.priority} />
          </>
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info-subtle px-4 py-3">
        <Info className="mt-0.5 size-5 shrink-0 text-info-subtle-foreground" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-info-subtle-foreground">
            Status changes are saved to the shared backend
          </p>
          <p className="mt-0.5 text-sm text-info-subtle-foreground/80">
            {isInternal
              ? "Updates you make here are real and persist across reloads. Anyone viewing this request sees the change on their next load."
              : "Internal staff manage this request's status. This page reflects the latest status on every load."}
          </p>
        </div>
      </div>

      <DetailSection
        title="Status progress"
        action={
          isInternal ? (
            <ServiceStatusControl
              id={request.id}
              referenceNumber={request.referenceNumber}
              status={request.status}
            />
          ) : undefined
        }
      >
        <StatusTimeline status={request.status} />
      </DetailSection>

      <DetailSection title="Details">
        <KeyValueList
          items={[
            { label: "Assigned team", value: request.assignedTeam },
            { label: "Created", value: formatDate(request.createdAt) },
            { label: "Updated", value: formatDate(request.updatedAt) },
          ]}
        />
      </DetailSection>

      <DetailSection title="Summary">
        <p className="text-sm text-foreground">{request.summary}</p>
      </DetailSection>

      {request.equipmentId && showEquipment && equipment && (
        <DetailSection title="Associated equipment">
          <RelatedRecordCard
            href={entityHref("equipment", equipment.id)}
            title={equipment.name}
            subtitle={`${equipment.equipmentType} · ${equipment.model}`}
          />
        </DetailSection>
      )}

      {request.customerId && showCustomer && customer && (
        <DetailSection title="Associated customer">
          <RelatedRecordCard
            href={entityHref("customer", customer.id)}
            title={customer.name}
            subtitle={customer.organizationName ?? customer.primaryContactName}
          />
        </DetailSection>
      )}

      {request.dealerId && showDealer && dealer && (
        <DetailSection title="Associated dealer">
          <RelatedRecordCard href={entityHref("dealer", dealer.id)} title={dealer.name} subtitle={dealer.region} />
        </DetailSection>
      )}
    </PageContainer>
  );
}
