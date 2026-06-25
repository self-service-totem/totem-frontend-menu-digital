export function SortTh({ label, colKey, sort, onSort }: {
  label: string;
  colKey: string;
  sort: { key: string; dir: 'asc' | 'desc' };
  onSort: (k: string) => void;
}) {
  const active = sort.key === colKey;
  return (
    <th className={`sortable${active ? ' sorted' : ''}`} onClick={() => onSort(colKey)}>
      {label}
      <span className="ff-sort-icon">
        <i className={`bi bi-arrow-${active ? (sort.dir === 'asc' ? 'up' : 'down') : 'down-up'}`} />
      </span>
    </th>
  );
}
