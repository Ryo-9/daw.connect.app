"use client";

import { FormEvent, useState } from "react";
import { MemberAvatar, PrototypeBadge, TaskStatusBadge } from "@/components/ui";
import type { Member, SongTask, TaskStatus } from "@/lib/mock-data";

export function TaskChecklist({
  tasks,
  members,
}: {
  tasks: SongTask[];
  members: Member[];
}) {
  const [completedById, setCompletedById] = useState<Record<string, boolean>>(
    Object.fromEntries(tasks.map((task) => [task.id, task.status === "完了"])),
  );

  const incompleteCount = tasks.filter((task) => !completedById[task.id]).length;

  const toggleTask = (taskId: string) => {
    setCompletedById((current) => ({
      ...current,
      [taskId]: !current[taskId],
    }));
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#87908b]">
            Part tasks
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">パート別TODO</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrototypeBadge />
          <span
            className="rounded-full bg-[#f3f1eb] px-3 py-1.5 text-xs font-bold text-[#68736d]"
            aria-live="polite"
          >
            {incompleteCount}件 未完了
          </span>
        </div>
      </div>

      <p id="mock-task-help" className="mt-4 text-xs leading-6 text-[#78827c]">
        チェックすると見た目だけ切り替わります。変更は保存されず、リロードで元に戻ります。
      </p>

      <div className="mt-5 divide-y divide-[#eceae4]">
        {tasks.map((task) => {
          const assignee = members.find((member) => member.id === task.assigneeId);
          if (!assignee) return null;

          const isCompleted = completedById[task.id];
          const displayStatus: TaskStatus = isCompleted
            ? "完了"
            : task.status === "完了"
              ? "未着手"
              : task.status;

          return (
            <article
              key={task.id}
              className="flex gap-3 py-4 first:pt-0 sm:items-center"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={isCompleted}
                aria-label={`${task.title}を${isCompleted ? "未完了" : "完了"}にする`}
                aria-describedby="mock-task-help"
                onClick={() => toggleTask(task.id)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5a84b] focus-visible:ring-offset-2 ${
                  isCompleted
                    ? "border-[#7390b4] bg-[#e8eef8] text-[#45638f]"
                    : "border-[#d8ddd8] bg-[#fafaf7] text-transparent hover:border-[#7fa28d]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                    isCompleted
                      ? "border-[#5876a8] bg-[#5876a8] text-white"
                      : "border-[#aebbb3] bg-white"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-bold ${
                    isCompleted ? "text-[#949b97] line-through" : "text-[#28372f]"
                  }`}
                >
                  {task.title}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <MemberAvatar member={assignee} size="sm" />
                  <span className="text-[11px] text-[#818a85]">
                    {assignee.name} ・ {task.part}
                  </span>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <TaskStatusBadge status={displayStatus} />
                <span className="text-xs font-bold text-[#ae702f]">{task.dueDate}</span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

type TemporaryComment = {
  id: number;
  body: string;
  timestamp: string;
};

export function MockCommentComposer({ currentUser }: { currentUser: Member }) {
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [temporaryComments, setTemporaryComments] = useState<TemporaryComment[]>([]);
  const [message, setMessage] = useState("");
  const canSubmit = comment.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setTemporaryComments((current) => [
      ...current,
      {
        id: Date.now(),
        body: comment.trim(),
        timestamp: timestamp.trim(),
      },
    ]);
    setComment("");
    setTimestamp("");
    setMessage("画面に一時表示しました。保存・送信はされていません。");
  };

  return (
    <div className="mt-6 border-t border-[#eceae4] pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold">コメントを試す</h3>
        <PrototypeBadge />
      </div>
      <p id="mock-comment-help" className="mt-2 text-[11px] leading-5 text-[#78827c]">
        追加したコメントはこの画面だけに表示され、リロードすると消えます。
      </p>

      {temporaryComments.length > 0 && (
        <div className="mt-5 space-y-4" aria-label="今回追加したモックコメント">
          {temporaryComments.map((item) => (
            <article key={item.id} className="flex gap-3 rounded-2xl bg-[#f3f8f5] p-3">
              <MemberAvatar member={currentUser} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold">{currentUser.name}（あなた）</p>
                  <span className="text-[10px] text-[#969c98]">たった今・一時表示</span>
                </div>
                <p className="mt-2 break-words text-xs leading-6 text-[#56635c]">
                  {item.timestamp && (
                    <span className="mr-1.5 inline-flex rounded-md bg-[#e9f4ed] px-2 py-0.5 font-bold text-[#1f6f4a]">
                      ▶ {item.timestamp}
                    </span>
                  )}
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <form
        className="mt-5 rounded-2xl border border-[#dfe3dd] bg-[#faf9f6] p-3"
        onSubmit={handleSubmit}
      >
        <label htmlFor="mock-comment" className="block text-xs font-bold text-[#58655e]">
          コメント
        </label>
        <textarea
          id="mock-comment"
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setMessage("");
          }}
          maxLength={280}
          aria-describedby="mock-comment-help mock-comment-count"
          placeholder="修正したい箇所や感想を入力"
          className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[#d9ddd7] bg-white p-3 text-sm text-[#28372f] outline-none transition placeholder:text-[#9da49f] focus:border-[#1f6f4a] focus:ring-2 focus:ring-[#1f6f4a]/20"
        />
        <div className="mt-1 flex justify-end">
          <span id="mock-comment-count" className="text-[10px] text-[#929995]">
            {comment.length} / 280
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-40">
            <label htmlFor="mock-timestamp" className="block text-[11px] font-bold text-[#68736d]">
              タイムスタンプ（任意）
            </label>
            <input
              id="mock-timestamp"
              type="text"
              inputMode="numeric"
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
              placeholder="例 01:24"
              aria-label="コメントのタイムスタンプ、任意"
              className="mt-2 min-h-11 w-full rounded-xl border border-[#d9ddd7] bg-white px-3 text-sm outline-none transition placeholder:text-[#9da49f] focus:border-[#1f6f4a] focus:ring-2 focus:ring-[#1f6f4a]/20"
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            aria-describedby="mock-comment-help mock-submit-reason"
            title={canSubmit ? "画面上だけに一時表示します" : "コメントを入力してください"}
            className="min-h-11 w-full rounded-full bg-[#173f31] px-5 text-sm font-bold text-white transition hover:bg-[#20513f] disabled:cursor-not-allowed disabled:bg-[#dfe4e0] disabled:text-[#79847e] sm:w-auto"
          >
            画面に追加
          </button>
        </div>
        <p id="mock-submit-reason" className="mt-3 text-[10px] leading-5 text-[#8a928d]">
          {canSubmit
            ? "送信先はありません。押すとこの画面にだけ追加します。"
            : "コメントを入力すると「画面に追加」ボタンを押せます。"}
        </p>
        {message && (
          <p
            className="mt-3 rounded-xl bg-[#e9f4ed] px-3 py-2 text-xs font-bold text-[#1f6f4a]"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
