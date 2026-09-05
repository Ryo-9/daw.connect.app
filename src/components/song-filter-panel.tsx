"use client";

import { useMemo, useState } from "react";
import { SongCard } from "@/components/song-card";
import { PrototypeBadge } from "@/components/ui";
import type { Song, SongStatus } from "@/lib/mock-data";

const statusOptions: Array<"すべて" | SongStatus> = [
  "すべて",
  "アイデア",
  "制作中",
  "確認待ち",
  "完成",
];

export function SongFilterPanel({ songs }: { songs: Song[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("すべて");

  const filteredSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");

    return songs.filter((song) => {
      const matchesTitle =
        normalizedQuery.length === 0 ||
        song.title.toLocaleLowerCase("ja").includes(normalizedQuery);
      const matchesStatus = status === "すべて" || song.status === status;

      return matchesTitle && matchesStatus;
    });
  }, [query, songs, status]);

  const resetFilters = () => {
    setQuery("");
    setStatus("すべて");
  };

  return (
    <>
      <section
        className="instrument-panel mt-7 rounded-xl border border-line bg-panel p-4 sm:p-5"
        aria-labelledby="song-filter-heading"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="song-filter-heading" className="text-sm font-bold text-ink">
                楽曲を探す
              </h2>
              <PrototypeBadge />
            </div>
            <label
              htmlFor="song-search"
              className="mt-4 block text-xs font-bold text-muted"
            >
              楽曲名
            </label>
            <div className="relative mt-2">
              <span
                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-subtle"
                aria-hidden
              >
                ⌕
              </span>
              <input
                id="song-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例：Afterglow"
                className="control-well min-h-12 w-full rounded-lg border border-line-strong bg-panel-muted py-3 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="lg:max-w-[560px]">
            <span id="status-filter-label" className="block text-xs font-bold text-muted">
              ステータス
            </span>
            <div
              className="mt-2 flex flex-wrap gap-2"
              role="group"
              aria-labelledby="status-filter-label"
            >
              {statusOptions.map((option) => {
                const count =
                  option === "すべて"
                    ? songs.length
                    : songs.filter((song) => song.status === option).length;
                const isActive = status === option;

                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setStatus(option)}
                    className={`hardware-key min-h-11 rounded-lg border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
                      isActive
                        ? "border-accent-strong bg-accent-strong text-white shadow-[0_8px_20px_rgba(102,87,232,0.24)]"
                        : "border-line-strong bg-panel-muted text-muted hover:border-accent/60 hover:text-ink"
                    }`}
                  >
                    {option} <span className={isActive ? "text-white/65" : "text-subtle"}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted" aria-live="polite" aria-atomic="true">
            <span className="font-bold text-accent-blue">{filteredSongs.length}曲</span>
            を表示中
            {(query || status !== "すべて") && "（入力内容は保存されません）"}
          </p>
          {(query || status !== "すべて") && (
            <button
              type="button"
              onClick={resetFilters}
              className="hardware-key min-h-11 rounded-lg px-3 text-xs font-bold text-accent underline-offset-4 hover:bg-panel-raised hover:underline"
            >
              条件をリセット
            </button>
          )}
        </div>
      </section>

      {filteredSongs.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      ) : (
        <section
          className="control-well mt-5 rounded-xl border border-dashed border-line-strong bg-panel/70 px-5 py-12 text-center"
          role="status"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-accent/25 bg-accent-strong/12 text-xl text-accent">
            ⌕
          </span>
          <h2 className="mt-4 text-lg font-bold">該当する楽曲がありません</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-muted">
            楽曲名の入力またはステータスを変えて、もう一度お試しください。
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="hardware-key mt-5 min-h-11 rounded-lg bg-accent-strong px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(102,87,232,0.24)] hover:bg-accent-hover"
          >
            すべての楽曲を表示
          </button>
        </section>
      )}

      <section className="control-well mt-6 rounded-xl border border-dashed border-line bg-panel/55 p-5 text-center">
        <p className="text-xs leading-6 text-muted">
          検索と絞り込みはこの画面だけの一時状態です。楽曲作成とデータ保存は未実装です。
        </p>
      </section>
    </>
  );
}
