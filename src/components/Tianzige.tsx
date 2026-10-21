/** 田字格 practice square: solid border, dashed centre cross (and diagonals for 米字格). */
export function Tianzige({ children, diagonals = false, className = "" }: { children?: React.ReactNode; diagonals?: boolean; className?: string }) {
  return (
    <div className={`relative aspect-square max-w-full border-2 border-grid bg-surface ${className}`}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="var(--grid)" strokeWidth="0.6" strokeDasharray="3 3" vectorEffect="non-scaling-stroke">
          <line x1="50" y1="0" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
          {diagonals && (
            <>
              <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
              <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </g>
      </svg>
      {children}
    </div>
  );
}
