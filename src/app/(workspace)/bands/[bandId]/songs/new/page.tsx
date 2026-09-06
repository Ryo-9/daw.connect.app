import Link from "next/link";
import { notFound } from "next/navigation";
import { SongFormPrototype, type SongFormDraft } from "@/components/song-form-prototype";
import { bands, getBand } from "@/lib/mock-data";

export function generateStaticParams() {
  return bands.map((band) => ({ bandId: band.id }));
}

export default async function NewSongPage({
  params,
}: {
  params: Promise<{ bandId: string }>;
}) {
  const { bandId } = await params;
  const band = getBand(bandId);
  if (!band) notFound();

  const initialValues: SongFormDraft = {
    title: "",
    status: "アイデア",
    bpm: "120",
    timeSignature: "4/4",
    musicalKey: "C major",
    daw: "未設定",
    versionName: "v0.1",
    versionNote: "",
    description: "",
    parts: [],
  };

  return (
    <div className="min-w-0">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-subtle" aria-label="パンくず">
        <Link href="/bands" className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-accent">
          バンド
        </Link>
        <span>/</span>
        <Link
          href={`/bands/${band.id}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-accent"
        >
          {band.name}
        </Link>
        <span>/</span>
        <Link
          href={`/bands/${band.id}/songs`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-accent"
        >
          楽曲
        </Link>
        <span>/</span>
        <span className="text-muted">新規作成</span>
      </nav>

      <header className="mb-6 mt-5">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">Phase 1 / Song setup</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">新しい楽曲を作成</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          制作開始時に必要な基本情報と初期バージョンを組み立て、レビュー表示を確認する非保存プロトタイプです。
        </p>
      </header>

      <SongFormPrototype mode="create" bandName={band.name} initialValues={initialValues} />
    </div>
  );
}
