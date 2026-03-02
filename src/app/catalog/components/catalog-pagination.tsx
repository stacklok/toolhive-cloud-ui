"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LIMIT_OPTIONS = [12, 24, 48] as const;

interface CatalogPaginationProps {
  isFirstPage: boolean;
  nextCursor: string | undefined;
  limit: number;
  onPrev: () => void;
  onNext: (nextCursor: string) => void;
  onLimitChange: (limit: number) => void;
}

export function CatalogPagination({
  isFirstPage,
  nextCursor,
  limit,
  onPrev,
  onNext,
  onLimitChange,
}: CatalogPaginationProps) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
      <div />
      <div className="flex gap-6">
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={isFirstPage}
          size="sm"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          onClick={() => nextCursor && onNext(nextCursor)}
          disabled={!nextCursor}
          size="sm"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Items per page</span>
        <Select
          value={String(limit)}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
