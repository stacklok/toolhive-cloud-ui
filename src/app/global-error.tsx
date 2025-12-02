"use client";

import { Inter } from "next/font/google";
import { ToolHiveIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

interface GlobalErrorProps {
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <div className="flex items-center gap-2">
            <ToolHiveIcon className="size-8 shrink-0" />
            <span className="text-3xl font-bold tracking-tight">ToolHive</span>
          </div>

          <h1 className="text-xl text-muted-foreground">
            Something went wrong
          </h1>

          <Button onClick={reset} variant="default">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
