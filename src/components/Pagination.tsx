import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        ← Previous
      </button>
      <span className="page-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next →
      </button>
    </div>
  );
}
