"use client";

import * as React from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Called with the current value `debounceMs` after the person stops typing. */
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
  "aria-label"?: string;
}

/** Text input with a search icon and a debounced onChange - the standard directory/list-screen search box. */
export function SearchInput({
  value,
  defaultValue = "",
  placeholder = "Search...",
  onChange,
  debounceMs = 300,
  className,
  "aria-label": ariaLabel = "Search",
}: SearchInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(value ?? defaultValue);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (isControlled) setInternalValue(value ?? "");
  }, [isControlled, value]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleInput(next: string) {
    setInternalValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(next), debounceMs);
  }

  function handleClear() {
    setInternalValue("");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onChange("");
  }

  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlass
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={internalValue}
        onChange={(e) => handleInput(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
