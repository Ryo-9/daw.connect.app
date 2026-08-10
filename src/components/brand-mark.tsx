import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
};

export function BrandMark({ compact = false, href = "/" }: BrandMarkProps) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-4"
      aria-label="DAW Connect App トップ"
    >
      <span className="flex h-10 w-10 items-end justify-center gap-1 rounded-[14px] bg-[#173f31] px-2.5 py-2 shadow-[0_8px_24px_rgba(23,63,49,0.18)] transition-transform group-hover:-translate-y-0.5">
        <span className="h-3 w-1 rounded-full bg-[#f3c86b]" />
        <span className="h-5 w-1 rounded-full bg-white" />
        <span className="h-4 w-1 rounded-full bg-[#8dc9a8]" />
        <span className="h-6 w-1 rounded-full bg-white" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-[-0.02em] text-[#14231c]">
            DAW Connect
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#718078]">
            make together
          </span>
        </span>
      )}
    </Link>
  );
}
