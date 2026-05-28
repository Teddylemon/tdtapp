export default function ListShell({ className = "", actions, searchBar, filters, filterActions, children, footer }) {
  const hasFilters = filters || filterActions;

  return (
    <article className={`panel list-shell ${className}`.trim()}>
      <div className="list-shell-top">
        <div className="list-shell-search search-slot">{searchBar}</div>
        <div className="shell-actions">{actions}</div>
      </div>
      {hasFilters ? (
        <div className="list-shell-filters">
          <div className="filter-cluster">{filters}</div>
          <div className="filter-actions">{filterActions}</div>
        </div>
      ) : null}
      <div className="list-shell-body">{children}</div>
      <div className="list-shell-footer">{footer}</div>
    </article>
  );
}
