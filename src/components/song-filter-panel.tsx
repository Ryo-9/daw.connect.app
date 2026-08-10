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
        className="mt-7 rounded-[24px] border border-[#e1e2db] bg-white p-4 shadow-[0_10px_30px_rgba(38,49,42,0.04)] sm:p-5"
        aria-labelledby="song-filter-heading"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="song-filter-heading" className="text-sm font-bold text-[#34443b]">
                楽曲を探す
              </h2>
              <PrototypeBadge />
            </div>
            <label
              htmlFor="song-search"
              className="mt-4 block text-xs font-bold text-[#5b6861]"
            >
              楽曲名
            </label>
            <div className="relative mt-2">
              <span
                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#809087]"
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
                className="min-h-12 w-full rounded-2xl border border-[#d9ddd7] bg-[#fbfaf7] py-3 pl-10 pr-4 text-sm text-[#28372f] outline-none transition placeholder:text-[#9da49f] focus:border-[#1f6f4a] focus:ring-2 focus:ring-[#1f6f4a]/20"
              />
            </div>
          </div>

          <div className="lg:max-w-[560px]">
            <span id="status-filter-label" className="block text-xs font-bold text-[#5b6861]">
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
                    className={`min-h-11 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e5a84b] focus-visible:ring-offset-2 ${
                      isActive
                        ? "border-[#173f31] bg-[#173f31] text-white"
                        : "border-[#deded7] bg-white text-[#66716b] hover:border-[#9db5a6] hover:text-[#1f6f4a]"
                    }`}
                  >
                    {option} <span className={isActive ? "text-white/65" : "text-[#a0a6a2]"}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eceae4] pt-4">
          <p className="text-xs text-[#68736d]" aria-live="polite" aria-atomic="true">
            <span className="font-bold text-[#1f6f4a]">{filteredSongs.length}曲</span>
            を表示中
            {(query || status !== "すべて") && "（入力内容は保存されません）"}
          </p>
          {(query || status !== "すべて") && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-11 rounded-full px-3 text-xs font-bold text-[#1f6f4a] underline-offset-4 hover:underline"
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
          className="mt-5 rounded-[24px] border border-dashed border-[#cfd4ce] bg-white/70 px-5 py-12 text-center"
          role="status"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f0] text-xl text-[#1f6f4a]">
            ⌕
          </span>
          <h2 className="mt-4 text-lg font-bold">該当する楽曲がありません</h2>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#78827c]">
            楽曲名の入力またはステータスを変えて、もう一度お試しください。
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 min-h-11 rounded-full bg-[#173f31] px-5 text-sm font-bold text-white hover:bg-[#20513f]"
          >
            すべての楽曲を表示
          </button>
        </section>
      )}

      <section className="mt-6 rounded-[22px] border border-dashed border-[#cfd4ce] bg-white/55 p-5 text-center">
        <p className="text-xs leading-6 text-[#78827c]">
          検索と絞り込みはこの画面だけの一時状態です。楽曲作成とデータ保存は未実装です。
        </p>
      </section>
    </>
  );
}
