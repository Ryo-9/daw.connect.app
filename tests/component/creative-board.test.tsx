import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CreativeWorkspacePrototype } from "@/components/creative-board";
import {
  getSong,
  getSongCreativeItems,
  members,
} from "@/lib/mock-data";

const song = getSong("afterglow");
const items = getSongCreativeItems("afterglow");

if (!song) throw new Error("afterglow fixture is required");

describe("CreativeWorkspacePrototype", () => {
  it("Memo、Idea、Taskを同じBoardへ表示し、TaskだけにTask metadataを出す", () => {
    render(
      <CreativeWorkspacePrototype song={song} items={items} members={members} />,
    );

    const board = screen.getByRole("region", { name: "Creative Board" });
    expect(within(board).getAllByText("Memo")).not.toHaveLength(0);
    expect(within(board).getAllByText("Idea")).not.toHaveLength(0);
    expect(within(board).getAllByText("Task")).not.toHaveLength(0);
    expect(within(board).getAllByTestId("task-metadata")).toHaveLength(4);
    expect(
      within(board).getByText(/Prototype \/ non-persistent/),
    ).toBeInTheDocument();

    for (const item of board.querySelectorAll('[data-kind="MEMO"], [data-kind="IDEA"]')) {
      expect(within(item as HTMLElement).queryByTestId("task-metadata")).toBeNull();
    }
  });

  it("種類filterを画面内だけで切り替える", async () => {
    const user = userEvent.setup();
    render(
      <CreativeWorkspacePrototype song={song} items={items} members={members} />,
    );

    await user.click(screen.getByRole("button", { name: "Idea" }));

    const itemList = screen.getByLabelText("Creative items");
    expect(itemList.querySelectorAll('[data-kind="IDEA"]')).toHaveLength(2);
    expect(itemList.querySelector('[data-kind="MEMO"]')).toBeNull();
    expect(itemList.querySelector('[data-kind="TASK"]')).toBeNull();
    expect(screen.getByText("2件を表示")).toBeInTheDocument();
  });

  it("Focus Modeがannotation表示だけを隠し、元のitemsを変更しない", async () => {
    const user = userEvent.setup();
    render(
      <CreativeWorkspacePrototype song={song} items={items} members={members} />,
    );

    expect(screen.getAllByTestId("task-metadata")).toHaveLength(4);
    expect(screen.getByTestId("creative-anchor-marker")).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Focus Mode" }));
    expect(screen.getByRole("switch", { name: "Focus Mode" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("focus-mode-view")).toBeInTheDocument();
    expect(screen.queryByLabelText("Creative items")).toBeNull();
    expect(screen.queryByTestId("creative-anchor-marker")).toBeNull();

    await user.click(screen.getByRole("switch", { name: "Focus Mode" }));
    expect(screen.getAllByTestId("task-metadata")).toHaveLength(4);
    expect(screen.getByText("8件を表示")).toBeInTheDocument();
    expect(screen.getByTestId("creative-anchor-marker")).toBeInTheDocument();
  });
});
