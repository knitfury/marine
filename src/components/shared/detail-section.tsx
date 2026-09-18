import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DetailSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Titled content section wrapper used to build up a detail page from a stack of these. */
export function DetailSection({ title, description, action, children, className }: DetailSectionProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          {/* h2: DetailSection is a page's top-level section, directly under the DetailHeader's h1 - see spec 20. */}
          <CardTitle as="h2">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
