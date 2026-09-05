import Link from "next/link";
import { ProgressBar, SongStatusBadge } from "@/components/ui";
import type { Song } from "@/lib/mock-data";

export function SongCard({ song }: { song: Song }) {
  return (
    <Link
      href={`/songs/${song.id}`}
      className="group block rounded-2xl border border-line bg-panel p-5 shadow-[0_14px_34px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-accent/55 hover:bg-panel-raised hover:shadow-[0_22px_48px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SongStatusBadge status={song.status} />
            <span className="font-mono text-[11px] font-semibold text-subtle">
              {song.version}
            </span>
          </div>
          <h3 className="mt-4 truncate text-xl font-bold tracking-[-0.03em] text-ink group-hover:text-accent">
            {song.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
            {song.summary}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-panel-muted text-accent-blue transition group-hover:border-accent/50 group-hover:bg-accent-strong group-hover:text-white">
          →
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-y border-line py-4 text-xs">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-subtle">
            BPM
          </p>
          <p className="mt-1 font-bold text-ink">{song.bpm}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-subtle">
            KEY
          </p>
          <p className="mt-1 font-bold text-ink">{song.musicalKey}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-subtle">
            LENGTH
          </p>
          <p className="mt-1 font-bold text-ink">{song.duration}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
          <span className="text-muted">制作進捗</span>
          <span className="font-mono text-accent-blue">{song.progress}%</span>
        </div>
        <ProgressBar value={song.progress} />
      </div>

      <p className="mt-4 text-[11px] font-semibold text-subtle">
        更新 {song.updatedAt}
      </p>
    </Link>
  );
}
