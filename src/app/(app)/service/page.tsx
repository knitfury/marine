import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingSkeleton } from "@/components/shared";
import { ServiceDirectory } from "@/components/service/service-directory";

export default function ServicePage() {
  return (
    <PageContainer>
      <Suspense fallback={<LoadingSkeleton variant="list" count={6} />}>
        <ServiceDirectory />
      </Suspense>
    </PageContainer>
  );
}
