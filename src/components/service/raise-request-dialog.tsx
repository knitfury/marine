"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  createServiceRequest,
  getCurrentMockUser,
  getEquipment,
  type CreateServiceRequestInput,
} from "@/lib/mock-api";
import { invalidateServiceRequestRelatedQueries } from "@/lib/query-invalidation";
import {
  createServiceRequestSchema,
  type CreateServiceRequestFormValues,
} from "@/schemas/service-request";
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_TEAMS } from "@/lib/constants/status";
import { formatServiceRequestPriority } from "@/lib/formatting/status";
import { useRoleStore } from "@/stores/role-store";

const NO_EQUIPMENT_VALUE = "none";

const DEFAULT_VALUES: CreateServiceRequestFormValues = {
  subject: "",
  summary: "",
  priority: "medium",
  assignedTeam: "",
  equipmentId: NO_EQUIPMENT_VALUE,
};

export interface RaiseRequestDialogProps {
  /** The element that opens the dialog (wrapped in a Radix `DialogTrigger`). */
  trigger: React.ReactNode;
  /** Pre-selects this equipment when the dialog opens, e.g. from the
   * equipment detail page's "Raise request for this equipment" button. */
  defaultEquipmentId?: string;
}

/**
 * "Raise a service request" form, available to every role - internal staff
 * as well as dealer/customer users raising a request for their own
 * equipment. Creates a real record via `createServiceRequest`, persisted to
 * the real backend (Catalyst DataStore, via `src/app/api/service-requests`
 * and `src/lib/catalyst/service-requests-table.ts`), not just an in-memory
 * fixture or this browser's localStorage.
 *
 * `customerId`/`dealerId` are never asked for directly - they're inferred
 * from the current user's role/organization (or, for internal users, from
 * the selected equipment's own org) at submit time, so a dealer/customer
 * can never raise a request attributed to a different org.
 */
export function RaiseRequestDialog({ trigger, defaultEquipmentId }: RaiseRequestDialogProps) {
  const role = useRoleStore((state) => state.role);
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });
  const user = userQuery.data;

  const equipmentScope =
    user?.role === "dealer"
      ? { dealerId: user.organizationId }
      : user?.role === "customer"
        ? { customerId: user.organizationId }
        : {};

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "raise-request-options", user?.role, user?.organizationId],
    queryFn: () => getEquipment(equipmentScope),
    enabled: !!user && open,
  });
  const equipmentOptions = equipmentQuery.data ?? [];

  const form = useForm<CreateServiceRequestFormValues>({
    resolver: zodResolver(createServiceRequestSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const mutation = useMutation({
    mutationFn: (input: CreateServiceRequestInput) => createServiceRequest(input),
    onSuccess: async (created) => {
      toast({
        title: `Service request ${created.referenceNumber} raised`,
        description: created.subject,
        variant: "success",
      });
      setOpen(false);
      await invalidateServiceRequestRelatedQueries(queryClient);
    },
    onError: (error) => {
      toast({
        title: "Couldn't raise service request",
        description:
          error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "danger",
      });
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        ...DEFAULT_VALUES,
        equipmentId: defaultEquipmentId ?? NO_EQUIPMENT_VALUE,
      });
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultEquipmentId]);

  function onSubmit(values: CreateServiceRequestFormValues) {
    if (!user) return;

    const equipmentId =
      values.equipmentId && values.equipmentId !== NO_EQUIPMENT_VALUE ? values.equipmentId : undefined;

    let customerId: string | undefined;
    let dealerId: string | undefined;
    if (user.role === "dealer") {
      dealerId = user.organizationId;
    } else if (user.role === "customer") {
      customerId = user.organizationId;
    } else if (equipmentId) {
      const equipment = equipmentOptions.find((eq) => eq.id === equipmentId);
      customerId = equipment?.customerId;
      dealerId = equipment?.dealerId;
    }

    mutation.mutate({
      subject: values.subject,
      summary: values.summary,
      priority: values.priority,
      assignedTeam: values.assignedTeam,
      equipmentId,
      customerId,
      dealerId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Raise a service request</DialogTitle>
          <DialogDescription>
            This creates a real request. It&apos;s saved to the shared backend, so it will still
            be here after you reload the page - and everyone else will see it too.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raise-request-subject">Subject</Label>
            <Input
              id="raise-request-subject"
              placeholder="e.g. Hydraulic pressure loss on port lift cylinder"
              {...form.register("subject")}
            />
            {form.formState.errors.subject && (
              <p className="text-xs text-danger">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raise-request-summary">Summary</Label>
            <Textarea
              id="raise-request-summary"
              placeholder="Describe the issue or the work being requested..."
              rows={4}
              {...form.register("summary")}
            />
            {form.formState.errors.summary && (
              <p className="text-xs text-danger">{form.formState.errors.summary.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raise-request-priority">Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="raise-request-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_REQUEST_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {formatServiceRequestPriority(priority).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raise-request-team">Assigned team</Label>
              <Controller
                control={form.control}
                name="assignedTeam"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="raise-request-team">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_REQUEST_TEAMS.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.assignedTeam && (
                <p className="text-xs text-danger">{form.formState.errors.assignedTeam.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raise-request-equipment">Equipment</Label>
            <Controller
              control={form.control}
              name="equipmentId"
              render={({ field }) => (
                <Select value={field.value ?? NO_EQUIPMENT_VALUE} onValueChange={field.onChange}>
                  <SelectTrigger id="raise-request-equipment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_EQUIPMENT_VALUE}>No specific equipment</SelectItem>
                    {equipmentOptions.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} · {eq.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Optional, but most requests reference the equipment involved.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={mutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Raising request..." : "Raise request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A ready-made prominent trigger button, so callers don't have to
 * hand-roll the same icon+label button at each call site. */
export function RaiseRequestButton({
  defaultEquipmentId,
  label = "Raise request",
}: {
  defaultEquipmentId?: string;
  label?: string;
}) {
  return (
    <RaiseRequestDialog
      defaultEquipmentId={defaultEquipmentId}
      trigger={
        <Button type="button">
          <Plus className="size-4" aria-hidden="true" />
          {label}
        </Button>
      }
    />
  );
}
