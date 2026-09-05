import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import {
  AvatarStack,
  ProgressBar,
  PrototypeBadge,
  SongStatusBadge,
} from "@/components/ui";
import { getBandMembers, songs } from "@/lib/mock-data";

export default function Home() {
  const featuredSong = songs[0];
  const featuredMembers = getBandMembers(featuredSong.bandId);

  return (
    <div className="mechanical-canvas min-h-screen overflow-hidden text-ink">
      <header className="equipment-rail relative z-20 border-b border-line bg-sidebar/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <BrandMark />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex">
              <PrototypeBadge />
            </span>
            <Link
              href="/dashboard"
              className="hardware-key inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-strong px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(102,87,232,0.3)] transition hover:-translate-y-0.5 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              デモを見る
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute -right-32 -top-48 h-[520px] w-[520px] rounded-full bg-[#4f46e5]/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-52 top-40 h-[440px] w-[440px] rounded-full bg-[#2563eb]/12 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10 lg:py-28">
            <div>
              <div className="sm:hidden">
                <PrototypeBadge />
              </div>
              <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.24em] text-accent sm:mt-0">
                A workspace beyond your DAW
              </p>
              <h1 className="mt-5 max-w-2xl text-[42px] font-bold leading-[1.08] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[68px]">
                曲づくりの会話を、
                <span className="bg-gradient-to-r from-accent to-accent-blue bg-clip-text text-transparent">曲のそばに。</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
                メモ、タイムスタンプコメント、パート別TODO、音源ファイル。
                バンドの制作情報を楽曲ごとにひとつの場所へまとめます。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="hardware-key inline-flex min-h-12 items-center justify-center rounded-lg bg-accent-strong px-7 text-sm font-bold text-white shadow-[0_12px_30px_rgba(102,87,232,0.3)] transition hover:-translate-y-0.5 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  ダッシュボードを開く
                </Link>
                <Link
                  href="/bands"
                  className="hardware-key inline-flex min-h-12 items-center justify-center rounded-lg border border-line-strong bg-panel/70 px-7 text-sm font-bold text-ink transition hover:border-accent/60 hover:bg-panel-raised"
                >
                  バンド一覧を見る
                </Link>
              </div>
              <div className="mt-9 flex items-center gap-4">
                <AvatarStack members={featuredMembers} />
                <p className="text-xs leading-5 text-muted">
                  4人の制作チームを想定した
                  <br />
                  完全なモックデータです
                </p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[620px]">
              <div className="absolute -left-6 top-12 hidden h-24 w-24 rounded-3xl bg-accent-strong/40 blur-sm lg:block" />
              <div className="absolute -right-8 bottom-8 hidden h-32 w-32 rounded-full border-[20px] border-accent-blue/18 lg:block" />
              <div className="instrument-panel relative rounded-2xl border border-line-strong bg-panel/92 p-4 shadow-[0_34px_90px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6">
                <div className="flex items-center justify-between border-b border-line pb-5">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
                      Lumen Echo / Songs
                    </p>
                    <p className="mt-1.5 text-lg font-bold">制作ダッシュボード</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent-strong/12 text-sm text-accent">
                    ♫
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-accent/25 bg-gradient-to-br from-[#201d3b] via-[#171b30] to-[#111827] p-5 text-white sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <SongStatusBadge status={featuredSong.status} />
                      <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em]">
                        {featuredSong.title}
                      </h2>
                      <p className="mt-1.5 font-mono text-xs text-muted">
                        {featuredSong.bpm} BPM ・ {featuredSong.musicalKey} ・ {featuredSong.version}
                      </p>
                    </div>
                    <span className="rounded-full border border-warning/25 bg-warning/10 px-3 py-1.5 text-[11px] font-bold text-warning">
                      次: {featuredSong.nextMilestone}
                    </span>
                  </div>
                  <div className="mt-7">
                    <div className="mb-2 flex justify-between text-[11px] font-bold text-muted">
                      <span>制作進捗</span>
                      <span>{featuredSong.progress}%</span>
                    </div>
                    <div className="[&>div]:bg-white/10 [&>div>div]:bg-gradient-to-r [&>div>div]:from-accent [&>div>div]:to-accent-blue">
                      <ProgressBar value={featuredSong.progress} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="control-well rounded-lg border border-line bg-panel-muted p-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">
                      Today&apos;s task
                    </p>
                    <p className="mt-3 text-sm font-bold leading-6">
                      ラスサビのギターを録り直す
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
                      <span>Guitar・涼</span>
                      <span className="font-mono font-bold text-accent-blue">8/12</span>
                    </div>
                  </div>
                  <div className="control-well rounded-lg border border-line bg-panel-muted p-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">
                      Latest comment
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      <span className="font-mono font-bold text-accent-blue">01:24</span>{" "}
                      サビに入る勢いがすごく良いです。
                    </p>
                    <p className="mt-4 text-[11px] text-subtle">颯・今日 17:58</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-sidebar/55">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-accent">
                One song, one place
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                制作に必要な情報が、つながって見える。
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "決まったことをメモに",
                  text: "曲の方向性やアレンジ、録音メモをチャットから切り離して整理します。",
                },
                {
                  number: "02",
                  title: "音の場所へコメント",
                  text: "タイムスタンプ付きで、どの瞬間について話しているかを共有します。",
                },
                {
                  number: "03",
                  title: "次の担当をTODOに",
                  text: "ギター、ボーカル、ベース、ドラム。パートごとの次の一手を見える化します。",
                },
              ].map((feature) => (
                <article
                  key={feature.number}
                  className="instrument-panel rounded-xl border border-line bg-panel p-6 sm:p-7"
                >
                  <span className="font-mono text-xs font-bold text-accent-blue">{feature.number}</span>
                  <h3 className="mt-6 text-lg font-bold tracking-[-0.02em]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-sidebar px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">DAW Connect App</p>
          <p className="text-xs text-muted">
            UI prototype / No database, authentication, or file upload.
          </p>
        </div>
      </footer>
    </div>
  );
}
