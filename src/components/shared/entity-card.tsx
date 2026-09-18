"use client";

import * as React from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { StatusBadge, type StatusBadgeProps } from "@/components/shared/status-badge";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { entityHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Customer, Dealer, Equipment, ServiceRequest } from "@/types";

export interface EntityCardStat {
  label: string;
  value: React.ReactNode;
}

export interface EntityCardProps {
  href: string;
  title: string;
  subtitle?: string;
  avatarName?: string;
  status?: StatusBadgeProps;
  stats?: EntityCardStat[];
  className?: string;
}

/**
 * Generic clickable summary row/card for a dealer/customer/equipment/service
 * request. Directory list screens (a later phase) can use this directly, or
 * one of the thin per-entity wrappers below for a call site that just has a
 * raw `Dealer`/`Customer`/`Equipment`/`ServiceRequest` record in hand.
 */
export function EntityCard({ href, title, subtitle, avatarName, status, stats, className }: EntityCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md sm:p-5">
        {avatarName && <EntityAvatar name={avatarName} className="hidden sm:flex" />}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            {status && <StatusBadge {...status} />}
          </div>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}

          {stats && stats.length > 0 && (
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-baseline gap-1 text-xs">
                  <dt className="text-muted-foreground">{stat.label}</dt>
                  <dd className="font-medium text-foreground">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <CaretRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Card>
    </Link>
  );
}

export function DealerCard({ dealer }: { dealer: Dealer }) {
  return (
    <EntityCard
      href={entityHref("dealer", dealer.id)}
      title={dealer.name}
      subtitle={dealer.region}
      avatarName={dealer.name}
      status={{ kind: "dealer", status: dealer.status }}
      stats={[
        { label: "Customers", value: dealer.customerCount },
        { label: "Equipment", value: dealer.equipmentCount },
        { label: "Open requests", value: dealer.openServiceRequestCount },
      ]}
    />
  );
}

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <EntityCard
      href={entityHref("customer", customer.id)}
      title={customer.name}
      subtitle={customer.organizationName ?? customer.primaryContactName}
      avatarName={customer.name}
      status={{ kind: "customer", status: customer.status }}
      stats={[
        { label: "Equipment", value: customer.equipmentCount },
        { label: "Open requests", value: customer.openServiceRequestCount },
      ]}
    />
  );
}

export function EquipmentCard({ equipment }: { equipment: Equipment }) {
  return (
    <EntityCard
      href={entityHref("equipment", equipment.id)}
      title={equipment.name}
      subtitle={`${equipment.equipmentType} · ${equipment.model}`}
      avatarName={equipment.name}
      status={{ kind: "equipment", status: equipment.currentStatus }}
      stats={[{ label: "Serial", value: equipment.serialNumber }]}
    />
  );
}

export function ServiceRequestRow({ request }: { request: ServiceRequest }) {
  return (
    <EntityCard
      href={entityHref("service", request.id)}
      title={request.subject}
      subtitle={request.referenceNumber}
      status={{ kind: "service-request", status: request.status }}
      stats={[{ label: "Team", value: request.assignedTeam }]}
    />
  );
}
