"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { updateServiceRequestStatus } from "@/lib/mock-api";
import { invalidateServiceRequestRelatedQueries } from "@/lib/query-invalidation";
import { toast } from "@/hooks/use-toast";
import { SERVICE_REQUEST_STATUSES } from "@/lib/constants/status";
import { formatServiceRequestStatus } from "@/lib/formatting/status";
import type { ServiceRequestStatus } from "@/types";

const CLOSED_STATUS: ServiceRequestStatus = "closed";

export interface ServiceStatusControlProps {
  id: string;
  referenceNumber: string;
  status: ServiceRequestStatus;
}

/**
 * Internal-only real status control for the service detail page: a Select
 * to advance the request through the fixed status sequence
 * (SERVICE_REQUEST_STATUSES), plus a distinct "Close request" action that
 * jumps straight to "closed" regardless of the current step. Replaces the
 * old `ConfirmableActionPlaceholder` "Add update" stand-in - this actually
 * writes through `updateServiceRequestStatus`, persisted to localStorage.
 *
 * Once a request is closed it can't be reopened in this phase - the
 * control hides itself and shows a plain "closed" note instead.
 */
export function ServiceStatusControl({ id, referenceNumber, status }: ServiceStatusControlProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (nextStatus: ServiceRequestStatus) => updateServiceRequestStatus(id, nextStatus),
    onSuccess: async (updated) => {
      toast({
        title: `${referenceNumber} updated`,
        description: `Status changed to "${formatServiceRequestStatus(updated.status).label}".`,
        variant: "success",
      });
      await invalidateServiceRequestRelatedQueries(queryClient);
    },
    onError: (error) => {
      toast({
        title: "Couldn't update status",
        description:
          error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "danger",
      });
    },
  });

  if (status === CLOSED_STATUS) {
    return <p className="text-xs text-muted-foreground">This request is closed.</p>;
  }

  const currentIndex = SERVICE_REQUEST_STATUSES.indexOf(status);
  const advanceableStatuses = SERVICE_REQUEST_STATUSES.filter(
    (s, i) => s !== CLOSED_STATUS && i >= currentIndex
  );

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Select
        value={status}
        onValueChange={(value) => {
          const nextStatus = value as ServiceRequestStatus;
          if (nextStatus !== status) mutation.mutate(nextStatus);
        }}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="h-9 w-full sm:w-48" aria-label="Advance service request status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {advanceableStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {formatServiceRequestStatus(s).label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(CLOSED_STATUS)}
      >
        Close request
      </Button>
    </div>
  );
}
