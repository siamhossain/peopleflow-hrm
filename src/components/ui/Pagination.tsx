import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  getPageHref?: (page: number) => string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  getPageHref,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 && totalRecords <= pageSize) {
    return null;
  }

  const firstRecord =
    totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecord = Math.min(currentPage * pageSize, totalRecords);

  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  const renderPageItem = (page: number | "ellipsis", index: number) => {
    if (page === "ellipsis") {
      return (
        <span
          key={`ellipsis-${index}`}
          className="inline-flex h-8 w-8 items-center justify-center text-xs text-slate-400 select-none"
        >
          …
        </span>
      );
    }

    const isActive = page === currentPage;
    const baseClasses =
      "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors select-none";

    const stateClasses = isActive
      ? "bg-indigo-600 text-white shadow-xs font-semibold"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

    if (getPageHref) {
      return (
        <a
          key={page}
          href={getPageHref(page)}
          className={`${baseClasses} ${stateClasses}`}
          aria-current={isActive ? "page" : undefined}
        >
          {page}
        </a>
      );
    }

    return (
      <button
        key={page}
        type="button"
        onClick={() => onPageChange?.(page)}
        disabled={isActive}
        className={`${baseClasses} ${stateClasses}`}
        aria-current={isActive ? "page" : undefined}
      >
        {page}
      </button>
    );
  };

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div
      className={`flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:px-6 ${className}`}
    >
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="font-medium text-slate-900">{firstRecord}</span> to{" "}
        <span className="font-medium text-slate-900">{lastRecord}</span> of{" "}
        <span className="font-medium text-slate-900">{totalRecords}</span>{" "}
        results
      </p>

      <div className="flex items-center gap-1">
        {getPageHref ? (
          <a
            href={!isPrevDisabled ? getPageHref(currentPage - 1) : undefined}
            aria-disabled={isPrevDisabled}
            aria-label="Previous page"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors ${
              isPrevDisabled
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={isPrevDisabled}
            aria-label="Previous page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-1">{pages.map(renderPageItem)}</div>

        {getPageHref ? (
          <a
            href={!isNextDisabled ? getPageHref(currentPage + 1) : undefined}
            aria-disabled={isNextDisabled}
            aria-label="Next page"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors ${
              isNextDisabled
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={isNextDisabled}
            aria-label="Next page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
