import { useEffect, useState, type ReactNode } from 'react';

/**
 * Full-screen shell for customer-facing public displays (queue panel, KDS,
 * menu boards). Fixed header and footer with a single adaptive content region
 * in between — no manual scrolling, optimized for viewing from a distance.
 *
 * See docs/UI_STANDARDS.md §"Public display screens". Pair with
 * {@link usePageRotation} when there are more items than fit on one screen.
 */
export function PublicDisplayLayout({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ff-public-display">
      <header className="ff-public-display-header">{header}</header>
      <main className="ff-public-display-content">{children}</main>
      {footer && <footer className="ff-public-display-footer">{footer}</footer>}
    </div>
  );
}

/**
 * Auto-rotates through pages of a list for public displays that can't fit all
 * items on screen. Returns the current page slice and paging metadata.
 *
 * @param items     full list to paginate
 * @param pageSize  items per page
 * @param seconds   seconds each page stays visible before advancing
 */
export function usePageRotation<T>(items: T[], pageSize: number, seconds: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const [page, setPage] = useState(0);

  // Keep the page index valid when the list shrinks.
  useEffect(() => {
    if (page >= pageCount) setPage(0);
  }, [page, pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pageCount), seconds * 1000);
    return () => clearInterval(id);
  }, [pageCount, seconds]);

  const start = page * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    page,
    pageCount,
  };
}
