import Navbar from "@/components/Navbar";
import FadeObserver from "@/components/FadeObserver";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FadeObserver />
      <Navbar />
      {children}
    </>
  );
}
