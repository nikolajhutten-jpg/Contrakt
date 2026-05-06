/**
 * Standalone layout for the setup wizard.
 * Deliberately excludes AppLayout so no sidebar is rendered.
 * Clerk auth is enforced by the middleware; the page itself does
 * its own session + role checks.
 */
export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
