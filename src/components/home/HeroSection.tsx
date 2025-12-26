interface HeroSectionProps {
  ownerName?: string;
  headline?: string;
  subhead?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
}

export function HeroSection({
  ownerName,
  headline,
  subhead,
}: HeroSectionProps) {
  // Don't render if no owner name
  if (!ownerName) return null;

  // Split name into first and last
  const nameParts = ownerName.trim().split(' ');
  const firstName = nameParts[0] || ownerName;
  const lastName = nameParts.slice(1).join(' ');

  return (
    <section className="flex flex-col gap-6">
      {/* System Status Badge - Subtle dark style */}
      <div className="flex items-center">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-muted/20 text-muted text-xs font-mono uppercase tracking-wider rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-green" />
          SYSTEM ONLINE
        </span>
      </div>

      {/* H1 - Large serif heading */}
      <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.9] tracking-tight text-text">
        <span className="block">{firstName}</span>
        {lastName && <span className="block">{lastName}</span>}
      </h1>

      {/* Optional tagline */}
      {headline && (
        <p className="text-lg md:text-xl text-text/80 font-light -mt-2">
          {headline}
        </p>
      )}

      {/* Decorative line - More visible */}
      <div className="w-8 h-[1px] bg-muted/40 my-2" />

      {/* Subhead */}
      {subhead && (
        <p className="text-muted text-base md:text-lg max-w-[50ch] leading-relaxed">
          {subhead}
        </p>
      )}
    </section>
  );
}
