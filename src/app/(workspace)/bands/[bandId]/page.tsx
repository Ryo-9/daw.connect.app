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
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#87908b]" aria-label="パンくず">
        <Link href="/bands" className="hover:text-[#1f6f4a]">バンド</Link>
        <span>/</span>
        <span className="text-[#4d5a53]">{band.name}</span>
      </nav>

      <section
        className="relative mt-5 overflow-hidden rounded-[30px] p-6 text-white shadow-[0_20px_48px_rgba(30,57,44,0.16)] sm:p-8 lg:p-10"
        style={{ backgroundColor: band.accent }}
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
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-[#173f31] shadow-sm hover:bg-[#f4f1e8]"
            >
              楽曲一覧を見る
            </Link>
            <button
              type="button"
              disabled
              aria-describedby="member-invite-note"
              title="未実装：招待は送信されません"
              className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-bold text-white/65"
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
          <div key={stat.label} className="rounded-[20px] border border-[#e3e2db] bg-white p-5">
            <p className="text-[11px] font-bold text-[#818a85]">{stat.label}</p>
            <p className="mt-2 text-xl font-bold tracking-[-0.03em]">{stat.value}</p>
            <p className="mt-2 text-[11px] text-[#1f6f4a]">{stat.note}</p>
          </div>
        ))}
      </section>

      <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
        <section>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87908b]">Songs</p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">最近の楽曲</h2>
            </div>
            <Link
              href={`/bands/${band.id}/songs`}
              className="text-xs font-bold text-[#1f6f4a] hover:underline"
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

        <aside className="rounded-[26px] border border-[#e3e2db] bg-white p-6 shadow-[0_10px_30px_rgba(38,49,42,0.035)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">メンバー</h2>
            <span className="text-xs font-bold text-[#1f6f4a]">{bandMembers.length}人</span>
          </div>
          <div className="mt-5 space-y-4">
            {bandMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <MemberAvatar member={member} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{member.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#818a85]">{member.part}</p>
                </div>
                {member.id === "ryo" && (
                  <span className="rounded-full bg-[#edf5f0] px-2 py-1 text-[10px] font-bold text-[#1f6f4a]">
                    Owner
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[#eceae4] pt-5">
            <p className="text-xs font-bold text-[#5f6b64]">進行中のTODO</p>
            <div className="mt-3 space-y-3">
              {openTasks.slice(0, 3).map((task) => {
                const assignee = getMember(task.assigneeId);
                return (
                  <div key={task.id} className="rounded-xl bg-[#f8f7f3] p-3">
                    <p className="text-xs font-bold leading-5">{task.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#808984]">
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
