"use client";

import { ChevronFirst, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATALOG_PAGE_SIZE_OPTIONS } from "../constants";

interface CatalogPaginationProps {
  isFirstPage: boolean;
  nextCursor: string | undefined;
  limit: number;
  pageNumber: number;
  onFirstPage: () => void;
  onPrev: () => void;
  onNext: (nextCursor: string) => void;
  onLimitChange: (limit: number) => void;
}

export function CatalogPagination({
  isFirstPage,
  nextCursor,
  limit,
  pageNumber,
  onFirstPage,
  onPrev,
  onNext,
  onLimitChange,
}: CatalogPaginationProps) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
      <div />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          onClick={onFirstPage}
          disabled={isFirstPage}
          size="sm"
          aria-label="First page"
          className="cursor-pointer"
        >
          <ChevronFirst className="size-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={isFirstPage}
          size="sm"
          aria-label="Previous page"
          className="cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-3 text-sm font-medium">Page {pageNumber}</span>
        <Button
          variant="ghost"
          onClick={() => nextCursor && onNext(nextCursor)}
          disabled={!nextCursor}
          size="sm"
          aria-label="Next page"
          className="cursor-pointer"
        >
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
            {CATALOG_PAGE_SIZE_OPTIONS.map((option) => (
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
