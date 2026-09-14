"use client";

import { useMemo, useState } from "react";
import { WaveformPreviewSurface } from "@/components/song-production-surfaces";
import { MemberAvatar, PrototypeBadge } from "@/components/ui";
import type {
  CreativeItem,
  CreativeItemKind,
  CreativeTaskStatus,
  Member,
  Song,
} from "@/lib/mock-data";

const kindLabels: Record<CreativeItemKind, string> = {
  MEMO: "Memo",
  IDEA: "Idea",
  TASK: "Task",
};

const kindStyles: Record<CreativeItemKind, string> = {
  MEMO: "border-accent-blue/25 bg-accent-blue/10 text-accent-blue",
  IDEA: "border-accent/30 bg-accent-strong/10 text-accent",
  TASK: "border-warning/25 bg-warning/10 text-warning",
};

const statusLabels: Record<CreativeTaskStatus, string> = {
  OPEN: "未対応",
  IN_PROGRESS: "対応中",
  DONE: "完了",
  CANCELED: "不要",
};

type Filter = "ALL" | CreativeItemKind;

const filterLabels: Record<Filter, string> = {
  ALL: "すべて",
  MEMO: "Memo",
  IDEA: "Idea",
  TASK: "Task",
};

export function CreativeWorkspacePrototype({
  song,
  items,
  members,
}: {
  song: Song;
  items: CreativeItem[];
  members: Member[];
}) {
  const [focusMode, setFocusMode] = useState(false);

  return (
    <>
      <WaveformPreviewSurface
        song={song}
        showCreativeAnnotations={!focusMode}
      />
      <CreativeBoard
        items={items}
        members={members}
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
      />
    </>
  );
}

export function CreativeBoard({
  items,
  members,
  focusMode,
  onFocusModeChange,
}: {
  items: CreativeItem[];
  members: Member[];
  focusMode: boolean;
  onFocusModeChange: (enabled: boolean) => void;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [prototypeMessage, setPrototypeMessage] = useState("");
  const filteredItems = useMemo(
    () =>
      filter === "ALL" ? items : items.filter((item) => item.kind === filter),
    [filter, items],
  );

  const announceCreatePrototype = (kind: CreativeItemKind) => {
    setPrototypeMessage(
      `${kindLabels[kind]}の追加は表示候補です。保存・通信は行われません。`,
    );
  };

  return (
    <section
      id="creative"
      className="instrument-panel mt-5 scroll-mt-32 overflow-hidden rounded-xl border border-line bg-panel"
      aria-labelledby="creative-board-heading"
    >
      <div className="border-b border-line p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Creative support
              </p>
              <PrototypeBadge />
            </div>
            <h2
              id="creative-board-heading"
              className="mt-2 break-words text-2xl font-bold tracking-[-0.035em]"
            >
              Creative Board
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              メモ、アイデア、やると決めたことを同じ場所で眺める、制作支援のモックです。未対応itemがあっても制作やVersion作成を止めません。
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={focusMode}
            aria-label="Focus Mode"
            onClick={() => onFocusModeChange(!focusMode)}
            className={`hardware-key inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
              focusMode
                ? "border-accent-blue/50 bg-accent-blue/12 text-accent-blue"
                : "border-line-strong bg-panel-muted text-muted hover:border-accent/55 hover:text-ink"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${focusMode ? "bg-accent-blue" : "bg-subtle"}`}
              aria-hidden
            />
            Focus Mode {focusMode ? "ON" : "OFF"}
          </button>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-subtle">
          画面内だけの表示切り替えです。item、Task状態、通知、権限、再生には影響せず、リロードでOFFへ戻ります。
        </p>
      </div>

      {focusMode ? (
        <div className="p-5 sm:p-7" data-testid="focus-mode-view">
          <div className="control-well rounded-xl border border-accent-blue/20 bg-accent-blue/8 px-5 py-10 text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue">
              Focus Mode / presentation only
            </p>
            <h3 className="mt-3 text-lg font-bold">音と画面に集中する表示</h3>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-muted">
              Creative itemとTimeline markerを一時的に隠しています。dataは削除・変更されていません。
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">
                View filter
              </p>
              <div
                className="mt-2 flex flex-wrap gap-2"
                aria-label="Creative itemの種類フィルター"
              >
                {(Object.keys(filterLabels) as Filter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                    className={`hardware-key min-h-11 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
                      filter === value
                        ? "border-accent-strong bg-accent-strong text-white"
                        : "border-line-strong bg-panel-muted text-muted hover:border-accent/55 hover:text-ink"
                    }`}
                  >
                    {filterLabels[value]}
                  </button>
                ))}
              </div>
            </div>
            <p className="shrink-0 text-xs font-bold text-accent-blue" aria-live="polite">
              {filteredItems.length}件を表示
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2" aria-label="Creative items">
            {filteredItems.map((item) => {
              const creator = members.find((member) => member.id === item.creatorId);
              const assignee = item.task?.assigneeId
                ? members.find((member) => member.id === item.task?.assigneeId)
                : undefined;

              return (
                <article
                  key={item.id}
                  data-kind={item.kind}
                  className="control-well min-w-0 rounded-xl border border-line bg-panel-muted/65 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${kindStyles[item.kind]}`}
                    >
                      {kindLabels[item.kind]}
                    </span>
                    {item.anchor && (
                      <span className="max-w-full break-words rounded-md border border-accent-blue/20 bg-accent-blue/8 px-2 py-1 font-mono text-[9px] font-bold text-accent-blue">
                        {item.anchor.version} / {item.anchor.location}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 break-words text-sm font-bold leading-6 text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 break-words text-xs leading-6 text-muted">{item.body}</p>

                  {item.kind === "TASK" && item.task && (
                    <div
                      className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3"
                      data-testid="task-metadata"
                    >
                      <span className="rounded-md border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning">
                        {statusLabels[item.task.status]}
                      </span>
                      <span className="rounded-md border border-line bg-panel px-2 py-1 text-[10px] font-bold text-muted">
                        {item.task.priority === "IMPORTANT" ? "★ 重要" : "通常"}
                      </span>
                      {assignee && (
                        <span className="rounded-md border border-line bg-panel px-2 py-1 text-[10px] font-bold text-muted">
                          担当 {assignee.name}
                        </span>
                      )}
                      {item.task.dueDate && (
                        <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-[10px] font-bold text-muted">
                          期限 {item.task.dueDate}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-line pt-3">
                    {creator && <MemberAvatar member={creator} size="sm" />}
                    <p className="min-w-0 break-words text-[10px] text-subtle">
                      {creator?.name ?? "Member"} ・ {item.createdAt}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["MEMO", "メモを追加"],
                  ["IDEA", "アイデアを追加"],
                  ["TASK", "タスクを追加"],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => announceCreatePrototype(kind)}
                  className="hardware-key min-h-11 rounded-lg border border-line-strong bg-panel-muted px-3 text-xs font-bold text-muted transition hover:border-accent/55 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                >
                  ＋ {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-5 text-subtle">
              Prototype / non-persistent。追加、編集、変換、権限判定、保存は未実装です。既存の楽曲メモとTODOは比較用に残しています。
            </p>
            {prototypeMessage && (
              <p
                className="mt-3 rounded-lg border border-accent/20 bg-accent-strong/8 px-3 py-2 text-xs text-muted"
                role="status"
                aria-live="polite"
              >
                {prototypeMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
