import { Toaster } from "sonner";

export const metadata = { title: "Hilt Health — Live Demo" };

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
