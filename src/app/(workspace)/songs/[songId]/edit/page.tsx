import Link from "next/link";
import { notFound } from "next/navigation";
import { SongFormPrototype, type SongFormDraft } from "@/components/song-form-prototype";
import { getBand, getSong, getSongTasks, songs } from "@/lib/mock-data";

export function generateStaticParams() {
  return songs.map((song) => ({ songId: song.id }));
}

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  const song = getSong(songId);
  if (!song) notFound();
  const band = getBand(song.bandId);
  if (!band) notFound();

  const initialValues: SongFormDraft = {
    title: song.title,
    status: song.status,
    bpm: String(song.bpm),
    timeSignature: "4/4",
    musicalKey: song.musicalKey,
    daw: "未設定",
    versionName: song.version,
    versionNote: "",
    description: song.summary,
    parts: getSongTasks(song.id)
      .map((task) => task.part)
      .filter((part, index, parts) => part !== "All" && parts.indexOf(part) === index),
  };

  return (
    <div className="min-w-0">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-subtle" aria-label="パンくず">
        <Link href="/bands" className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-accent">
          バンド
        </Link>
        <span>/</span>
        <Link
          href={`/bands/${band.id}/songs`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-accent"
        >
          {band.name}の楽曲
        </Link>
        <span>/</span>
        <Link
          href={`/songs/${song.id}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-accent"
        >
          {song.title}
        </Link>
        <span>/</span>
        <span className="text-muted">編集</span>
      </nav>

      <header className="mb-6 mt-5">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">Phase 1 / Metadata edit</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">楽曲情報を編集</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          既存のmock情報を初期値として読み込み、変更後のレビュー表示だけを確認できます。元データは変更されません。
        </p>
      </header>

      <SongFormPrototype mode="edit" bandName={band.name} initialValues={initialValues} />
    </div>
  );
}
