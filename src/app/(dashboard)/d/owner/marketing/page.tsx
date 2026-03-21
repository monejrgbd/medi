import { getCampaignList } from "@/app/(dashboard)/d/_actions/marketing";
import MarketingDashboard from "@/components/dashboard/marketing/MarketingDashboard";

export default async function MarketingPage() {
  const data = await getCampaignList(0);
  return <MarketingDashboard initialData={data} />;
}
