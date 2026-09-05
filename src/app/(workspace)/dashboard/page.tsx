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
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Monday, August 10
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
            おかえりなさい、涼さん。
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            今日の制作状況と、次に取り組むことを確認しましょう。
          </p>
        </div>
        <Link
          href="/bands/lumen-echo/songs"
          className="hardware-key inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-strong px-5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(102,87,232,0.25)] transition hover:bg-accent-hover"
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
            className="instrument-panel rounded-xl border border-line bg-panel p-5"
          >
            <p className="text-xs font-bold text-muted">{stat.label}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold tracking-[-0.05em]">{stat.value}</span>
              <span className="pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-subtle">
                {stat.unit}
              </span>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-accent-blue">{stat.note}</p>
          </article>
        ))}
      </section>

      <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-subtle">
                In progress
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">進行中の楽曲</h2>
            </div>
            <Link
              href="/bands"
              className="inline-flex min-h-11 items-center text-xs font-bold text-accent hover:text-ink hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {activeSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>

          <section className="instrument-panel mt-9 rounded-xl border border-line bg-panel p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-subtle">
                  My tasks
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">今日のTODO</h2>
              </div>
              <span className="rounded-full border border-accent/25 bg-accent-strong/12 px-3 py-1.5 text-xs font-bold text-accent">
                {myTasks.length}件
              </span>
            </div>
            <div className="mt-5 divide-y divide-line">
              {myTasks.map((task) => {
                const song = getSong(task.songId);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-line-strong"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">{task.title}</p>
                      <p className="mt-1 text-[11px] text-subtle">
                        {song?.title} ・ {task.part}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pl-7 sm:pl-0">
                      <TaskStatusBadge status={task.status} />
                      <span className="font-mono text-xs font-bold text-warning">{task.dueDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <section className="rounded-2xl border border-accent/25 bg-gradient-to-br from-[#201d3b] via-[#171b30] to-[#111827] p-6 text-white shadow-[0_20px_48px_rgba(0,0,0,0.28)]">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              Next session
            </p>
            <h2 className="mt-3 text-xl font-bold">Lumen Echo リハーサル</h2>
            <p className="mt-2 font-mono text-sm text-muted">8月14日（金）19:30</p>
            <div className="control-well mt-6 rounded-lg bg-white/8 p-4">
              <p className="text-xs font-bold text-accent-blue">確認する曲</p>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                <li>Afterglow / v0.8</li>
                <li>Paper Moon / v1.2</li>
              </ul>
            </div>
          </section>

          <section className="instrument-panel mt-5 rounded-xl border border-line bg-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">最近の動き</h2>
              <span className="h-2 w-2 rounded-full bg-accent-blue shadow-[0_0_10px_rgba(90,155,255,0.7)]" aria-label="新着あり" />
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
                      <p className="text-xs leading-5 text-muted">
                        <span className="font-bold text-ink">{author.name}</span> が
                        <span className="font-bold text-accent"> {song.title}</span> にコメント
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">
                        {comment.timestamp && `${comment.timestamp} ・ `}
                        {comment.body}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-subtle">
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
