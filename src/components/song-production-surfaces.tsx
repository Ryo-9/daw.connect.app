import { MemberAvatar, PrototypeBadge } from "@/components/ui";
import type { Member, Song } from "@/lib/mock-data";

const waveformBars = [
  18, 32, 46, 28, 58, 72, 38, 64, 84, 52, 34, 68, 42, 76, 92, 54,
  36, 62, 48, 80, 58, 88, 44, 70, 96, 64, 40, 74, 52, 86, 60, 34,
  56, 78, 46, 90, 66, 38, 72, 50, 82, 62, 94, 44, 68, 36, 76, 54,
  88, 58, 42, 70, 48, 84, 64, 32, 60, 74, 40, 66, 50, 36, 28, 18,
];

const pianoRollRows = [
  { key: "A4", notes: [{ left: 5, width: 16 }, { left: 50, width: 11 }] },
  { key: "G4", notes: [{ left: 24, width: 12 }, { left: 76, width: 17 }] },
  { key: "E4", notes: [{ left: 12, width: 20 }, { left: 58, width: 14 }] },
  { key: "D4", notes: [{ left: 39, width: 17 }, { left: 82, width: 10 }] },
  { key: "C4", notes: [{ left: 2, width: 11 }, { left: 66, width: 22 }] },
];

export function WaveformPreviewSurface({ song }: { song: Song }) {
  return (
    <section
      className="instrument-panel mt-5 overflow-hidden rounded-xl border border-line bg-panel"
      aria-labelledby="waveform-preview-heading"
    >
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-blue">
            Master preview / visual only
          </p>
          <h2 id="waveform-preview-heading" className="mt-1 text-sm font-bold">
            Waveform review surface
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-line-strong bg-panel-muted px-2.5 py-1.5 font-mono text-[10px] font-bold text-muted">
            {song.version} / 44.1 kHz
          </span>
          <span className="rounded-md border border-warning/25 bg-warning/10 px-2.5 py-1.5 text-[10px] font-bold text-warning">
            再生機能なし
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[110px_minmax(0,1fr)]">
        <div className="equipment-rail flex items-center gap-3 border-b border-line bg-sidebar px-4 py-3 lg:block lg:border-b-0 lg:border-r lg:py-4">
          <button
            type="button"
            disabled
            aria-describedby="waveform-preview-note"
            title="未実装：音声は再生されません"
            className="hardware-key flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-line-strong bg-panel-muted text-sm text-subtle"
          >
            ▶
          </button>
          <div className="min-w-0 lg:mt-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-subtle">
              Position
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-ink">01:24.320</p>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-2 grid grid-cols-5 font-mono text-[9px] font-bold text-subtle" aria-hidden>
            {['01.1', '09.1', '17.1', '25.1', '33.1'].map((bar) => (
              <span key={bar} className="last:text-right">{bar}</span>
            ))}
          </div>
          <div
            className="waveform-stage control-well relative h-32 overflow-hidden rounded-lg border border-line-strong bg-panel-muted sm:h-36"
            role="img"
            aria-label="音声解析ではない、レビュー位置を示すモック波形"
          >
            <div className="absolute inset-x-0 top-1/2 border-t border-accent-blue/20" />
            <div className="waveform-bars absolute inset-3 flex items-center gap-px" aria-hidden>
              {waveformBars.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="min-w-0 flex-1 rounded-[1px] bg-gradient-to-b from-accent via-accent-blue to-accent-strong opacity-80"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-y-0 left-[37%] w-px bg-warning shadow-[0_0_10px_rgba(251,191,36,0.65)]" aria-hidden>
              <span className="absolute -left-1.5 top-0 h-2 w-3 rounded-b-sm bg-warning" />
            </div>
            <div className="absolute bottom-2 left-[calc(37%+8px)] rounded border border-warning/25 bg-canvas/90 px-1.5 py-1 font-mono text-[9px] font-bold text-warning">
              CMT 01:24
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-4 gap-x-4 gap-y-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-subtle sm:flex sm:gap-5">
              <span>BPM <b className="text-ink">{song.bpm}</b></span>
              <span>Meter <b className="text-ink">4/4</b></span>
              <span>Bar <b className="text-ink">037</b></span>
              <span>Beat <b className="text-ink">2.3</b></span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] font-bold text-subtle">
              <span>L</span>
              <span className="meter-track block h-2 w-16 bg-panel-muted"><span className="meter-fill block h-full w-[72%] bg-accent-blue" /></span>
              <span>R</span>
              <span className="meter-track block h-2 w-16 bg-panel-muted"><span className="meter-fill block h-full w-[68%] bg-accent" /></span>
            </div>
          </div>
          <p id="waveform-preview-note" className="mt-3 text-[10px] leading-5 text-subtle">
            音声解析・再生・再生位置連動は未実装です。波形と目盛りは制作レビュー画面のvisual mockです。
          </p>
        </div>
      </div>
    </section>
  );
}

