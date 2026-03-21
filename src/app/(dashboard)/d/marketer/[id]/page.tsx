import { getCampaignDetail } from "@/app/(dashboard)/d/_actions/marketing";
import CampaignDetail from "@/components/dashboard/marketing/CampaignDetail";
import { redirect } from "next/navigation";

export default async function MarketerCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCampaignDetail(id);
  if (!data?.success) redirect("/d/marketer");
  return <CampaignDetail initialData={data} campaignId={id} />;
}
