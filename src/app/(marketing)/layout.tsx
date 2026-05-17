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
      {/* No-JS / JS-failure fallback: scroll-reveal hides everything via
          .fade-in-view (opacity:0) until JS adds .visible. Without this,
          a failed/blocked JS load = blank marketing page. <noscript> is
          fully inert when JavaScript is enabled, so this is zero-risk for
          the normal path and only rescues the otherwise-blank no-JS case. */}
      <noscript>
        <style>{`.fade-in-view{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <FadeObserver />
      <ScrollTo />
      <Navbar />
      {children}
    </>
  );
}
