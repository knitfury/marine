"use client";

import * as React from "react";
import { Funnel } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
}

export interface FilterBarProps {
  filters: FilterDef[];
  className?: string;
}

/** Sentinel select value standing in for "no filter selected" - Radix Select's value prop can't be an empty string. */
const ALL_VALUE = "__all__";

function FilterSelect({ filter }: { filter: FilterDef }) {
  return (
    <Select
      value={filter.value ?? ALL_VALUE}
      onValueChange={(next) => filter.onChange(next === ALL_VALUE ? undefined : next)}
    >
      <SelectTrigger aria-label={filter.label} className="w-full sm:w-44">
        <SelectValue placeholder={filter.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All {filter.label.toLowerCase()}</SelectItem>
        {filter.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Responsive row of Select filters. On larger screens the Selects render
 * inline; below `sm:` they collapse into a single "Filters" button that
 * opens a bottom Sheet with the same controls stacked vertically.
 */
export function FilterBar({ filters, className }: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const activeCount = filters.filter((f) => f.value).length;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        {filters.map((filter) => (
          <FilterSelect key={filter.key} filter={filter} />
        ))}
      </div>

      <div className="sm:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <Button
            variant="outline"
            onClick={() => setSheetOpen(true)}
            className="gap-2"
          >
            <Funnel className="size-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <Badge variant="info" className="ml-1">
                {activeCount}
              </Badge>
            )}
          </Button>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-3">
              {filters.map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{filter.label}</span>
                  <FilterSelect filter={filter} />
                </div>
              ))}
            </div>
            <Button onClick={() => setSheetOpen(false)}>Done</Button>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
