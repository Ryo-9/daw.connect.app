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
    <div className="min-h-screen overflow-hidden bg-[#f6f4ee] text-[#17231d]">
      <header className="relative z-20 border-b border-[#deddd5]/80 bg-[#f6f4ee]/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <BrandMark />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex">
              <PrototypeBadge />
            </span>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#173f31] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(23,63,49,0.16)] transition hover:-translate-y-0.5 hover:bg-[#20513f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f4a] focus-visible:ring-offset-2"
            >
              デモを見る
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute -right-32 -top-48 h-[520px] w-[520px] rounded-full bg-[#dceade] blur-3xl" />
          <div className="pointer-events-none absolute -left-52 top-40 h-[440px] w-[440px] rounded-full bg-[#f2dfb8] opacity-70 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10 lg:py-28">
            <div>
              <div className="sm:hidden">
                <PrototypeBadge />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-[#1f6f4a] sm:mt-0">
                A workspace beyond your DAW
              </p>
              <h1 className="mt-5 max-w-2xl text-[42px] font-bold leading-[1.08] tracking-[-0.055em] text-[#15231c] sm:text-6xl lg:text-[68px]">
                曲づくりの会話を、
                <span className="text-[#1f6f4a]">曲のそばに。</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#627068] sm:text-lg">
                メモ、タイムスタンプコメント、パート別TODO、音源ファイル。
                バンドの制作情報を楽曲ごとにひとつの場所へまとめます。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#173f31] px-7 text-sm font-bold text-white shadow-[0_12px_30px_rgba(23,63,49,0.2)] transition hover:-translate-y-0.5 hover:bg-[#20513f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6f4a] focus-visible:ring-offset-2"
                >
                  ダッシュボードを開く
                </Link>
                <Link
                  href="/bands"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d5d7cf] bg-white/70 px-7 text-sm font-bold text-[#2e4036] transition hover:border-[#a8b9ad] hover:bg-white"
                >
                  バンド一覧を見る
                </Link>
              </div>
              <div className="mt-9 flex items-center gap-4">
                <AvatarStack members={featuredMembers} />
                <p className="text-xs leading-5 text-[#728078]">
                  4人の制作チームを想定した
                  <br />
                  完全なモックデータです
                </p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[620px]">
              <div className="absolute -left-6 top-12 hidden h-24 w-24 rounded-3xl bg-[#f3c86b] lg:block" />
              <div className="absolute -right-8 bottom-8 hidden h-32 w-32 rounded-full border-[20px] border-[#b9d8c5] lg:block" />
              <div className="relative rounded-[34px] border border-white/80 bg-white/90 p-4 shadow-[0_34px_80px_rgba(40,56,47,0.14)] backdrop-blur sm:p-6">
                <div className="flex items-center justify-between border-b border-[#ecebe5] pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a958f]">
                      Lumen Echo / Songs
                    </p>
                    <p className="mt-1.5 text-lg font-bold">制作ダッシュボード</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4ef] text-sm text-[#1f6f4a]">
                    ♫
                  </span>
                </div>

                <div className="mt-5 rounded-[26px] bg-[#173f31] p-5 text-white sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <SongStatusBadge status={featuredSong.status} />
                      <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em]">
                        {featuredSong.title}
                      </h2>
                      <p className="mt-1.5 text-xs text-[#bcd1c5]">
                        {featuredSong.bpm} BPM ・ {featuredSong.musicalKey} ・ {featuredSong.version}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#f3c86b]">
                      次: {featuredSong.nextMilestone}
                    </span>
                  </div>
                  <div className="mt-7">
                    <div className="mb-2 flex justify-between text-[11px] font-bold text-[#d5e3da]">
                      <span>制作進捗</span>
                      <span>{featuredSong.progress}%</span>
                    </div>
                    <div className="[&>div]:bg-white/15 [&>div>div]:bg-[#f3c86b]">
                      <ProgressBar value={featuredSong.progress} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#e8e7e1] bg-[#fbfaf7] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8d9691]">
                      Today&apos;s task
                    </p>
                    <p className="mt-3 text-sm font-bold leading-6">
                      ラスサビのギターを録り直す
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-[#7a847e]">
                      <span>Guitar・涼</span>
                      <span className="font-bold text-[#1f6f4a]">8/12</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e8e7e1] bg-[#fbfaf7] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8d9691]">
                      Latest comment
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[#425047]">
                      <span className="font-bold text-[#1f6f4a]">01:24</span>{" "}
                      サビに入る勢いがすごく良いです。
                    </p>
                    <p className="mt-4 text-[11px] text-[#7a847e]">颯・今日 17:58</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dfded7] bg-[#fbfaf7]">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1f6f4a]">
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
                  className="rounded-[26px] border border-[#e5e3dc] bg-white p-6 shadow-[0_10px_30px_rgba(38,49,42,0.04)] sm:p-7"
                >
                  <span className="text-xs font-bold text-[#c18a34]">{feature.number}</span>
                  <h3 className="mt-6 text-lg font-bold tracking-[-0.02em]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#68736d]">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#173f31] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">DAW Connect App</p>
          <p className="text-xs text-[#b7cbbf]">
            UI prototype / No database, authentication, or file upload.
          </p>
        </div>
      </footer>
    </div>
  );
}
