interface Props {
  size?: number;
  className?: string;
}

export function LogoSpinner({ size = 40, className = '' }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="Nalaganje"
      role="status"
    >
      <path
        d="M8 16 L22 52 L32 28 L42 52 L56 16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset="0"
        style={{ animation: 'logo-draw 1.4s ease-in-out infinite' }}
      />
      <style>{`
        @keyframes logo-draw {
          0%   { stroke-dashoffset: 100; opacity: 0.3; }
          50%  { stroke-dashoffset: 0;   opacity: 1; }
          100% { stroke-dashoffset: -100; opacity: 0.3; }
        }
      `}</style>
    </svg>
  );
}

export function LogoSpinnerOverlay({ label = 'Nalaganje…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-brand">
      <LogoSpinner size={48} />
      <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
    </div>
  );
}
