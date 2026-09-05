import Link from "next/link";
import { MemberAvatar, TaskStatusBadge } from "@/components/ui";
import { SongCard } from "@/components/song-card";
import {
  bands,
  currentUser,
  getBand,
  getMember,
  getSong,
  songComments,
  songTasks,
  songs,
} from "@/lib/mock-data";

export const metadata = {
  title: "ダッシュボード",
};

export default function DashboardPage() {
  const activeSongs = songs.filter((song) => song.status !== "完成").slice(0, 2);
  const myTasks = songTasks.filter(
    (task) => task.assigneeId === currentUser.id && task.status !== "完了",
  );
  const latestComments = songComments.slice(0, 3);

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1f6f4a]">
            Monday, August 10
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
            おかえりなさい、涼さん。
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#68736d]">
            今日の制作状況と、次に取り組むことを確認しましょう。
          </p>
        </div>
        <Link
          href="/bands/lumen-echo/songs"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#173f31] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#20513f]"
        >
          楽曲一覧を開く
        </Link>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="制作状況の概要">
        {[
          {
            label: "参加バンド",
            value: `${bands.length}`,
            unit: "bands",
            note: "2チームで活動中",
          },
          {
            label: "制作中の楽曲",
            value: `${songs.filter((song) => song.status === "制作中").length}`,
            unit: "songs",
            note: "今週2曲を更新",
          },
          {
            label: "自分のTODO",
            value: `${myTasks.length}`,
            unit: "tasks",
            note: "次の期限 8/11",
          },
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-[22px] border border-[#e4e2db] bg-white p-5 shadow-[0_8px_26px_rgba(38,49,42,0.035)]"
          >
            <p className="text-xs font-bold text-[#77817b]">{stat.label}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold tracking-[-0.05em]">{stat.value}</span>
              <span className="pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b9f9c]">
                {stat.unit}
              </span>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-[#1f6f4a]">{stat.note}</p>
          </article>
        ))}
      </section>

      <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87908b]">
                In progress
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">進行中の楽曲</h2>
            </div>
            <Link
              href="/bands"
              className="inline-flex min-h-11 items-center text-xs font-bold text-[#1f6f4a] hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {activeSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>

          <section className="mt-9 rounded-[26px] border border-[#e4e2db] bg-white p-5 shadow-[0_10px_30px_rgba(38,49,42,0.035)] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87908b]">
                  My tasks
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">今日のTODO</h2>
              </div>
              <span className="rounded-full bg-[#edf5f0] px-3 py-1.5 text-xs font-bold text-[#1f6f4a]">
                {myTasks.length}件
              </span>
            </div>
            <div className="mt-5 divide-y divide-[#eceae4]">
              {myTasks.map((task) => {
                const song = getSong(task.songId);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-[#bdc7c1]"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#28372f]">{task.title}</p>
                      <p className="mt-1 text-[11px] text-[#828a85]">
                        {song?.title} ・ {task.part}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pl-7 sm:pl-0">
                      <TaskStatusBadge status={task.status} />
                      <span className="text-xs font-bold text-[#b26f2b]">{task.dueDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <section className="rounded-[26px] bg-[#173f31] p-6 text-white shadow-[0_18px_44px_rgba(23,63,49,0.14)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a9c9b7]">
              Next session
            </p>
            <h2 className="mt-3 text-xl font-bold">Lumen Echo リハーサル</h2>
            <p className="mt-2 text-sm text-[#c4d7cc]">8月14日（金）19:30</p>
            <div className="mt-6 rounded-2xl bg-white/8 p-4">
              <p className="text-xs font-bold text-[#f3c86b]">確認する曲</p>
              <ul className="mt-3 space-y-2 text-sm text-[#e6efe9]">
                <li>Afterglow / v0.8</li>
                <li>Paper Moon / v1.2</li>
              </ul>
            </div>
          </section>

          <section className="mt-5 rounded-[26px] border border-[#e4e2db] bg-white p-6 shadow-[0_10px_30px_rgba(38,49,42,0.035)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">最近の動き</h2>
              <span className="h-2 w-2 rounded-full bg-[#e5a84b]" aria-label="新着あり" />
            </div>
            <div className="mt-5 space-y-5">
              {latestComments.map((comment) => {
                const author = getMember(comment.authorId);
                const song = getSong(comment.songId);
                const band = song ? getBand(song.bandId) : undefined;
                if (!author || !song) return null;
                return (
                  <article key={comment.id} className="flex gap-3">
                    <MemberAvatar member={author} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs leading-5 text-[#536159]">
                        <span className="font-bold text-[#28372f]">{author.name}</span> が
                        <span className="font-bold text-[#1f6f4a]"> {song.title}</span> にコメント
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#7f8983]">
                        {comment.timestamp && `${comment.timestamp} ・ `}
                        {comment.body}
                      </p>
                      <p className="mt-1 text-[10px] text-[#a0a5a2]">
                        {band?.name} ・ {comment.createdAt}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
