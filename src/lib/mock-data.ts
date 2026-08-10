export type SongStatus = "アイデア" | "制作中" | "確認待ち" | "完成";

export type TaskStatus = "未着手" | "進行中" | "完了";

export type Member = {
  id: string;
  name: string;
  part: string;
  initials: string;
  color: string;
};

export type Band = {
  id: string;
  name: string;
  description: string;
  genre: string;
  accent: string;
  memberIds: string[];
  updatedAt: string;
};

export type Song = {
  id: string;
  bandId: string;
  title: string;
  status: SongStatus;
  bpm: number;
  musicalKey: string;
  updatedAt: string;
  progress: number;
  version: string;
  duration: string;
  summary: string;
  nextMilestone: string;
  notes: {
    direction: string;
    arrangement: string;
    recording: string;
  };
};

export type SongTask = {
  id: string;
  songId: string;
  title: string;
  part: string;
  assigneeId: string;
  status: TaskStatus;
  dueDate: string;
};

export type SongComment = {
  id: string;
  songId: string;
  authorId: string;
  body: string;
  createdAt: string;
  timestamp?: string;
};

export type SharedFile = {
  id: string;
  songId: string;
  name: string;
  kind: "Audio" | "MIDI" | "Reference";
  size: string;
  version: string;
  uploadedBy: string;
  updatedAt: string;
};

export const members: Member[] = [
  {
    id: "ryo",
    name: "涼",
    part: "Guitar / Compose",
    initials: "R",
    color: "#1f6f4a",
  },
  {
    id: "sora",
    name: "颯",
    part: "Vocal",
    initials: "S",
    color: "#d36b3c",
  },
  {
    id: "mei",
    name: "芽衣",
    part: "Bass",
    initials: "M",
    color: "#5876a8",
  },
  {
    id: "haru",
    name: "晴",
    part: "Drums",
    initials: "H",
    color: "#a7783d",
  },
  {
    id: "yui",
    name: "結衣",
    part: "Keyboard",
    initials: "Y",
    color: "#8b68a7",
  },
];

export const bands: Band[] = [
  {
    id: "lumen-echo",
    name: "Lumen Echo",
    description:
      "夜の街と余韻をテーマに、オルタナティブ・ポップを制作する4人組。",
    genre: "Alternative Pop",
    accent: "#1f6f4a",
    memberIds: ["ryo", "sora", "mei", "haru"],
    updatedAt: "今日 18:42",
  },
  {
    id: "neon-harbor",
    name: "Neon Harbor",
    description:
      "シンセとギターを軸にした週末プロジェクト。ライブ用の3曲を準備中。",
    genre: "Indie Electronic",
    accent: "#5876a8",
    memberIds: ["ryo", "yui", "haru"],
    updatedAt: "昨日 22:10",
  },
];

export const songs: Song[] = [
  {
    id: "afterglow",
    bandId: "lumen-echo",
    title: "Afterglow",
    status: "制作中",
    bpm: 118,
    musicalKey: "A minor",
    updatedAt: "今日 18:42",
    progress: 72,
    version: "v0.8",
    duration: "03:48",
    summary: "余韻の残るギターと、静かなAメロから広がるサビが軸の楽曲。",
    nextMilestone: "8/14 デモ確認",
    notes: {
      direction:
        "夜明け前の高速道路。静けさの中に少しだけ前向きな温度を残す。サビは開けるが、明るくしすぎない。",
      arrangement:
        "2番Aメロはドラムをハーフタイムに。ラスサビ前の4小節はボーカルとパッドだけにして、戻りを大きくする。",
      recording:
        "ギターのクリーンはJC系。ボーカルは囁きのテイクを重ねる。ベースの低域はキックとぶつからないよう80Hz付近を確認。",
    },
  },
  {
    id: "paper-moon",
    bandId: "lumen-echo",
    title: "Paper Moon",
    status: "確認待ち",
    bpm: 96,
    musicalKey: "D major",
    updatedAt: "昨日 23:18",
    progress: 88,
    version: "v1.2",
    duration: "04:12",
    summary: "アコースティックな質感を残したミドルテンポの楽曲。",
    nextMilestone: "メンバー確認待ち",
    notes: {
      direction: "紙で作った月のような、少し不完全で優しい景色を描く。",
      arrangement: "イントロを8小節から4小節へ短縮。2番後に短いギターソロ。",
      recording: "仮歌を本番テイクへ差し替え。コーラスの左右配置を再確認。",
    },
  },
  {
    id: "blue-hour",
    bandId: "lumen-echo",
    title: "Blue Hour",
    status: "アイデア",
    bpm: 82,
    musicalKey: "E minor",
    updatedAt: "8月8日 20:06",
    progress: 24,
    version: "v0.2",
    duration: "02:31",
    summary: "ピアノのモチーフから始まった新曲のラフアイデア。",
    nextMilestone: "構成案を決める",
    notes: {
      direction: "夕暮れと夜の境目。音数を絞り、余白を大切にする。",
      arrangement: "Aメロとサビの2セクションのみ。ブリッジ案が必要。",
      recording: "ピアノは仮MIDI。テンポは82〜86で比較したい。",
    },
  },
  {
    id: "city-lights",
    bandId: "neon-harbor",
    title: "City Lights",
    status: "制作中",
    bpm: 124,
    musicalKey: "F# minor",
    updatedAt: "昨日 22:10",
    progress: 61,
    version: "v0.6",
    duration: "03:36",
    summary: "シンセベースとカッティングギターが中心のライブ向け楽曲。",
    nextMilestone: "8/16 リハーサル",
    notes: {
      direction: "街の光が流れていくスピード感。サビは観客が歌えるフレーズに。",
      arrangement: "イントロのシンセを8小節に。間奏でギターとシンセを掛け合う。",
      recording: "ベースシンセをモノラルで整理。ギターDIも残す。",
    },
  },
  {
    id: "signal-loss",
    bandId: "neon-harbor",
    title: "Signal Loss",
    status: "完成",
    bpm: 110,
    musicalKey: "C minor",
    updatedAt: "8月6日 19:34",
    progress: 100,
    version: "v1.0",
    duration: "03:21",
    summary: "ミニマルなビートと歪んだボーカルサンプルを使った楽曲。",
    nextMilestone: "ライブ用書き出し済み",
    notes: {
      direction: "通信が途切れる瞬間の不安と解放。",
      arrangement: "構成確定。ライブ用にアウトロを8小節追加済み。",
      recording: "マスターとインスト版を書き出し済み。",
    },
  },
];

