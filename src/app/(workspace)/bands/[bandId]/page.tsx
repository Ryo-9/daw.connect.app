import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarStack, MemberAvatar, TaskStatusBadge } from "@/components/ui";
import { SongCard } from "@/components/song-card";
import {
  bands,
  getBand,
  getBandMembers,
  getBandSongs,
  getMember,
  songTasks,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return bands.map((band) => ({ bandId: band.id }));
}

export default async function BandDetailPage({
  params,
}: {
  params: Promise<{ bandId: string }>;
}) {
  const { bandId } = await params;
  const band = getBand(bandId);
  if (!band) notFound();

  const bandMembers = getBandMembers(band.id);
  const bandSongs = getBandSongs(band.id);
  const bandSongIds = new Set(bandSongs.map((song) => song.id));
  const openTasks = songTasks.filter(
    (task) => bandSongIds.has(task.songId) && task.status !== "完了",
  );

  return (
    <div>
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-subtle" aria-label="パンくず">
        <Link href="/bands" className="inline-flex min-h-11 items-center hover:text-accent">
          バンド
        </Link>
        <span>/</span>
        <span className="text-muted">{band.name}</span>
      </nav>

      <section
        className="relative mt-5 overflow-hidden rounded-[24px] border border-white/10 p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.32)] sm:p-8 lg:p-10"
        style={{
          background: `linear-gradient(115deg, ${band.accent}, #111827 78%)`,
        }}
      >
        <div className="absolute -right-16 -top-28 h-72 w-72 rounded-full border-[48px] border-white/10" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-80 rotate-6 rounded-[50%] bg-white/5" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              {band.genre} ・ Workspace
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">
              {band.name}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">{band.description}</p>
            <div className="mt-6 flex items-center gap-3">
              <AvatarStack members={bandMembers} />
              <span className="text-xs font-semibold text-white/70">
                {bandMembers.length}人で制作中
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/bands/${band.id}/songs`}
              className="hardware-key inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-[#17152b] shadow-[0_10px_26px_rgba(0,0,0,0.2)] hover:bg-[#eeeaff]"
            >
              楽曲一覧を見る
            </Link>
            <button
              type="button"
              disabled
              aria-describedby="member-invite-note"
              title="未実装：招待は送信されません"
              className="hardware-key inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-bold text-white/65"
            >
              メンバーを招待
            </button>
          </div>
        </div>
        <p
          id="member-invite-note"
          className="relative mt-4 max-w-xl text-[11px] leading-5 text-white/65 lg:ml-auto lg:text-right"
        >
          メンバー招待は未実装です。入力・送信・保存は行われません。
        </p>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="バンド概要">
        {[
          { label: "登録楽曲", value: `${bandSongs.length}曲`, note: "1曲を今週更新" },
          { label: "未完了TODO", value: `${openTasks.length}件`, note: "次の期限 8/11" },
          { label: "最新更新", value: band.updatedAt, note: "Afterglow v0.8" },
        ].map((stat) => (
          <div key={stat.label} className="instrument-panel rounded-xl border border-line bg-panel p-5">
            <p className="text-[11px] font-bold text-muted">{stat.label}</p>
            <p className="mt-2 text-xl font-bold tracking-[-0.03em]">{stat.value}</p>
            <p className="mt-2 text-[11px] text-accent-blue">{stat.note}</p>
          </div>
        ))}
      </section>

      <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
        <section>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-subtle">Songs</p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">最近の楽曲</h2>
            </div>
            <Link
              href={`/bands/${band.id}/songs`}
              className="inline-flex min-h-11 items-center text-xs font-bold text-accent hover:text-ink hover:underline"
            >
              一覧へ →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {bandSongs.slice(0, 2).map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>

        <aside className="instrument-panel rounded-xl border border-line bg-panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">メンバー</h2>
            <span className="text-xs font-bold text-accent-blue">{bandMembers.length}人</span>
          </div>
          <div className="mt-5 space-y-4">
            {bandMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <MemberAvatar member={member} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{member.name}</p>
                  <p className="mt-0.5 text-[11px] text-subtle">{member.part}</p>
                </div>
                {member.id === "ryo" && (
                  <span className="rounded-full border border-accent/25 bg-accent-strong/12 px-2 py-1 text-[10px] font-bold text-accent">
                    Owner
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-xs font-bold text-muted">進行中のTODO</p>
            <div className="mt-3 space-y-3">
              {openTasks.slice(0, 3).map((task) => {
                const assignee = getMember(task.assigneeId);
                return (
                  <div key={task.id} className="control-well rounded-lg border border-line bg-panel-muted p-3">
                    <p className="text-xs font-bold leading-5">{task.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-subtle">
                        {assignee?.name} ・ {task.part}
                      </span>
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
