export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle with gradient */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#gradient)"
        strokeWidth="3"
        fill="none"
      />
      
      {/* Vinyl record grooves */}
      <circle cx="50" cy="50" r="35" stroke="url(#gradient)" strokeWidth="1" opacity="0.6" fill="none" />
      <circle cx="50" cy="50" r="28" stroke="url(#gradient)" strokeWidth="1" opacity="0.4" fill="none" />
      
      {/* Center circle (record label) */}
      <circle cx="50" cy="50" r="18" fill="url(#gradient)" />
      
      {/* Music note */}
      <g transform="translate(42, 35)">
        <ellipse cx="7" cy="20" rx="5" ry="3" fill="white" />
        <rect x="10" y="8" width="2.5" height="15" rx="1" fill="white" />
        <path d="M 10 8 Q 18 6 18 12 L 18 18" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className="h-8 w-8" />
      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
        MusicBoxd
      </span>
    </div>
  );
}