export const songTasks: SongTask[] = [
  {
    id: "task-1",
    songId: "afterglow",
    title: "ラスサビのギターを録り直す",
    part: "Guitar",
    assigneeId: "ryo",
    status: "進行中",
    dueDate: "8/12",
  },
  {
    id: "task-2",
    songId: "afterglow",
    title: "2番コーラスのハモりを確認",
    part: "Vocal",
    assigneeId: "sora",
    status: "未着手",
    dueDate: "8/13",
  },
  {
    id: "task-3",
    songId: "afterglow",
    title: "ベースの低域を整理",
    part: "Bass",
    assigneeId: "mei",
    status: "完了",
    dueDate: "8/10",
  },
  {
    id: "task-4",
    songId: "afterglow",
    title: "フィルの候補を2パターン録る",
    part: "Drums",
    assigneeId: "haru",
    status: "未着手",
    dueDate: "8/14",
  },
  {
    id: "task-5",
    songId: "paper-moon",
    title: "最終ミックスにコメントする",
    part: "All",
    assigneeId: "ryo",
    status: "未着手",
    dueDate: "8/11",
  },
  {
    id: "task-6",
    songId: "city-lights",
    title: "イントロのシンセ音色を決める",
    part: "Keyboard",
    assigneeId: "yui",
    status: "進行中",
    dueDate: "8/13",
  },
];

export const songComments: SongComment[] = [
  {
    id: "comment-1",
    songId: "afterglow",
    authorId: "sora",
    body: "ここからサビに入る勢いがすごく良いです。直前のブレスだけ少し小さくしたいかも。",
    createdAt: "今日 17:58",
    timestamp: "01:24",
  },
  {
    id: "comment-2",
    songId: "afterglow",
    authorId: "mei",
    body: "ベースは修正版を反映しました。キックとの重なりをもう一度だけ確認お願いします。",
    createdAt: "今日 16:31",
    timestamp: "02:08",
  },
  {
    id: "comment-3",
    songId: "afterglow",
    authorId: "haru",
    body: "ラスサビ前のフィル、短い方が曲の空気に合いそうです。次のリハで2案試します。",
    createdAt: "昨日 22:04",
  },
  {
    id: "comment-4",
    songId: "paper-moon",
    authorId: "ryo",
    body: "v1.2を確認用にまとめました。全体の音量バランスを見てください。",
    createdAt: "昨日 23:18",
  },
];

export const sharedFiles: SharedFile[] = [
  {
    id: "file-1",
    songId: "afterglow",
    name: "afterglow_demo_v08.wav",
    kind: "Audio",
    size: "68.4 MB",
    version: "v0.8",
    uploadedBy: "ryo",
    updatedAt: "今日 18:42",
  },
  {
    id: "file-2",
    songId: "afterglow",
    name: "afterglow_keys_v07.mid",
    kind: "MIDI",
    size: "42 KB",
    version: "v0.7",
    uploadedBy: "ryo",
    updatedAt: "昨日 21:16",
  },
  {
    id: "file-3",
    songId: "afterglow",
    name: "vocal_reference.mp3",
    kind: "Reference",
    size: "8.1 MB",
    version: "参考",
    uploadedBy: "sora",
    updatedAt: "8月9日 14:03",
  },
];

export const currentUser = members[0];

export function getMember(memberId: string) {
  return members.find((member) => member.id === memberId);
}

export function getBand(bandId: string) {
  return bands.find((band) => band.id === bandId);
}

export function getSong(songId: string) {
  return songs.find((song) => song.id === songId);
}

export function getBandMembers(bandId: string) {
  const band = getBand(bandId);
  return band
    ? band.memberIds
        .map((memberId) => getMember(memberId))
        .filter((member): member is Member => Boolean(member))
    : [];
}

export function getBandSongs(bandId: string) {
  return songs.filter((song) => song.bandId === bandId);
}

export function getSongTasks(songId: string) {
  return songTasks.filter((task) => task.songId === songId);
}

export function getSongComments(songId: string) {
  return songComments.filter((comment) => comment.songId === songId);
}

export function getSongFiles(songId: string) {
  return sharedFiles.filter((file) => file.songId === songId);
}
