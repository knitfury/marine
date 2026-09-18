import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingSkeleton } from "@/components/shared";
import { EquipmentDirectory } from "@/components/equipment/equipment-directory";

export default function EquipmentPage() {
  return (
    <PageContainer>
      <Suspense fallback={<LoadingSkeleton variant="cards" count={6} />}>
        <EquipmentDirectory />
      </Suspense>
    </PageContainer>
  );
}
