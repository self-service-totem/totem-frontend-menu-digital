// Placeholder shimmer shown while the menu loads — perceived as faster than a spinner.
export function MenuSkeleton() {
  return (
    <div className="ff-menu-skeleton" aria-hidden>
      <div className="ff-skel ff-skel__catbar">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="ff-skel__cat">
            <div className="ff-skel__circle" />
            <div className="ff-skel__pill ff-skel__pill--xs" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="ff-skel__section">
          <div className="ff-skel__banner" />
          {Array.from({ length: 3 }).map((_, r) => (
            <div key={r} className="ff-skel__row">
              <div className="ff-skel__lines">
                <div className="ff-skel__pill ff-skel__pill--lg" />
                <div className="ff-skel__pill ff-skel__pill--md" />
                <div className="ff-skel__pill ff-skel__pill--sm" />
              </div>
              <div className="ff-skel__thumb" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
