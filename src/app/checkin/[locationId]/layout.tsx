export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Prevent iOS Safari auto-zoom on input focus (requires font-size >= 16px) */}
      <style>{`
        @supports (-webkit-touch-callout: none) {
          input, textarea, select { font-size: max(16px, 1em) !important; }
        }
      `}</style>
      <div className="flex min-h-screen items-center justify-center bg-snow px-4 py-8">
        {children}
      </div>
    </>
  );
}
