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
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-subtle">
            Part tasks
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">パート別TODO</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PrototypeBadge />
          <span
            className="rounded-full border border-line bg-panel-muted px-3 py-1.5 text-xs font-bold text-muted"
            aria-live="polite"
          >
            {incompleteCount}件 未完了
          </span>
        </div>
      </div>

      <p id="mock-task-help" className="mt-4 text-xs leading-6 text-muted">
        チェックすると見た目だけ切り替わります。変更は保存されず、リロードで元に戻ります。
      </p>

      <div className="mt-5 divide-y divide-line">
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
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
                  isCompleted
                    ? "border-accent-blue/55 bg-accent-blue/12 text-accent-blue"
                    : "border-line-strong bg-panel-muted text-transparent hover:border-accent/60"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                    isCompleted
                      ? "border-accent-blue bg-accent-blue text-white"
                      : "border-subtle bg-panel"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-bold ${
                    isCompleted ? "text-subtle line-through" : "text-ink"
                  }`}
                >
                  {task.title}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <MemberAvatar member={assignee} size="sm" />
                  <span className="text-[11px] text-subtle">
                    {assignee.name} ・ {task.part}
                  </span>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <TaskStatusBadge status={displayStatus} />
                <span className="font-mono text-xs font-bold text-warning">{task.dueDate}</span>
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
    <div className="mt-6 border-t border-line pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold">コメントを試す</h3>
        <PrototypeBadge />
      </div>
      <p id="mock-comment-help" className="mt-2 text-[11px] leading-5 text-muted">
        追加したコメントはこの画面だけに表示され、リロードすると消えます。
      </p>

      {temporaryComments.length > 0 && (
        <div className="mt-5 space-y-4" aria-label="今回追加したモックコメント">
          {temporaryComments.map((item) => (
            <article key={item.id} className="flex gap-3 rounded-xl border border-accent/20 bg-accent-strong/8 p-3">
              <MemberAvatar member={currentUser} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold">{currentUser.name}（あなた）</p>
                  <span className="text-[10px] text-subtle">たった今・一時表示</span>
                </div>
                <p className="mt-2 break-words text-xs leading-6 text-muted">
                  {item.timestamp && (
                    <span className="mr-1.5 inline-flex rounded-md border border-accent-blue/20 bg-accent-blue/10 px-2 py-0.5 font-bold text-accent-blue">
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
        className="mt-5 rounded-2xl border border-line bg-panel-muted p-3"
        onSubmit={handleSubmit}
      >
        <label htmlFor="mock-comment" className="block text-xs font-bold text-muted">
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
          className="mt-2 min-h-24 w-full resize-y rounded-xl border border-line-strong bg-panel p-3 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <div className="mt-1 flex justify-end">
          <span id="mock-comment-count" className="font-mono text-[10px] text-subtle">
            {comment.length} / 280
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-40">
            <label htmlFor="mock-timestamp" className="block text-[11px] font-bold text-muted">
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
              className="mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-panel px-3 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            aria-describedby="mock-comment-help mock-submit-reason"
            title={canSubmit ? "画面上だけに一時表示します" : "コメントを入力してください"}
            className="min-h-11 w-full rounded-xl bg-accent-strong px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(102,87,232,0.22)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-panel-raised disabled:text-subtle disabled:shadow-none sm:w-auto"
          >
            画面に追加
          </button>
        </div>
        <p id="mock-submit-reason" className="mt-3 text-[10px] leading-5 text-subtle">
          {canSubmit
            ? "送信先はありません。押すとこの画面にだけ追加します。"
            : "コメントを入力すると「画面に追加」ボタンを押せます。"}
        </p>
        {message && (
          <p
            className="mt-3 rounded-xl border border-positive/20 bg-positive/10 px-3 py-2 text-xs font-bold text-positive"
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
