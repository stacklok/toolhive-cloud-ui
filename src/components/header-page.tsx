import type React from "react";

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="w-full">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4 pb-5">
        <h1 className="text-page-title">{title}</h1>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
