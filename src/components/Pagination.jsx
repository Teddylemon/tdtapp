export default function Pagination({
  currentPage,
  totalPages,
  totalLabel,
  onChangePage,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30],
  onChangePageSize,
}) {
  return (
    <div className="pagination">
      <div className="pagination-meta">
        <span className="pagination-total">{totalLabel}</span>
        <label className="page-size-select">
          <span>每页</span>
          <select value={pageSize} onChange={(event) => onChangePageSize?.(Number(event.target.value))}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} 条
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-button"
          disabled={currentPage === 1}
          onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        >
          上一页
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <button
              key={pageNumber}
              type="button"
              className={`page-button ${currentPage === pageNumber ? "active" : ""}`}
              onClick={() => onChangePage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        <button
          type="button"
          className="page-button"
          disabled={currentPage === totalPages}
          onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
