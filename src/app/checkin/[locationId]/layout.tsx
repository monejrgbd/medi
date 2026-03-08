export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4 py-8">
      {children}
    </div>
  );
}
