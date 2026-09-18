"use client";

import * as React from "react";
import Link from "next/link";
import { Wrench } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { entityHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Equipment } from "@/types";

export interface EquipmentCatalogueCardProps {
  equipment: Equipment;
  stats?: { label: string; value: React.ReactNode }[];
  className?: string;
}

/**
 * Image-forward "product catalogue" tile for the equipment directory - a
 * photo on top, details below. Falls back to a plain icon tile if there's
 * no `imageUrl` or if the image fails to load, so a broken/unreachable
 * photo URL never renders as a broken-image icon.
 */
export function EquipmentCatalogueCard({ equipment, stats, className }: EquipmentCatalogueCardProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(equipment.imageUrl) && !imageFailed;

  return (
    <Link
      href={entityHref("equipment", equipment.id)}
      className={cn(
        "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Card className="overflow-hidden p-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- external mock-catalogue photo, no next/image domain config needed
            <img
              src={equipment.imageUrl}
              alt={`${equipment.equipmentType} - ${equipment.model}`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Wrench className="size-10 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <StatusBadge kind="equipment" status={equipment.currentStatus} />
          </div>
        </div>

        <div className="flex flex-col gap-1 p-4">
          <p className="truncate text-sm font-semibold text-foreground">{equipment.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {equipment.equipmentType} · {equipment.model}
          </p>

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
      </Card>
    </Link>
  );
}
