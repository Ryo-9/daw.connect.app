import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SongFormPrototype, type SongFormDraft } from "@/components/song-form-prototype";

const initialValues: SongFormDraft = {
  title: "",
  status: "アイデア",
  bpm: "120",
  timeSignature: "4/4",
  musicalKey: "C major",
  daw: "未設定",
  versionName: "v0.1",
  versionNote: "",
  description: "",
  parts: [],
};

describe("SongFormPrototype", () => {
  it("入力を未保存プレビューへ反映し、保存操作は提供しない", async () => {
    const user = userEvent.setup();
    render(
      <SongFormPrototype
        mode="create"
        bandName="Lumen Echo"
        initialValues={initialValues}
      />,
    );

    expect(screen.getByRole("button", { name: "保存（未実装）" })).toBeDisabled();
    expect(screen.queryByLabelText(/ファイル/)).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /SONG TITLE/ }), "Night Drive");
    await user.clear(screen.getByRole("spinbutton", { name: "BPM" }));
    await user.type(screen.getByRole("spinbutton", { name: "BPM" }), "132");
    await user.click(screen.getByRole("checkbox", { name: "Guitar" }));
    await user.type(
      screen.getByRole("textbox", { name: "VERSION NOTE" }),
      "イントロの構成を確認",
    );
    await user.click(screen.getByRole("button", { name: "Previewに反映" }));

    const preview = screen.getByLabelText("未保存の楽曲プレビュー");
    expect(within(preview).getByRole("heading", { name: "Night Drive" })).toBeInTheDocument();
    expect(within(preview).getByText("132")).toBeInTheDocument();
    expect(within(preview).getByText("Guitar")).toBeInTheDocument();
    expect(within(preview).getByText("イントロの構成を確認")).toBeInTheDocument();
    expect(
      screen.getByText("プレビューを更新しました。入力内容は保存・送信されていません。"),
    ).toBeInTheDocument();
  });
});
