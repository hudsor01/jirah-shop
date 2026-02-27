import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
};

function buildHref(
  baseUrl: string,
  page: number,
  searchParams?: Record<string, string>
): string {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "page" && value) {
        params.set(key, value);
      }
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

/**
 * Compute which page numbers to show (max 5 with ellipsis).
 */
function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  // Always show first page
  pages.push(1);

  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }

  // Pages around current
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-end");
  }

  // Always show last page
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return pages;
}

export function PaginationControls({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <Link href={buildHref(baseUrl, currentPage - 1, searchParams)} passHref legacyBehavior>
              <PaginationPrevious />
            </Link>
          </PaginationItem>
        )}

        {pageNumbers.map((item) => {
          if (item === "ellipsis-start" || item === "ellipsis-end") {
            return (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={item}>
              <Link href={buildHref(baseUrl, item, searchParams)} passHref legacyBehavior>
                <PaginationLink isActive={item === currentPage}>
                  {item}
                </PaginationLink>
              </Link>
            </PaginationItem>
          );
        })}

        {currentPage < totalPages && (
          <PaginationItem>
            <Link href={buildHref(baseUrl, currentPage + 1, searchParams)} passHref legacyBehavior>
              <PaginationNext />
            </Link>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
