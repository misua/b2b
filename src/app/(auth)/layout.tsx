// Auth layout — no sidebar/nav, just centers content
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
