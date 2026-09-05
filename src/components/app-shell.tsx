import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { MemberAvatar, PrototypeBadge } from "@/components/ui";
import { currentUser } from "@/lib/mock-data";

const navigation = [
  { href: "/dashboard", label: "ダッシュボード", icon: "⌂" },
  { href: "/bands", label: "バンド", icon: "♬" },
  { href: "/bands/lumen-echo/songs", label: "楽曲", icon: "♫" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-line bg-sidebar px-5 py-6 shadow-[18px_0_50px_rgba(0,0,0,0.18)] lg:flex lg:flex-col">
        <div className="px-2">
          <BrandMark href="/dashboard" />
        </div>

        <nav className="mt-10 space-y-1" aria-label="メインナビゲーション">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-panel-raised hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel text-base text-accent-blue shadow-[0_6px_16px_rgba(0,0,0,0.24)]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-[#6657e8]/30 bg-gradient-to-br from-[#19192e] to-[#101522] p-4 text-white shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            Current band
          </p>
          <p className="mt-2 text-sm font-bold">Lumen Echo</p>
          <p className="mt-1 text-xs leading-5 text-muted">3曲を制作中</p>
          <Link
            href="/bands/lumen-echo"
            className="mt-4 inline-flex min-h-11 items-center text-xs font-bold text-accent-blue hover:text-white"
          >
            ワークスペースを開く →
          </Link>
        </div>

        <div className="mt-auto border-t border-line pt-5">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-panel">
            <MemberAvatar member={currentUser} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{currentUser.name}</p>
              <p className="truncate text-[11px] text-subtle">
                {currentUser.part}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-line bg-sidebar/95 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <BrandMark href="/dashboard" />
          <MemberAvatar member={currentUser} size="sm" />
        </div>
        <nav
          className="flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6"
          aria-label="モバイルナビゲーション"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-line-strong bg-panel px-3.5 py-2 text-xs font-bold text-muted transition hover:border-accent/60 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="min-h-screen lg:pl-[252px]">
        <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-8">
          <div className="mb-5 flex justify-end lg:mb-7">
            <PrototypeBadge />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
