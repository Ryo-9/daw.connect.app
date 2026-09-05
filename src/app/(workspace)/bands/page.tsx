import Link from "next/link";
import { AvatarStack, SongStatusBadge } from "@/components/ui";
import { bands, getBandMembers, getBandSongs } from "@/lib/mock-data";

export const metadata = {
  title: "バンド一覧",
};

export default function BandsPage() {
  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Your workspaces
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">バンド一覧</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            バンドごとに楽曲、メンバー、制作の進み具合をまとめます。
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-describedby="band-create-note"
          className="hardware-key inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-line-strong bg-panel px-5 text-sm font-bold text-subtle"
          title="未実装：バンドは作成・保存されません"
        >
          ＋ バンドを作成
        </button>
      </header>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {bands.map((band, index) => {
          const bandMembers = getBandMembers(band.id);
          const bandSongs = getBandSongs(band.id);
          const activeCount = bandSongs.filter((song) => song.status !== "完成").length;
          return (
            <article
              key={band.id}
              className="instrument-panel group overflow-hidden rounded-xl border border-line bg-panel transition hover:border-accent/45"
            >
              <div
                className="relative h-28 overflow-hidden border-b border-white/10 p-5 sm:h-32 sm:p-6"
                style={{
                  background: `linear-gradient(115deg, ${band.accent}, #111827 82%)`,
                }}
              >
                <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full border-[32px] border-white/10" />
                <div className="absolute bottom-0 left-1/3 h-20 w-36 rotate-12 rounded-t-full bg-white/5" />
                <div className="relative flex items-start justify-between">
                  <span className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">
                    {band.genre}
                  </span>
                  <span className="text-4xl font-bold text-white/15">0{index + 1}</span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-[-0.04em]">{band.name}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                      {band.description}
                    </p>
                  </div>
                  <Link
                    href={`/bands/${band.id}`}
                    className="hardware-key flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-panel-muted text-accent-blue transition group-hover:border-accent/50 group-hover:bg-accent-strong group-hover:text-white"
                    aria-label={`${band.name}を開く`}
                  >
                    →
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                  <div className="flex items-center gap-3">
                    <AvatarStack members={bandMembers} />
                    <span className="text-xs font-semibold text-muted">
                      {bandMembers.length} members
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-bold text-accent-blue">{activeCount}曲 制作中</span>
                    <span className="text-subtle">更新 {band.updatedAt}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {bandSongs.slice(0, 3).map((song) => (
                    <Link
                      key={song.id}
                      href={`/songs/${song.id}`}
                      className="hardware-key inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-panel-muted py-1.5 pl-3 pr-2 text-xs font-bold text-muted transition hover:border-accent/50 hover:text-ink"
                    >
                      {song.title}
                      <SongStatusBadge status={song.status} />
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="control-well mt-6 rounded-xl border border-dashed border-line-strong bg-panel/55 p-6 text-center sm:p-8">
        <p className="text-sm font-bold">新しいバンドワークスペース</p>
        <p id="band-create-note" className="mx-auto mt-2 max-w-xl text-xs leading-6 text-muted">
          作成フォーム、招待、権限設定は今後の専用タスクで実装します。この画面では導線のみ確認できます。
        </p>
      </section>
    </div>
  );
}
