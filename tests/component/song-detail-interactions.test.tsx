import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  MockCommentComposer,
  TaskChecklist,
} from "@/components/song-detail-interactions";
import {
  currentUser,
  getSongTasks,
  members,
} from "@/lib/mock-data";

describe("TaskChecklist", () => {
  it("TODOを表示し、完了状態と未完了件数を切り替える", async () => {
    const user = userEvent.setup();
    render(<TaskChecklist tasks={getSongTasks("afterglow")} members={members} />);

    const checkbox = screen.getByRole("checkbox", {
      name: "ラスサビのギターを録り直すを完了にする",
    });

    expect(checkbox).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("3件 未完了")).toBeInTheDocument();

    await user.click(checkbox);

    expect(
      screen.getByRole("checkbox", {
        name: "ラスサビのギターを録り直すを未完了にする",
      }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("2件 未完了")).toBeInTheDocument();
  });
});

describe("MockCommentComposer", () => {
  it("本文とタイムスタンプを一時コメントとして追加する", async () => {
    const user = userEvent.setup();
    render(<MockCommentComposer currentUser={currentUser} />);

    const submitButton = screen.getByRole("button", { name: "画面に追加" });
    expect(submitButton).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: "コメント" }),
      "サビ前の音量を確認してください",
    );
    await user.type(
      screen.getByRole("textbox", {
        name: "コメントのタイムスタンプ、任意",
      }),
      "01:24",
    );
    await user.click(submitButton);

    const temporaryComments = screen.getByLabelText("今回追加したモックコメント");
    expect(
      within(temporaryComments).getByText("サビ前の音量を確認してください"),
    ).toBeInTheDocument();
    expect(within(temporaryComments).getByText(/01:24/)).toBeInTheDocument();
    expect(
      screen.getByText("画面に一時表示しました。保存・送信はされていません。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "コメント" })).toHaveValue("");
  });
});