export function MidiProposalSurface() {
  return (
    <section className="instrument-panel rounded-xl border border-line bg-panel p-5 sm:p-7" aria-labelledby="midi-proposal-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-subtle">
            MIDI proposal / visual mock
          </p>
          <h2 id="midi-proposal-heading" className="mt-2 text-xl font-bold tracking-[-0.03em]">
            アレンジ提案
          </h2>
        </div>
        <PrototypeBadge />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <div className="control-well rounded-lg border border-line bg-panel-muted p-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-subtle">Original</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold">keys_v07.mid</span>
            <span className="rounded border border-positive/25 bg-positive/10 px-2 py-1 text-[9px] font-bold text-positive">READ ONLY</span>
          </div>
          <p className="mt-2 text-[10px] text-subtle">元データ・変更なし</p>
        </div>
        <div className="control-well rounded-lg border border-accent/25 bg-accent-strong/8 p-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-accent">Proposal A</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold">サビ上声案</span>
            <span className="rounded border border-warning/25 bg-warning/10 px-2 py-1 text-[9px] font-bold text-warning">未生成</span>
          </div>
          <p className="mt-2 text-[10px] text-subtle">表示例のみ・別案として表現</p>
        </div>
      </div>

      <div className="control-well mt-4 overflow-hidden rounded-lg border border-line-strong bg-panel-muted">
        <div className="flex items-center justify-between border-b border-line px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-subtle">
          <span>Chorus / bars 33–40</span>
          <span>1/8 grid</span>
        </div>
        <div role="img" aria-label="編集機能を持たないモックのピアノロール提案表示">
          {pianoRollRows.map((row, rowIndex) => (
            <div key={row.key} className="flex border-b border-line/70 last:border-b-0">
              <span className={`flex w-10 shrink-0 items-center justify-center border-r border-line font-mono text-[9px] font-bold ${rowIndex % 2 === 0 ? 'bg-[#d9def0] text-[#171b29]' : 'bg-[#1b2132] text-muted'}`}>
                {row.key}
              </span>
              <div className="piano-roll-lane relative h-8 min-w-0 flex-1">
                {row.notes.map((note, noteIndex) => (
                  <span
                    key={`${row.key}-${noteIndex}`}
                    className="absolute top-1/2 h-3 -translate-y-1/2 rounded-[2px] border border-accent/45 bg-gradient-to-r from-accent-strong to-accent-blue shadow-[0_0_10px_rgba(90,155,255,0.2)]"
                    style={{ left: `${note.left}%`, width: `${note.width}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-5 text-subtle">
        MIDI解析・編集・生成・DAW連携は未実装です。元MIDIを上書きせず、提案を別データとして扱う将来像だけを視覚化しています。
      </p>
    </section>
  );
}

export function MockCallBar({ members }: { members: Member[] }) {
  return (
    <section className="instrument-panel mt-5 rounded-xl border border-line bg-panel px-4 py-4 sm:px-5" aria-labelledby="mock-call-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex -space-x-2" aria-label="モックのオンラインメンバー">
            {members.slice(0, 4).map((member, index) => (
              <span key={member.id} className="relative" style={{ zIndex: members.length - index }}>
                <MemberAvatar member={member} size="sm" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-panel bg-positive" aria-hidden />
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue">Presence / mock</p>
            <h2 id="mock-call-heading" className="mt-1 text-sm font-bold leading-5">Lumen Echo review room</h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "MIC", symbol: "M" },
            { label: "SHARE", symbol: "S" },
            { label: "CALL", symbol: "C" },
          ].map((control) => (
            <button
              key={control.label}
              type="button"
              disabled
              title={`未実装：${control.label}操作は利用できません`}
              className="hardware-key inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg border border-line-strong bg-panel-muted px-3 font-mono text-[10px] font-bold text-subtle"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded border border-line bg-canvas text-[9px]">{control.symbol}</span>
              {control.label}
            </button>
          ))}
          <span className="inline-flex min-h-11 items-center rounded-lg border border-warning/25 bg-warning/10 px-3 text-[10px] font-bold text-warning">
            通話未実装
          </span>
        </div>
      </div>
    </section>
  );
}
