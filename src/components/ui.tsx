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
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-sm ${sizeClass}`}
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
    アイデア: "bg-[#eeeaf6] text-[#6d5489]",
    制作中: "bg-[#e7f4ec] text-[#17623e]",
    確認待ち: "bg-[#fff1d6] text-[#8b5f15]",
    完成: "bg-[#e8eef8] text-[#45638f]",
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
    未着手: "border-[#e5e2da] bg-[#f7f5f0] text-[#6e746f]",
    進行中: "border-[#b9ddc8] bg-[#edf8f1] text-[#17623e]",
    完了: "border-[#cfd9e9] bg-[#eff3f9] text-[#536a8e]",
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
      className="h-1.5 overflow-hidden rounded-full bg-[#e9e8e2]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={`制作進捗 ${value}%`}
    >
      <div
        className="h-full rounded-full bg-[#1f6f4a]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function PrototypeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ded8] bg-white/80 px-3 py-1.5 text-[11px] font-bold text-[#526159] shadow-sm backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-[#e5a84b]" />
      MOCK UI・保存されません
    </span>
  );
}
