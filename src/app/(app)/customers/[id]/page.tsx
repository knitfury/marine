import { PageContainer } from "@/components/layout/page-container";
import { CustomerDetail } from "@/components/customers/customer-detail";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <CustomerDetail id={id} />
    </PageContainer>
  );
}
