"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  fileName,
}: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled in useEffect
    // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close modal"
      >
        <X className="size-6" />
      </Button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only prevents backdrop close */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: container for image */}
      <div
        className="max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={fileName}
          width={1200}
          height={800}
          className="max-h-[90vh] w-auto rounded-lg object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}
