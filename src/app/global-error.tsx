"use client";

import { Inter } from "next/font/google";
import Image from "next/image";
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
          <Image
            src="/toolhive-logo.png"
            alt="ToolHive"
            width={145}
            height={31}
            className="shrink-0 brightness-0 dark:brightness-100"
          />

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
