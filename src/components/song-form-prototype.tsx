"use client";

import { FormEvent, useState } from "react";
import type { SongStatus } from "@/lib/mock-data";

export type SongFormDraft = {
  title: string;
  status: SongStatus;
  bpm: string;
  timeSignature: string;
  musicalKey: string;
  daw: string;
  versionName: string;
  versionNote: string;
  description: string;
  parts: string[];
};

type SongFormPrototypeProps = {
  mode: "create" | "edit";
  bandName: string;
  initialValues: SongFormDraft;
};

const statuses: SongStatus[] = ["アイデア", "制作中", "確認待ち", "完成"];
const timeSignatures = ["4/4", "3/4", "6/8", "5/4"];
const musicalKeys = [
  "C major",
  "C minor",
  "D major",
  "D minor",
  "E major",
  "E minor",
  "F major",
  "F minor",
  "G major",
  "G minor",
  "A major",
  "A minor",
  "B major",
  "B minor",
];
const dawOptions = ["未設定", "Ableton Live", "Logic Pro", "Cubase", "Studio One", "Pro Tools", "その他"];
const partOptions = ["Vocal", "Guitar", "Bass", "Drums", "Keyboard", "Other"];

const fieldClassName =
  "min-h-11 w-full rounded-sm border border-[var(--line)] bg-[var(--surface-inset)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent-cyan)] focus:ring-2 focus:ring-[color:rgba(31,182,255,0.2)]";

function displayValue(value: string, fallback = "未入力") {
  return value.trim() || fallback;
}

