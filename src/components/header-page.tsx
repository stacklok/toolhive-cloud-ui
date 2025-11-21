import type React from "react";

export function HeaderPage({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="w-full bg-background">
      <div className="container mx-auto flex items-center justify-between py-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
