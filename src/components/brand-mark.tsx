import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
};

export function BrandMark({ compact = false, href = "/" }: BrandMarkProps) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
      aria-label="DAW Connect App トップ"
    >
      <span className="flex h-10 w-10 items-end justify-center gap-1 rounded-xl border border-white/10 bg-gradient-to-br from-accent-strong to-[#326fc9] px-2.5 py-2 shadow-[0_10px_28px_rgba(102,87,232,0.3)] transition-transform group-hover:-translate-y-0.5">
        <span className="h-3 w-1 rounded-full bg-[#9ee7ff]" />
        <span className="h-5 w-1 rounded-full bg-white" />
        <span className="h-4 w-1 rounded-full bg-[#c4b5fd]" />
        <span className="h-6 w-1 rounded-full bg-white" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-[-0.02em] text-ink">
            DAW Connect
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-subtle">
            make together
          </span>
        </span>
      )}
    </Link>
  );
}
