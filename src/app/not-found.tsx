import Link from "next/link";

/**
 * Global 404 page — shown when a route or resource cannot be found.
 * Also shown when page components call notFound() from "next/navigation".
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-gray-50">
      <p className="text-xs font-medium text-gray-400 tracking-widest uppercase mb-3">
        404
      </p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
        have access to it.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 transition-colors"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
