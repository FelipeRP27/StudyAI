function Skeleton({ width = '100%', height = '1em', radius, className = '' }) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };
  if (radius !== undefined) {
    style.borderRadius = typeof radius === 'number' ? `${radius}px` : radius;
  }
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="skeleton-text" aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          height="0.85rem"
          width={idx === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3, lines = 2 }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: items }).map((_, idx) => (
        <div key={idx} className="skeleton-list-item">
          <div className="skeleton-list-item-text">
            <Skeleton height="1rem" width="55%" />
            <Skeleton height="0.8rem" width="85%" />
            {lines > 2 ? <Skeleton height="0.8rem" width="40%" /> : null}
          </div>
          <Skeleton width={18} height={18} radius="50%" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
