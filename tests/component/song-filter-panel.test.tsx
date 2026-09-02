import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SongFilterPanel } from "@/components/song-filter-panel";
import { getBandSongs } from "@/lib/mock-data";

const songs = getBandSongs("lumen-echo");

describe("SongFilterPanel", () => {
  it("楽曲名で検索する", async () => {
    const user = userEvent.setup();
    render(<SongFilterPanel songs={songs} />);

    await user.type(screen.getByRole("searchbox", { name: "楽曲名" }), "  paper  ");

    expect(screen.getByRole("link", { name: /Paper Moon/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Afterglow/ })).not.toBeInTheDocument();
    expect(screen.getByText("1曲")).toBeInTheDocument();
  });

  it("ステータスで絞り込む", async () => {
    const user = userEvent.setup();
    render(<SongFilterPanel songs={songs} />);

    await user.click(screen.getByRole("button", { name: /アイデア/ }));

    expect(screen.getByRole("link", { name: /Blue Hour/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Afterglow/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /アイデア/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("一致しない検索で0件状態を表示する", async () => {
    const user = userEvent.setup();
    render(<SongFilterPanel songs={songs} />);

    await user.type(screen.getByRole("searchbox", { name: "楽曲名" }), "存在しない楽曲");

    expect(screen.getByRole("status")).toHaveTextContent("該当する楽曲がありません");
    expect(
      screen.getByRole("button", { name: "すべての楽曲を表示" }),
    ).toBeInTheDocument();
  });
});
