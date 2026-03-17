import Navbar from "@/components/Navbar";
import FadeObserver from "@/components/FadeObserver";
import ScrollTo from "@/components/marketing/ScrollTo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FadeObserver />
      <ScrollTo />
      <Navbar />
      {children}
    </>
  );
}
