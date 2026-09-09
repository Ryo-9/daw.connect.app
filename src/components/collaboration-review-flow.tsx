const flowSteps = [
  { number: "01", label: "PREVIEW", status: "READY", href: "#preview" },
  { number: "02", label: "COMMENT", status: "REVIEWING", href: "#comments" },
  { number: "03", label: "PROPOSAL", status: "AVAILABLE", href: "#proposal" },
  { number: "04", label: "DECISION", status: "PENDING", href: "#decision" },
] as const;

export function CollaborationReviewFlow({ version }: { version: string }) {
  return (
    <section className="instrument-panel mt-5 rounded-xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-blue">
            Mock review flow
          </p>
          <h2 className="mt-1 text-sm font-bold">制作レビューの進め方</h2>
        </div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-warning">
          Phase 1 prototype ・ 保存なし
        </p>
      </div>

      <nav className="mt-4" aria-label="コラボレーションレビューフロー">
        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line-strong bg-line sm:grid-cols-5">
          {flowSteps.map((step) => (
            <li key={step.href} className="min-w-0 bg-panel-muted">
              <a
                href={step.href}
                aria-label={`${step.number} ${step.label}へ移動`}
                className="hardware-key flex min-h-14 items-center justify-between gap-3 px-3 py-2 transition hover:bg-panel-raised sm:min-h-[76px] sm:flex-col sm:items-start sm:justify-center sm:gap-1"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-[9px] font-bold text-subtle">
                    {step.number}
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-ink">
                    {step.label}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[8px] font-bold tracking-[0.08em] text-accent-blue">
                  {step.status}
                </span>
              </a>
            </li>
          ))}
          <li className="min-w-0 bg-panel-muted">
            <a
              href="#version"
              aria-label="05 VERSIONへ移動"
              className="hardware-key flex min-h-14 items-center justify-between gap-3 px-3 py-2 transition hover:bg-panel-raised sm:min-h-[76px] sm:flex-col sm:items-start sm:justify-center sm:gap-1"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-[9px] font-bold text-subtle">05</span>
                <span className="font-mono text-[10px] font-bold tracking-[0.08em] text-ink">
                  VERSION
                </span>
              </span>
              <span className="shrink-0 font-mono text-[8px] font-bold tracking-[0.08em] text-positive">
                CURRENT {version}
              </span>
            </a>
          </li>
        </ol>
      </nav>
      <p className="mt-3 text-[10px] leading-5 text-subtle">
        Previewを確認し、位置付きCommentとMIDI Proposalをreviewして判断します。判断後の楽曲反映と次Versionの書き出しはDAW側で行います。
      </p>
    </section>
  );
}

const decisionLabels = ["ACCEPT", "PARTIAL", "HOLD", "REJECT"] as const;

export function ReviewDecisionSurface({ version }: { version: string }) {
  return (
    <section
      id="decision"
      className="instrument-panel scroll-mt-32 rounded-xl border border-line bg-panel p-5 sm:p-7"
      aria-labelledby="review-decision-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-subtle">
            Review decision / mock
          </p>
          <h2 id="review-decision-heading" className="mt-2 text-xl font-bold tracking-[-0.03em]">
            提案への判断
          </h2>
        </div>
        <span className="rounded border border-warning/25 bg-warning/10 px-2.5 py-1.5 font-mono text-[9px] font-bold text-warning">
          PENDING ・ {version}
        </span>
      </div>

      <p id="review-decision-note" className="mt-4 text-xs leading-6 text-muted">
        4つの判断はreview語彙の確認用です。選択・保存・DAWへの自動反映は行いません。
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {decisionLabels.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            aria-describedby="review-decision-note"
            className="hardware-key min-h-11 cursor-not-allowed rounded-lg border border-line-strong bg-panel-muted px-2 font-mono text-[10px] font-bold text-subtle"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="control-well mt-4 rounded-lg border border-accent-blue/20 bg-accent-blue/8 p-4">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent-blue">
          Non-destructive handoff
        </p>
        <p className="mt-2 text-[11px] leading-5 text-muted">
          判断してもOriginal MIDIは変わりません。作曲者がDAWで反映し、新しいPreview / MIDIを書き出してから次Versionとして共有します。
        </p>
      </div>
    </section>
  );
}
