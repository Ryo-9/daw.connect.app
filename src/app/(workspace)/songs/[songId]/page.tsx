import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MockCommentComposer,
  TaskChecklist,
} from "@/components/song-detail-interactions";
import {
  MemberAvatar,
  ProgressBar,
  SongStatusBadge,
} from "@/components/ui";
import {
  currentUser,
  getBand,
  getMember,
  getSong,
  getSongComments,
  getSongFiles,
  getSongTasks,
  members,
  songs,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return songs.map((song) => ({ songId: song.id }));
}

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  const song = getSong(songId);
  if (!song) notFound();
  const band = getBand(song.bandId);
  if (!band) notFound();

  const tasks = getSongTasks(song.id);
  const comments = getSongComments(song.id);
  const files = getSongFiles(song.id);

  return (
    <div>
      <nav
        className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#87908b]"
        aria-label="パンくず"
      >
        <Link href="/bands" className="hover:text-[#1f6f4a]">
          バンド
        </Link>
        <span>/</span>
        <Link href={`/bands/${band.id}`} className="hover:text-[#1f6f4a]">
          {band.name}
        </Link>
        <span>/</span>
        <Link href={`/bands/${band.id}/songs`} className="hover:text-[#1f6f4a]">
          楽曲
        </Link>
        <span>/</span>
        <span className="text-[#4d5a53]">{song.title}</span>
      </nav>

      <section className="mt-5 overflow-hidden rounded-[30px] border border-[#dfe2dc] bg-white shadow-[0_18px_46px_rgba(38,49,42,0.06)]">
        <div className="relative bg-[#173f31] p-6 text-white sm:p-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SongStatusBadge status={song.status} />
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-[#c4d7cc]">
                  {song.version}
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">
                {song.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c4d7cc]">
                {song.summary}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[340px]">
              {[
                { label: "BPM", value: song.bpm },
                { label: "KEY", value: song.musicalKey },
                { label: "LENGTH", value: song.duration },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/8 p-3 text-center sm:p-4">
                  <p className="text-[9px] font-bold tracking-[0.14em] text-[#9fb9aa]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 sm:max-w-xl">
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#77817b]">制作進捗</span>
                <span className="text-[#1f6f4a]">{song.progress}%</span>
              </div>
              <ProgressBar value={song.progress} />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#f5f3ed] px-3 py-2 text-[11px] font-bold text-[#5c6861]">
                次: {song.nextMilestone}
              </span>
              <span className="rounded-full bg-[#edf5f0] px-3 py-2 text-[11px] font-bold text-[#1f6f4a]">
                更新 {song.updatedAt}
              </span>
            </div>
          </div>
        </div>
      </section>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="楽曲詳細セクション">
        {[
          { href: "#memo", label: "メモ" },
          { href: "#tasks", label: `TODO ${tasks.length}` },
          { href: "#comments", label: `コメント ${comments.length}` },
          { href: "#files", label: `ファイル ${files.length}` },
        ].map((item, index) => (
          <a
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${
              index === 0
                ? "border-[#173f31] bg-[#173f31] text-white"
                : "border-[#deded7] bg-white text-[#66716b]"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
        <div className="space-y-5">
          <section
            id="memo"
            className="scroll-mt-32 rounded-[26px] border border-[#e3e2db] bg-white p-5 shadow-[0_10px_30px_rgba(38,49,42,0.035)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87908b]">
                  Song memo
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">楽曲メモ</h2>
              </div>
              <button
                type="button"
                disabled
                aria-describedby="memo-edit-note"
                title="未実装：メモは編集・保存できません"
                className="cursor-not-allowed rounded-full border border-[#deded7] px-3 py-2 text-[11px] font-bold text-[#999f9b]"
              >
                編集
              </button>
            </div>
            <p id="memo-edit-note" className="mt-3 text-[11px] leading-5 text-[#8a928d]">
              編集は未実装です。この画面では保存されているメモの見た目だけを確認できます。
            </p>

            <div className="mt-6 space-y-6">
              {[
                { label: "Direction / 曲の方向性", value: song.notes.direction },
                { label: "Arrangement / アレンジ", value: song.notes.arrangement },
                { label: "Recording / 録音メモ", value: song.notes.recording },
              ].map((note) => (
                <div key={note.label} className="border-l-2 border-[#bed6c6] pl-4 sm:pl-5">
                  <h3 className="text-xs font-bold text-[#1f6f4a]">{note.label}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#536159]">{note.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 border-t border-[#eceae4] pt-4 text-[10px] text-[#929995]">
              最終更新: 涼 ・ {song.updatedAt}（モック表示）
            </p>
          </section>

          <section
            id="tasks"
            className="scroll-mt-32 rounded-[26px] border border-[#e3e2db] bg-white p-5 shadow-[0_10px_30px_rgba(38,49,42,0.035)] sm:p-7"
          >
            <TaskChecklist tasks={tasks} members={members} />
          </section>
        </div>

        <div className="space-y-5">
          <section
            id="comments"
            className="scroll-mt-32 rounded-[26px] border border-[#e3e2db] bg-white p-5 shadow-[0_10px_30px_rgba(38,49,42,0.035)] sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87908b]">
                  Feedback
                </p>
                <h2 className="mt-2 text-lg font-bold">コメント</h2>
              </div>
              <span className="text-xs font-bold text-[#1f6f4a]">{comments.length}件</span>
            </div>

            <div className="mt-5 space-y-5">
              {comments.map((comment) => {
                const author = getMember(comment.authorId);
                if (!author) return null;
                return (
                  <article key={comment.id} className="flex gap-3">
                    <MemberAvatar member={author} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold">{author.name}</p>
                        <span className="text-[10px] text-[#969c98]">{comment.createdAt}</span>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-[#56635c]">
                        {comment.timestamp && (
                          <span className="mr-1.5 inline-flex rounded-md bg-[#e9f4ed] px-2 py-0.5 font-bold text-[#1f6f4a]">
                            ▶ {comment.timestamp}
                          </span>
                        )}
                        {comment.body}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <MockCommentComposer currentUser={currentUser} />
          </section>

          <section
            id="files"
            className="scroll-mt-32 rounded-[26px] border border-[#e3e2db] bg-white p-5 shadow-[0_10px_30px_rgba(38,49,42,0.035)] sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87908b]">
                  Files & versions
                </p>
                <h2 className="mt-2 text-lg font-bold">共有ファイル</h2>
              </div>
              <span className="rounded-full bg-[#fff2dc] px-2.5 py-1 text-[10px] font-bold text-[#96611e]">
                表示のみ
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {files.map((file) => {
                const uploader = getMember(file.uploadedBy);
                return (
                  <article
                    key={file.id}
                    className="rounded-2xl border border-[#e8e6e0] bg-[#fbfaf7] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ed] text-xs font-bold text-[#1f6f4a]">
                        {file.kind === "Audio" ? "WAV" : file.kind === "MIDI" ? "MID" : "REF"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#334139]">{file.name}</p>
                        <p className="mt-1 text-[10px] text-[#8b928e]">
                          {file.size} ・ {file.version} ・ {uploader?.name}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a0a5a2]">{file.updatedAt}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-[#cdd3ce] bg-[#faf9f6] p-5 text-center">
              <button
                type="button"
                disabled
                aria-describedby="file-upload-note"
                title="未実装：ファイルは選択・アップロードできません"
                className="min-h-11 cursor-not-allowed rounded-full border border-[#d7dcd7] bg-white px-4 text-xs font-bold text-[#89918c]"
              >
                ＋ ファイルを追加
              </button>
              <p id="file-upload-note" className="mt-2 text-[10px] leading-5 text-[#8a928d]">
                アップロード・保存・ダウンロードは未実装です
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
