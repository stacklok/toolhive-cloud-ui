export default function VMCPBuilderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Standalone layout without sidebar for the builder
  return <>{children}</>;
}
