import AppLayout from "@/components/layout/AppLayout";

/**
 * Route group layout — applies the authenticated shell (sidebar + main area)
 * to every page under src/app/(app)/.
 * The (app) folder name is invisible to the URL, so /dashboard, /contracts,
 * etc. resolve at the root path level.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
