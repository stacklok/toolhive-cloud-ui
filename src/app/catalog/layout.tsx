import { Navbar } from "@/components/navbar";

export default async function CatalogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex flex-col flex-1 overflow-hidden px-4 py-5">
        {children}
      </main>
    </div>
  );
}
