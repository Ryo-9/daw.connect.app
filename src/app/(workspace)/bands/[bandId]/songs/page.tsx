import Link from "next/link";
import { notFound } from "next/navigation";
import { SongFilterPanel } from "@/components/song-filter-panel";
import { bands, getBand, getBandSongs } from "@/lib/mock-data";

export function generateStaticParams() {
  return bands.map((band) => ({ bandId: band.id }));
}

export default async function BandSongsPage({
  params,
}: {
  params: Promise<{ bandId: string }>;
}) {
  const { bandId } = await params;
  const band = getBand(bandId);
  if (!band) notFound();
  const bandSongs = getBandSongs(band.id);

  return (
    <div>
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#87908b]" aria-label="パンくず">
        <Link href="/bands" className="inline-flex min-h-11 items-center hover:text-[#1f6f4a]">
          バンド
        </Link>
        <span>/</span>
        <Link
          href={`/bands/${band.id}`}
          className="inline-flex min-h-11 items-center hover:text-[#1f6f4a]"
        >
          {band.name}
        </Link>
        <span>/</span>
        <span className="text-[#4d5a53]">楽曲</span>
      </nav>

      <header className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1f6f4a]">
            {band.name} / Songs
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">楽曲一覧</h1>
          <p className="mt-3 text-sm leading-6 text-[#68736d]">
            曲ごとの進捗、基本情報、次の確認事項を一覧で把握できます。
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-describedby="song-create-note"
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full border border-[#d9d8d1] bg-white px-5 text-sm font-bold text-[#9a9f9c]"
          title="未実装：楽曲は作成・保存されません"
        >
          ＋ 楽曲を作成
        </button>
      </header>

      <SongFilterPanel songs={bandSongs} />
      <p id="song-create-note" className="sr-only">
        楽曲作成は未実装です。このプロトタイプではデータを保存できません。
      </p>
    </div>
  );
}
