import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="mechanical-canvas flex min-h-screen items-center justify-center px-4 py-10 text-ink sm:px-6">
      <section className="instrument-panel w-full max-w-2xl overflow-hidden rounded-2xl border border-line-strong bg-panel/95 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-10">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-6">
          <BrandMark />
          <span
            aria-hidden="true"
            className="font-mono text-xs font-bold tracking-[0.22em] text-subtle"
          >
            ERROR 404
          </span>
        </div>

        <div className="py-10 sm:py-14">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-accent-blue">
            404 / Not found
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            ページが見つかりません
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted sm:text-base">
            URLが変更されたか、このページは現在利用できない可能性があります。
          </p>
          <Link
            href="/"
            className="hardware-key mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-accent-strong px-6 text-sm font-bold text-white shadow-[0_10px_28px_rgba(102,87,232,0.28)] transition hover:-translate-y-0.5 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            ホームへ戻る
          </Link>
        </div>

        <div
          aria-hidden="true"
          className="control-well flex h-3 gap-1.5 rounded border border-line bg-panel-muted p-0.5"
        >
          <span className="w-1/3 rounded-sm bg-accent-strong/80" />
          <span className="w-1/4 rounded-sm bg-accent-blue/65" />
        </div>
      </section>
    </main>
  );
}
