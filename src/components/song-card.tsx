import Link from "next/link";
import { ProgressBar, SongStatusBadge } from "@/components/ui";
import type { Song } from "@/lib/mock-data";

export function SongCard({ song }: { song: Song }) {
  return (
    <Link
      href={`/songs/${song.id}`}
      className="group block rounded-[24px] border border-[#e5e3dc] bg-white p-5 shadow-[0_10px_32px_rgba(38,49,42,0.045)] transition hover:-translate-y-1 hover:border-[#bfd5c7] hover:shadow-[0_18px_42px_rgba(38,49,42,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f4a] focus-visible:ring-offset-2 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SongStatusBadge status={song.status} />
            <span className="text-[11px] font-semibold text-[#8a918d]">
              {song.version}
            </span>
          </div>
          <h3 className="mt-4 truncate text-xl font-bold tracking-[-0.03em] text-[#17231d] group-hover:text-[#1f6f4a]">
            {song.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#68736d]">
            {song.summary}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e3e5df] bg-[#fafaf7] text-[#466154] transition group-hover:bg-[#173f31] group-hover:text-white">
          →
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-y border-[#eeece6] py-4 text-xs">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9a9f9b]">
            BPM
          </p>
          <p className="mt-1 font-bold text-[#34443b]">{song.bpm}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9a9f9b]">
            KEY
          </p>
          <p className="mt-1 font-bold text-[#34443b]">{song.musicalKey}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9a9f9b]">
            LENGTH
          </p>
          <p className="mt-1 font-bold text-[#34443b]">{song.duration}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
          <span className="text-[#7b847f]">制作進捗</span>
          <span className="text-[#1f6f4a]">{song.progress}%</span>
        </div>
        <ProgressBar value={song.progress} />
      </div>

      <p className="mt-4 text-[11px] font-semibold text-[#8a918d]">
        更新 {song.updatedAt}
      </p>
    </Link>
  );
}
