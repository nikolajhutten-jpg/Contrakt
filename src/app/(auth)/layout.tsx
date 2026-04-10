/**
 * Minimal layout for public authentication pages (sign-up, email verification).
 * No sidebar — content is centred on the page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded p-8">
        <div className="mb-6">
          <span className="text-lg font-medium text-gray-900">Contrakt</span>
        </div>
        {children}
      </div>
    </div>
  );
}
