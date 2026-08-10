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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1f6f4a]">
            Your workspaces
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">バンド一覧</h1>
          <p className="mt-3 text-sm leading-6 text-[#68736d]">
            バンドごとに楽曲、メンバー、制作の進み具合をまとめます。
          </p>
        </div>
        <button
          type="button"
          disabled
          aria-describedby="band-create-note"
          className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full border border-[#d9d8d1] bg-white px-5 text-sm font-bold text-[#9a9f9c]"
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
              className="group overflow-hidden rounded-[28px] border border-[#e2e1da] bg-white shadow-[0_12px_34px_rgba(38,49,42,0.045)]"
            >
              <div
                className="relative h-28 overflow-hidden p-5 sm:h-32 sm:p-6"
                style={{ backgroundColor: band.accent }}
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
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#68736d]">
                      {band.description}
                    </p>
                  </div>
                  <Link
                    href={`/bands/${band.id}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e2e4de] bg-[#fafaf7] text-[#426052] transition group-hover:bg-[#173f31] group-hover:text-white"
                    aria-label={`${band.name}を開く`}
                  >
                    →
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#eceae4] pt-5">
                  <div className="flex items-center gap-3">
                    <AvatarStack members={bandMembers} />
                    <span className="text-xs font-semibold text-[#77817b]">
                      {bandMembers.length} members
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-bold text-[#1f6f4a]">{activeCount}曲 制作中</span>
                    <span className="text-[#959b97]">更新 {band.updatedAt}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {bandSongs.slice(0, 3).map((song) => (
                    <Link
                      key={song.id}
                      href={`/songs/${song.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#e4e3dc] bg-[#fbfaf7] py-1.5 pl-3 pr-2 text-xs font-bold text-[#435249] hover:border-[#bcd0c2]"
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

      <section className="mt-6 rounded-[24px] border border-dashed border-[#cfd4ce] bg-white/55 p-6 text-center sm:p-8">
        <p className="text-sm font-bold">新しいバンドワークスペース</p>
        <p id="band-create-note" className="mx-auto mt-2 max-w-xl text-xs leading-6 text-[#78827c]">
          作成フォーム、招待、権限設定は今後の専用タスクで実装します。この画面では導線のみ確認できます。
        </p>
      </section>
    </div>
  );
}
