export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="text-2xl font-bold text-hilt-blue tracking-tight">
            Hilt Health
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