export function SongFormPrototype({ mode, bandName, initialValues }: SongFormPrototypeProps) {
  const [draft, setDraft] = useState(initialValues);
  const [preview, setPreview] = useState(initialValues);
  const [previewMessage, setPreviewMessage] = useState("");

  const updateField = <Key extends keyof SongFormDraft>(key: Key, value: SongFormDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setPreviewMessage("");
  };

  const togglePart = (part: string) => {
    const nextParts = draft.parts.includes(part)
      ? draft.parts.filter((currentPart) => currentPart !== part)
      : [...draft.parts, part];
    updateField("parts", nextParts);
  };

  const handlePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPreview(draft);
    setPreviewMessage("プレビューを更新しました。入力内容は保存・送信されていません。");
  };

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
      <form className="instrument-panel min-w-0 overflow-hidden" onSubmit={handlePreview}>
        <div className="border-b border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="micro-label">SONG METADATA / {mode === "create" ? "NEW" : "EDIT"}</p>
              <h2 className="mt-1 text-lg font-black text-white">
                {mode === "create" ? "新規楽曲セットアップ" : "楽曲情報を編集"}
              </h2>
            </div>
            <span className="status-chip border-[color:rgba(244,114,182,0.44)] bg-[color:rgba(244,114,182,0.1)] text-pink-200">
              PHASE 1 · MOCK ONLY
            </span>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div className="control-well border-[color:rgba(244,114,182,0.28)] p-4">
            <p className="text-sm font-bold text-pink-100">このフォームはまだ保存されません</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              入力はこの画面内のプレビューにだけ反映されます。DB・API・ブラウザ保存・ファイル送信は行いません。
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <label className="min-w-0 md:col-span-2" htmlFor="song-title">
              <span className="micro-label mb-2 block">SONG TITLE / 楽曲名</span>
              <input
                required
                id="song-title"
                name="title"
                value={draft.title}
                onChange={(event) => updateField("title", event.target.value)}
                className={fieldClassName}
                placeholder="例: New Horizon"
              />
            </label>

            <label className="min-w-0" htmlFor="song-band">
              <span className="micro-label mb-2 block">BAND</span>
              <input
                readOnly
                id="song-band"
                name="band"
                value={bandName}
                className={`${fieldClassName} cursor-not-allowed opacity-75`}
                aria-describedby="song-band-note"
              />
              <span id="song-band-note" className="mt-1 block text-[11px] text-[var(--muted)]">
                このプロトタイプでは所属バンドを変更できません。
              </span>
            </label>

            <label className="min-w-0" htmlFor="song-status">
              <span className="micro-label mb-2 block">STATUS</span>
              <select
                id="song-status"
                name="status"
                value={draft.status}
                onChange={(event) => updateField("status", event.target.value as SongStatus)}
                className={fieldClassName}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0" htmlFor="song-bpm">
              <span className="micro-label mb-2 block">BPM</span>
              <input
                required
                id="song-bpm"
                name="bpm"
                type="number"
                min="40"
                max="240"
                value={draft.bpm}
                onChange={(event) => updateField("bpm", event.target.value)}
                className={fieldClassName}
              />
            </label>

            <label className="min-w-0" htmlFor="song-time-signature">
              <span className="micro-label mb-2 block">TIME SIGNATURE</span>
              <select
                id="song-time-signature"
                name="timeSignature"
                value={draft.timeSignature}
                onChange={(event) => updateField("timeSignature", event.target.value)}
                className={fieldClassName}
              >
                {timeSignatures.map((timeSignature) => (
                  <option key={timeSignature} value={timeSignature}>
                    {timeSignature}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0" htmlFor="song-key">
              <span className="micro-label mb-2 block">KEY</span>
              <select
                id="song-key"
                name="musicalKey"
                value={draft.musicalKey}
                onChange={(event) => updateField("musicalKey", event.target.value)}
                className={fieldClassName}
              >
                {musicalKeys.map((musicalKey) => (
                  <option key={musicalKey} value={musicalKey}>
                    {musicalKey}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0" htmlFor="song-daw">
              <span className="micro-label mb-2 block">DAW</span>
              <select
                id="song-daw"
                name="daw"
                value={draft.daw}
                onChange={(event) => updateField("daw", event.target.value)}
                className={fieldClassName}
              >
                {dawOptions.map((daw) => (
                  <option key={daw} value={daw}>
                    {daw}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 md:col-span-2" htmlFor="song-version-name">
              <span className="micro-label mb-2 block">
                {mode === "create" ? "INITIAL VERSION" : "VERSION NAME"}
              </span>
              <input
                required
                id="song-version-name"
                name="versionName"
                value={draft.versionName}
                onChange={(event) => updateField("versionName", event.target.value)}
                className={fieldClassName}
                placeholder="例: v0.1 / First demo"
              />
            </label>

            <label className="min-w-0 md:col-span-2" htmlFor="song-version-note">
              <span className="micro-label mb-2 block">VERSION NOTE</span>
              <textarea
                id="song-version-note"
                name="versionNote"
                rows={3}
                value={draft.versionNote}
                onChange={(event) => updateField("versionNote", event.target.value)}
                className={fieldClassName}
                placeholder="このバージョンで確認してほしい点"
              />
            </label>

            <label className="min-w-0 md:col-span-2" htmlFor="song-description">
              <span className="micro-label mb-2 block">DESCRIPTION / MEMO</span>
              <textarea
                id="song-description"
                name="description"
                rows={4}
                value={draft.description}
                onChange={(event) => updateField("description", event.target.value)}
                className={fieldClassName}
                placeholder="曲の方向性、参考音源、次に試したいこと"
              />
            </label>
          </div>

          <fieldset>
            <legend className="micro-label mb-2">PARTS / 担当パート</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {partOptions.map((part) => {
                const selected = draft.parts.includes(part);
                return (
                  <button
                    key={part}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => togglePart(part)}
                    className={`hardware-key min-h-11 justify-start px-3 ${
                      selected ? "border-[var(--accent-cyan)] text-cyan-100" : ""
                    }`}
                  >
                    <span aria-hidden="true" className="mr-2 text-[10px]">
                      {selected ? "●" : "○"}
                    </span>
                    {part}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <section className="control-well p-4" aria-labelledby="asset-placeholder-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p id="asset-placeholder-title" className="micro-label">
                  AUDIO / MIDI PLACEHOLDER
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">表示確認用。実ファイルは選択・送信できません。</p>
              </div>
              <span className="status-chip">VISUAL ONLY</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled className="hardware-key min-h-11 opacity-55">
                Audio upload（未実装）
              </button>
              <button type="button" disabled className="hardware-key min-h-11 opacity-55">
                MIDI attach（未実装）
              </button>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-5 text-xs text-cyan-100" role="status" aria-live="polite">
              {previewMessage}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" disabled className="hardware-key min-h-11 opacity-50">
                保存（未実装）
              </button>
              <button type="submit" className="hardware-key min-h-11 border-[var(--accent-cyan)] text-cyan-100">
                Previewに反映
              </button>
            </div>
          </div>
        </div>
      </form>

      <aside className="instrument-panel min-w-0 self-start overflow-hidden xl:sticky xl:top-24" aria-label="未保存の楽曲プレビュー">
        <div className="border-b border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="micro-label">REVIEW PREVIEW</p>
            <span className="status-chip border-[color:rgba(244,114,182,0.44)] text-pink-200">UNSAVED</span>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[var(--accent-cyan)]">{bandName}</p>
            <h2 className="mt-2 break-words text-2xl font-black text-white">{displayValue(preview.title, "Untitled song")}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{displayValue(preview.description)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ["STATUS", preview.status],
              ["BPM", displayValue(preview.bpm)],
              ["TIME", preview.timeSignature],
              ["KEY", preview.musicalKey],
            ].map(([label, value]) => (
              <div key={label} className="control-well min-w-0 p-3">
                <p className="micro-label">{label}</p>
                <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="control-well p-4">
            <p className="micro-label">VERSION / DAW</p>
            <p className="mt-2 break-words text-sm font-bold text-white">{displayValue(preview.versionName)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{preview.daw}</p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
              {displayValue(preview.versionNote, "バージョンノートは未入力です。")}
            </p>
          </div>

          <div>
            <p className="micro-label">ASSIGNED PARTS</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {preview.parts.length > 0 ? (
                preview.parts.map((part) => (
                  <span key={part} className="status-chip border-[color:rgba(31,182,255,0.35)] text-cyan-100">
                    {part}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--muted)]">担当パートは未選択です。</span>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
            この確認表示もmockです。リロードするとフォームの変更は初期状態へ戻ります。
          </div>
        </div>
      </aside>
    </div>
  );
}
