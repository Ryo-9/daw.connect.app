import type { Member, SongStatus, TaskStatus } from "@/lib/mock-data";

export function MemberAvatar({
  member,
  size = "md",
}: {
  member: Member;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
  }[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-panel font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.28)] ${sizeClass}`}
      style={{ backgroundColor: member.color }}
      title={`${member.name}・${member.part}`}
      aria-label={`${member.name}、${member.part}`}
    >
      {member.initials}
    </span>
  );
}

export function AvatarStack({ members }: { members: Member[] }) {
  return (
    <div className="flex -space-x-2" aria-label={`${members.length}人のメンバー`}>
      {members.map((member) => (
        <MemberAvatar key={member.id} member={member} size="sm" />
      ))}
    </div>
  );
}

export function SongStatusBadge({ status }: { status: SongStatus }) {
  const styles: Record<SongStatus, string> = {
    アイデア: "border border-[#8b5cf6]/35 bg-[#8b5cf6]/14 text-[#c4b5fd]",
    制作中: "border border-[#38bdf8]/35 bg-[#38bdf8]/14 text-[#7dd3fc]",
    確認待ち: "border border-[#f59e0b]/35 bg-[#f59e0b]/14 text-[#fcd34d]",
    完成: "border border-[#34d399]/35 bg-[#34d399]/14 text-[#6ee7b7]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    未着手: "border-line bg-panel-muted text-muted",
    進行中: "border-[#38bdf8]/35 bg-[#38bdf8]/12 text-[#7dd3fc]",
    完了: "border-[#34d399]/35 bg-[#34d399]/12 text-[#6ee7b7]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-panel-muted ring-1 ring-inset ring-line"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={`制作進捗 ${value}%`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-strong to-accent-blue shadow-[0_0_12px_rgba(90,155,255,0.4)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function PrototypeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-panel/85 px-3 py-1.5 text-[11px] font-bold text-muted shadow-[0_8px_22px_rgba(0,0,0,0.18)] backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-warning shadow-[0_0_8px_rgba(251,191,36,0.55)]" />
      MOCK UI・保存されません
    </span>
  );
}
