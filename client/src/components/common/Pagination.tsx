import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  className 
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Create array of page numbers to be displayed
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  if (totalPages <= maxPagesToShow) {
    // If we have fewer pages than the max we want to show, just display all
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Always include the first page
    pageNumbers.push(1);
    
    // Calculate a range of pages around current
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're close to start or end
    if (currentPage <= 2) {
      endPage = 4;
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }
    
    // Add ellipsis before range if needed
    if (startPage > 2) {
      pageNumbers.push(-1); // -1 represents ellipsis
    }
    
    // Add the range
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis after range if needed
    if (endPage < totalPages - 1) {
      pageNumbers.push(-2); // -2 represents ellipsis to distinguish from the first one
    }
    
    // Always include the last page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
  }

  return (
    <div className={cn("mt-6 flex items-center justify-between", className)}>
      <div className="hidden sm:flex items-center">
        <p className="text-sm text-neutral-700">
          Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalItems}</span> results
        </p>
      </div>
      <div className="flex justify-center sm:justify-end">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium",
              currentPage === 1 
                ? "text-neutral-300 cursor-not-allowed" 
                : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {pageNumbers.map((page, index) => {
            if (page < 0) {
              return (
                <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 border border-neutral-300 bg-white text-sm font-medium text-neutral-500">
                  ...
                </span>
              );
            }
            
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                  page === currentPage
                    ? "border-primary-500 bg-primary-50 text-primary-600"
                    : "border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50"
                )}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              "relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium",
              currentPage === totalPages 
                ? "text-neutral-300 cursor-not-allowed" 
                : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );
}
