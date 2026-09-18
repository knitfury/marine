import { ServiceDetail } from "@/components/service/service-detail";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceDetail id={id} />;
}
