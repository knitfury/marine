"use client";

import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingSkeleton } from "@/components/shared";
import { CustomerDirectory } from "@/components/customers/customer-directory";

export default function CustomersPage() {
  return (
    <PageContainer>
      <Suspense fallback={<LoadingSkeleton variant="list" count={5} />}>
        <CustomerDirectory />
      </Suspense>
    </PageContainer>
  );
}
