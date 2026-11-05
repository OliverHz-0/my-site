export function DigestSkeleton() {
  return (
    <div className="digest-skeleton" role="status" aria-label="正在加载精选">
      {Array.from({ length: 3 }, (_, i) => (
        <div className="digest-skeleton-item" key={i} aria-hidden="true">
          <div className="digest-bone" style={{ width: "30%" }} />
          <div className="digest-bone digest-bone-title" style={{ width: "72%" }} />
          <div className="digest-bone" style={{ width: "100%" }} />
          <div className="digest-bone" style={{ width: "88%" }} />
        </div>
      ))}
    </div>
  );
}
