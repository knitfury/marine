import { PageContainer } from "@/components/layout/page-container";
import { DealerDetail } from "@/components/dealers/dealer-detail";

interface DealerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealerDetailPage({ params }: DealerDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <DealerDetail id={id} />
    </PageContainer>
  );
}
